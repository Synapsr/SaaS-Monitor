import CryptoKit
import Foundation

/// A screen's link, `https://<instance>/d/<token>`: the instance answering for it, and its token
/// (`parseScreenLink` in `src/screens/link.ts`, whose rules it keeps). Instances may live under a
/// sub-path (`https://acme.dev/monitor/d/<token>`), or on a local network
/// (`http://192.168.1.20:3000/d/<token>`).
struct ScreenLink: Equatable, Sendable {
  /// Origin of the instance and its path, without trailing slash: `https://saas-monitor.com`.
  let baseUrl: String
  let token: String

  /// The demo screen, fed by a simulation: for trying the app without SaaS Monitor.
  static let demo = ScreenLink(baseUrl: "https://saas-monitor.com", token: "demo")

  init(baseUrl: String, token: String) {
    self.baseUrl = baseUrl
    self.token = token
  }

  /// Reads a link, pasted, possibly inside a sentence or without its scheme; `nil` for anything
  /// that isn't one.
  init?(_ input: String) {
    let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
    let candidate = text.firstMatch(of: /(?i)https?:\/\/\S+/).map { String($0.output) } ?? text
    let withScheme = candidate.contains(/^[A-Za-z][A-Za-z0-9+.\-]*:\/\//) ? candidate : "https://\(candidate)"
    guard let parts = withScheme.firstMatch(of: /^(?i)(https?):\/\/(?:[^@\/?#\s]*@)?([^\/?#\s]+)([^?#\s]*)/)
    else { return nil }

    let scheme = parts.output.1.lowercased()
    let host = parts.output.2.lowercased()
    guard host.wholeMatch(of: /[a-z0-9.\-]+(:\d{1,5})?/) != nil
      || host.wholeMatch(of: /\[[0-9a-f:.]+\](:\d{1,5})?/) != nil
    else { return nil }

    let segments = parts.output.3.split(separator: "/").map(String.init)
    // The last `d` segment followed by the token: a sub-path could itself contain a `d`.
    guard let index = segments.lastIndex(of: "d"), index == segments.count - 2,
      let token = segments[index + 1].removingPercentEncoding,
      token.wholeMatch(of: /[A-Za-z0-9_\-]{4,256}/) != nil
    else { return nil }

    let prefix = segments[..<index].map { "/\($0)" }.joined()
    // Plain HTTP stays on the local network: on the internet, an instance answers over HTTPS.
    let secure = scheme == "https" || !Self.isLocalHost(host)
    baseUrl = "\(secure ? "https" : "http")://\(host)\(prefix)"
    self.token = token
  }

  /// The link as its instance writes it.
  var url: URL? {
    let token = token.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? token
    return URL(string: "\(baseUrl)/d/\(token)")
  }

  /// The first 16 hex characters of the SHA-256 of the token: stable and opaque, like the
  /// iPhone app's (`src/screens/key.ts`).
  var key: String {
    SHA256.hash(data: Data(token.utf8)).prefix(8).map { String(format: "%02x", $0) }.joined()
  }

  /// Where the instance lives, short enough for a list: `saas-monitor.com`, `acme.dev/monitor`.
  var instanceLabel: String {
    baseUrl.replacing(/^(?i)https:\/\//, with: "")
  }

  /// Hosts of a local network, the only ones reached over plain HTTP: addresses, `localhost` and
  /// other single-label names, and `.local` names.
  private static func isLocalHost(_ host: String) -> Bool {
    let name = host.replacing(/:\d{1,5}$/, with: "")
    if name.hasPrefix("[") || name.wholeMatch(of: /\d{1,3}(\.\d{1,3}){3}/) != nil { return true }
    return !name.contains(".") || name.hasSuffix(".local")
  }
}

extension SharedScreen {
  init(_ link: ScreenLink, name: String, accessProof: String?) {
    self.init(key: link.key, name: name, baseUrl: link.baseUrl, token: link.token, accessProof: accessProof)
  }

  var link: ScreenLink { ScreenLink(baseUrl: baseUrl, token: token) }

  /// A file or an endpoint of the screen's instance: `/sounds/register/payment.wav`.
  func url(_ path: String) -> URL? {
    URL(string: baseUrl + path)
  }

  /// Where its server says a moment in the screen's own words.
  var announcementURL: URL? {
    let token = token.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? token
    return url("/api/screens/\(token)/announcement")
  }
}
