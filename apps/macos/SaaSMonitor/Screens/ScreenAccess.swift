import Foundation

/// Why a screen couldn't be added.
enum ScreenAccessError: Error, Equatable, Sendable {
  /// The screen asks for its password, or the one given is wrong.
  case passwordNeeded
  case wrongPassword
  case tooManyAttempts
  /// The link no longer works: the screen was deleted, or its link regenerated.
  case gone
  /// The instance can't be reached, or answered something else.
  case unavailable
}

/// Opens a screen from its link, as the iPhone app does (server API v1): its state, and the proof
/// of its password when it has one.
struct ScreenAccess: Sendable {
  var session = URLSession.shared
  var client = ScreenClient()

  /// The screen's current state, with the proof of `password` when it asks for one.
  func open(_ link: ScreenLink, password: String?) async throws(ScreenAccessError) -> (
    state: DisplayState, proof: String?
  ) {
    let proof: String? =
      if let password, !password.isEmpty { try await unlock(link, password: password) } else { nil }
    let screen = SharedScreen(link, name: "", accessProof: proof)
    do {
      return (try await client.state(of: screen), proof)
    } catch {
      switch error {
      case .locked: throw proof == nil ? .passwordNeeded : .wrongPassword
      case .gone: throw .gone
      case .unavailable: throw .unavailable
      }
    }
  }

  /// `POST /api/screens/{token}/access`: the proof of the password, sent as `X-Screen-Access`.
  private func unlock(_ link: ScreenLink, password: String) async throws(ScreenAccessError) -> String {
    let token = link.token.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? link.token
    guard let url = URL(string: "\(link.baseUrl)/api/screens/\(token)/access"),
      let body = try? JSONEncoder().encode(["password": password])
    else { throw .gone }
    var request = URLRequest(url: url, timeoutInterval: 15)
    request.httpMethod = "POST"
    request.httpBody = body
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("application/json", forHTTPHeaderField: "Accept")

    let data: Data
    let response: URLResponse
    do {
      (data, response) = try await session.data(for: request)
    } catch {
      throw .unavailable
    }
    switch (response as? HTTPURLResponse)?.statusCode {
    case 200:
      guard let proof = (try? JSONDecoder().decode([String: String].self, from: data))?["proof"] else {
        throw .unavailable
      }
      return proof
    case 401: throw .wrongPassword
    case 404: throw .gone
    case 429: throw .tooManyAttempts
    default: throw .unavailable
    }
  }
}
