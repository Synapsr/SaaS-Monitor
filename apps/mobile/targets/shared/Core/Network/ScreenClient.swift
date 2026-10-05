import Foundation

/// Why a screen's state couldn't be fetched.
enum ScreenFetchError: Error, Sendable {
  /// `401`: the screen asks for its password (it changed, or the proof expired).
  case locked
  /// `404`: the link no longer works, e.g. the screen was deleted or its link regenerated.
  case gone
  /// The instance can't be reached, or answered something else.
  case unavailable
}

/// Fetches a screen's state from its instance (server API v1, see AGENTS.md).
struct ScreenClient: Sendable {
  var session = URLSession.shared
  /// Widgets get a few seconds to refresh: better show the last known numbers than nothing.
  var timeout: TimeInterval = 15

  func state(of screen: SharedScreen) async throws(ScreenFetchError) -> DisplayState {
    guard let request = request(for: screen) else { throw .gone }
    let data: Data
    let response: URLResponse
    do {
      (data, response) = try await session.data(for: request)
    } catch {
      throw .unavailable
    }
    switch (response as? HTTPURLResponse)?.statusCode {
    case 200:
      guard let state = try? ScreenJSON.decoder().decode(DisplayState.self, from: data) else {
        throw .unavailable
      }
      return state
    case 401: throw .locked
    case 404: throw .gone
    default: throw .unavailable
    }
  }

  private func request(for screen: SharedScreen) -> URLRequest? {
    guard var url = URL(string: screen.baseUrl), url.scheme != nil else { return nil }
    url.append(path: "api/screens/\(screen.token)/state")
    var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: timeout)
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    if let proof = screen.accessProof {
      request.setValue(proof, forHTTPHeaderField: "X-Screen-Access")
    }
    return request
  }
}
