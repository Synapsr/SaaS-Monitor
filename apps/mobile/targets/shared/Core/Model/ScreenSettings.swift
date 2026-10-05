import Foundation

/// The settings of a screen that change how widgets and the watch show it (`ScreenSettings` in
/// `src/lib/screens/settings.ts`). Missing fields take the web app's defaults.
struct ScreenSettings: Codable, Sendable {
  var currency = "usd"
  /// IANA time zone that defines "today".
  var timeZone = "UTC"
  var metric = Metric.mrr
  /// Target of `metric` in major units ("10000" for $10k); `nil` follows the milestone ladder.
  var goal: Int?
  /// A preset (`emerald`, `violet`, `sky`, `amber`, `rose`) or a custom color, `#rrggbb`.
  var accent = "emerald"
  var theme = Theme.dark
  var language = Language.en

  enum Metric: String, Codable, Sendable, FallbackDecodable {
    case mrr, arr
    static var fallback: Metric { .mrr }
  }

  enum Theme: String, Codable, Sendable, FallbackDecodable {
    case dark, light
    static var fallback: Theme { .dark }
  }

  init() {}

  init(from decoder: any Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let defaults = ScreenSettings()
    currency = try container.decodeIfPresent(String.self, forKey: .currency) ?? defaults.currency
    timeZone = try container.decodeIfPresent(String.self, forKey: .timeZone) ?? defaults.timeZone
    metric = try container.decodeIfPresent(Metric.self, forKey: .metric) ?? defaults.metric
    goal = try container.decodeIfPresent(Int.self, forKey: .goal)
    accent = try container.decodeIfPresent(String.self, forKey: .accent) ?? defaults.accent
    theme = try container.decodeIfPresent(Theme.self, forKey: .theme) ?? defaults.theme
    language = try container.decodeIfPresent(Language.self, forKey: .language) ?? defaults.language
  }
}
