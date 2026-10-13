import Foundation

/// What a moment plays on a screen, by its settings (`momentAudio` in the web app's
/// `src/lib/display/moment-audio.ts`, whose rules it keeps): its sound at once, then its voice
/// over the sound's tail. Both come from the files every instance serves.
struct MomentAudio: Equatable, Sendable {
  struct Sound: Equatable, Sendable {
    let pack: String
    let event: SoundEvent
    /// 0 to 1, squared as it plays: the screen's slider feels even to the ear.
    let volume: Double
  }

  struct Voice: Equatable, Sendable {
    /// One of the web app's `VOICES`.
    let id: String
    /// The recorded phrase it says, when the screen's own words can't be had.
    let phrase: String
    /// 0 to 1, squared as it plays.
    let volume: Double
    /// Once the moment's sound has rung this long, even when it is muted.
    let delay: TimeInterval
    /// What to ask the screen's server to say in the screen's own words; `nil` for recorded
    /// phrases.
    let announcement: Announcement?
  }

  let sound: Sound?
  let voice: Voice?

  /// `nil` when the moment plays nothing on this screen.
  init?(_ moment: Moment, settings: ScreenSettings, personalizedVoice: Bool) {
    let soundEvent = moment.sound(on: settings)
    let phrase = moment.phrase(on: settings)
    let voiceId = phrase == nil ? nil : Voices.of(settings.language, chosen: settings.voice.voiceId)

    sound = soundEvent.flatMap { event in
      settings.sound.volume > 0
        ? Sound(pack: settings.sound.pack, event: event, volume: settings.sound.volume) : nil
    }
    voice =
      if let phrase, let voiceId, settings.voice.volume > 0 {
        Voice(
          id: voiceId, phrase: phrase, volume: settings.voice.volume, delay: soundEvent?.lead ?? 0,
          announcement: personalizedVoice ? Announcement(moment) : nil)
      } else {
        nil
      }
    if sound == nil && voice == nil { return nil }
  }
}

/// The sounds of the web app (`src/lib/sounds`), served as `/sounds/{pack}/{event}.wav`.
enum SoundEvent: String, CaseIterable, Sendable {
  case payment, customer, mrrUp, mrrDown, milestone

  /// How long it rings before the voice speaks over its tail (`SOUND_LEAD_MS`).
  var lead: TimeInterval {
    switch self {
    case .payment: 0.9
    case .customer: 0.7
    case .mrrUp, .mrrDown: 0.8
    case .milestone: 1.6
    }
  }
}

/// The voices of the web app (`VOICES` in `src/lib/voice/voices.ts`), by language, the first being
/// each language's default.
enum Voices {
  static let byLanguage: [Language: [String]] = [
    .en: ["harper", "sterling"],
    .fr: ["maelys", "marius"],
    .de: ["femke", "erik"],
    .es: ["noa", "marcos"],
    .pt: ["bianca", "davi"],
  ]

  /// The screen's voice: its chosen one when it speaks the screen's language, else the first of
  /// that language; `nil` when no voice speaks it.
  static func of(_ language: Language, chosen: String?) -> String? {
    let voices = byLanguage[language] ?? []
    return voices.first { $0 == chosen } ?? voices.first
  }
}

/// How the app asks a screen's server to say a moment (`POST /api/screens/{token}/announcement`,
/// `momentRequest` on the web): it names the moment, not what to say, which the server writes from
/// the screen's own state.
struct Announcement: Equatable, Sendable, Encodable {
  enum Kind: Equatable, Sendable {
    case payment(String)
    case movement(String)
    case customer(String)
    case milestone(amount: Int, metric: ScreenSettings.Metric, isGoal: Bool)
    case test
  }

  let id: String
  let kind: Kind

  init?(_ moment: Moment) {
    id = moment.id
    switch moment {
    case .payment(let item): kind = .payment(item.id)
    case .movement(let item): kind = .movement(item.id)
    case .customer(let item): kind = .customer(item.id)
    case .milestone(let amount, let metric, let isGoal):
      kind = .milestone(amount: amount, metric: metric, isGoal: isGoal)
    case .test: kind = .test
    case .summary: return nil
    }
  }

