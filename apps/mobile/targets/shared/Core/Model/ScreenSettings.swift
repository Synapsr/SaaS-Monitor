import Foundation

/// The settings of a screen that change how the apps show it (`ScreenSettings` in
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
  /// Where each event shows and plays, by event (`ScreenEvent`).
  var events: [String: EventChannels] = [:]
  /// How long a moment stays on screen, in seconds.
  var momentSeconds = 10
  /// Customers are named on the screen, and by its voice.
  var showCustomerNames = false
  var sound = Sound()
  var voice = Voice()

  struct EventChannels: Codable, Sendable {
    var moment = true
    var sound = true
    /// `nil` when the state doesn't say: the event's default (`ScreenEvent.isSaidByDefault`).
    var voice: Bool?

    init() {}

    init(from decoder: any Decoder) throws {
      let container = try decoder.container(keyedBy: CodingKeys.self)
      moment = try container.decodeIfPresent(Bool.self, forKey: .moment) ?? true
      sound = try container.decodeIfPresent(Bool.self, forKey: .sound) ?? true
      voice = try container.decodeIfPresent(Bool.self, forKey: .voice)
    }
  }

  /// The sound of moments, from the files every instance serves (`/sounds/{pack}/{event}.wav`).
  struct Sound: Codable, Sendable {
    var enabled = true
    var pack = "register"
    /// 0 to 1, squared as it plays: the slider feels even to the ear.
    var volume = 0.7

    init() {}

    init(from decoder: any Decoder) throws {
      let container = try decoder.container(keyedBy: CodingKeys.self)
      let defaults = Sound()
      enabled = try container.decodeIfPresent(Bool.self, forKey: .enabled) ?? defaults.enabled
      pack = try container.decodeIfPresent(String.self, forKey: .pack) ?? defaults.pack
      volume = try container.decodeIfPresent(Double.self, forKey: .volume) ?? defaults.volume
    }
  }

  /// A voice saying what just happened, over the tail of the sound.
  struct Voice: Codable, Sendable {
    var enabled = false
    /// `nil`, or a voice of another language: the first voice of the screen's language.
    var voiceId: String?
    /// 0 to 1, squared as it plays, like the sound's.
    var volume = 0.8

    init() {}

    init(from decoder: any Decoder) throws {
      let container = try decoder.container(keyedBy: CodingKeys.self)
      let defaults = Voice()
      enabled = try container.decodeIfPresent(Bool.self, forKey: .enabled) ?? defaults.enabled
      voiceId = try container.decodeIfPresent(String.self, forKey: .voiceId)
      volume = try container.decodeIfPresent(Double.self, forKey: .volume) ?? defaults.volume
    }
  }

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
    events = try container.decodeIfPresent([String: EventChannels].self, forKey: .events) ?? [:]
    momentSeconds = try container.decodeIfPresent(Int.self, forKey: .momentSeconds) ?? defaults.momentSeconds
    showCustomerNames =
      try container.decodeIfPresent(Bool.self, forKey: .showCustomerNames) ?? defaults.showCustomerNames
    sound = try container.decodeIfPresent(Sound.self, forKey: .sound) ?? defaults.sound
    voice = try container.decodeIfPresent(Voice.self, forKey: .voice) ?? defaults.voice
  }
}
