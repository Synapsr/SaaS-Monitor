import Foundation

/// What a moment's notification says it plays, as the SaaS Monitor server sends it: `audio` in the
/// app's data (`body`, where Expo's pushes carry it too), with the key of its screen. See
/// `MomentAudio` in `src/contract/display/moment-audio.ts`.
struct NotificationMoment: Sendable {
  /// The first 16 hex characters of the SHA-256 of the screen's token.
  let screen: String
  let audio: MomentAudio

  init?(userInfo: [AnyHashable: Any]) {
    let data = userInfo["body"] as? [String: Any]
    guard
      let screen = (data?["screen"] ?? userInfo["screen"]) as? String,
      screen.range(of: "^[0-9a-f]{16}$", options: .regularExpression) != nil,
      let audio = MomentAudio(data?["audio"] ?? userInfo["audio"])
    else { return nil }
    self.screen = screen
    self.audio = audio
  }
}

struct MomentAudio: Sendable {
  struct Sound: Sendable {
    let pack: String
    let event: String
    /// 0 to 1, squared as it plays.
    let volume: Float
  }

  struct Voice: Sendable {
    let id: String
    let phrase: String
    /// 0 to 1, squared as it plays.
    let volume: Float
    /// Once the sound has rung this long.
    let delay: TimeInterval
    /// The body of `POST …/announcement` for the screen's own words; `nil` for recorded phrases.
    let announcement: Data?
  }

  let sound: Sound?
  let voice: Voice?

  /// Reads the JSON object of `audio`, or its text (as FCM carries it). Names become paths of
  /// URLs: only plain words are taken.
  init?(_ value: Any?) {
    var object = value as? [String: Any]
    if object == nil, let text = value as? String, let data = text.data(using: .utf8) {
      object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
    }
    guard let object else { return nil }

    if let sound = object["sound"] as? [String: Any],
      let pack = Self.word(sound["pack"]),
      let event = Self.word(sound["event"]),
      let volume = Self.level(sound["volume"])
    {
      self.sound = Sound(pack: pack, event: event, volume: volume)
    } else {
      self.sound = nil
    }

    if let voice = object["voice"] as? [String: Any],
      let id = Self.word(voice["id"]),
      let phrase = Self.word(voice["phrase"]),
      let volume = Self.level(voice["volume"])
    {
      let delay = (voice["delayMs"] as? NSNumber)?.doubleValue ?? 0
      let announcement = (voice["announcement"] as? [String: Any]).flatMap {
        try? JSONSerialization.data(withJSONObject: ["moment": $0, "format": "wav"])
      }
      self.voice = Voice(
        id: id, phrase: phrase, volume: volume, delay: min(max(delay, 0), 5_000) / 1_000,
        announcement: announcement)
    } else {
      self.voice = nil
    }

    if sound == nil && voice == nil { return nil }
  }

  private static func word(_ value: Any?) -> String? {
    guard let text = value as? String,
      text.range(of: "^[A-Za-z]{1,40}$", options: .regularExpression) != nil
    else { return nil }
    return text
  }

  private static func level(_ value: Any?) -> Float? {
    guard let number = value as? NSNumber else { return nil }
    return min(max(number.floatValue, 0), 1)
  }
}