  /// The request's body: `{ "moment": …, "format": "wav" }`.
  var body: Data? {
    try? JSONEncoder().encode(["moment": AnyEncodable(self), "format": AnyEncodable("wav")])
  }

  private enum CodingKeys: String, CodingKey {
    case kind, id, paymentId, movementId, customerId, amount, metric, isGoal, accountId
  }

  func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(id, forKey: .id)
    switch kind {
    case .payment(let paymentId):
      try container.encode("payment", forKey: .kind)
      try container.encode(paymentId, forKey: .paymentId)
    case .movement(let movementId):
      try container.encode("movement", forKey: .kind)
      try container.encode(movementId, forKey: .movementId)
    case .customer(let customerId):
      try container.encode("customer", forKey: .kind)
      try container.encode(customerId, forKey: .customerId)
    case .milestone(let amount, let metric, let isGoal):
      try container.encode("milestone", forKey: .kind)
      try container.encode(amount, forKey: .amount)
      try container.encode(metric.rawValue, forKey: .metric)
      try container.encode(isGoal, forKey: .isGoal)
      // The screen's total: the server expects the key, empty.
      try container.encodeNil(forKey: .accountId)
    case .test:
      try container.encode("test", forKey: .kind)
    }
  }
}

private struct AnyEncodable: Encodable {
  let value: any Encodable

  init(_ value: any Encodable) {
    self.value = value
  }

  func encode(to encoder: any Encoder) throws {
    try value.encode(to: encoder)
  }
}

extension ScreenEvent {
  /// Losses are not said out loud unless the screen asks for it (`eventSchema` on the web).
  var isSaidByDefault: Bool {
    switch self {
    case .downgrade, .cancellation, .unpaid: false
    default: true
    }
  }
}

extension Moment {
  /// The events it stands for (`momentEvents` on the web).
  var events: [ScreenEvent] {
    switch self {
    case .payment(let item), .movement(let item), .customer(let item): [ScreenEvent(item)]
    case .milestone: [.milestone]
    case .summary(let summary): summary.events
    case .test: [.payment]
    }
  }

  private enum Channel {
    case sound, voice
  }

  /// Whether it plays on `channel`: one of its events does, and the sound or the voice is on. A
  /// test celebration was asked for: it plays wherever its screen allows (`momentPlays`).
  private func plays(on settings: ScreenSettings, _ channel: Channel) -> Bool {
    switch channel {
    case .sound where !settings.sound.enabled, .voice where !settings.voice.enabled: return false
    default: break
    }
    if case .test = self { return true }
    return events.contains { event in
      let channels = settings.events[event.rawValue]
      return switch channel {
      case .sound: channels?.sound ?? true
      case .voice: channels?.voice ?? event.isSaidByDefault
      }
    }
  }

  /// Its sound, when the screen's settings let it play (`momentSound`).
  func sound(on settings: ScreenSettings) -> SoundEvent? {
    guard plays(on: settings, .sound) else { return nil }
    switch self {
    case .payment, .test: return .payment
    case .movement(let item): return item.isMrrIncrease ? .mrrUp : .mrrDown
    case .customer: return .customer
    case .milestone: return .milestone
    case .summary(let summary):
      if summary.revenue > 0 { return .payment }
      if summary.mrrChange < 0 { return .mrrDown }
      if summary.mrrChange == 0 && summary.customers > 0 { return .customer }
      return .mrrUp
    }
  }

  /// The recorded phrase a voice says about it, the one that says the most (`momentSpeech`);
  /// `nil` when the screen keeps it quiet, no voice speaks its language, or it sums up a burst.
  func phrase(on settings: ScreenSettings) -> String? {
    if case .summary = self { return nil }
    guard Voices.byLanguage[settings.language] != nil, plays(on: settings, .voice),
      let event = events.first
    else { return nil }
    switch self {
    case .milestone(_, _, let isGoal) where isGoal:
      return "goal"
    case .movement(let item) where event == .cancellation:
      switch item.churn?.reason {
      case .scheduled: return "cancellationScheduled"
      case .paused: return "pause"
      default: return event.rawValue
      }
    default:
      return event.rawValue
    }
  }
}
