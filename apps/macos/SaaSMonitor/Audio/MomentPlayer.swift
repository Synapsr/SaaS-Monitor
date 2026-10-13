import AVFoundation
import os

/// Plays a moment as its walls do (`audio-timing.ts` on the web): its sound at once, then its
/// voice once the sound has rung for a while.
@MainActor
final class MomentPlayer {
  /// A sound that could not start within this delay is dropped: a late "ka-ching" would lie.
  static let maxSoundDelay: TimeInterval = 1
  /// Nor does a voice start this late: by then its moment has left the notch.
  static let maxSpeechLateness: TimeInterval = 9

  private let files = AudioFiles()
  private static let log = Logger(subsystem: "com.saasmonitor.mac", category: "audio")
  /// Players stay referenced while they play.
  private var players: [AVAudioPlayer] = []

  func play(_ audio: MomentAudio, of screen: SharedScreen) {
    let start = Date.now
    if let sound = audio.sound, let url = screen.url("/sounds/\(sound.pack)/\(sound.event.rawValue).wav") {
      Task {
        guard let data = await files.data(at: url, within: Self.maxSoundDelay) else { return }
        play(data, volume: sound.volume)
      }
    }
    if let voice = audio.voice {
      Task {
        guard let data = await voiceData(voice, of: screen) else { return }
        let elapsed = Date.now.timeIntervalSince(start)
        guard elapsed < Self.maxSpeechLateness else { return }
        if voice.delay > elapsed { try? await Task.sleep(for: .seconds(voice.delay - elapsed)) }
        play(data, volume: voice.volume)
      }
    }
  }

  /// Downloads a screen's sounds ahead, so that its first moment rings on time.
  func prefetch(pack: String, of screen: SharedScreen) {
    let urls = SoundEvent.allCases.compactMap { screen.url("/sounds/\(pack)/\($0.rawValue).wav") }
    Task {
      for url in urls { _ = await files.data(at: url) }
    }
  }

  /// The screen's own words, else its recorded phrase.
  private func voiceData(_ voice: MomentAudio.Voice, of screen: SharedScreen) async -> Data? {
    if let body = voice.announcement?.body, let url = screen.announcementURL,
      let data = await files.announcement(at: url, body: body, proof: screen.accessProof)
    {
      return data
    }
    guard let url = screen.url("/voices/\(voice.id)/\(voice.phrase).mp3") else { return nil }
    return await files.data(at: url)
  }

  private func play(_ data: Data, volume: Double) {
    players.removeAll { !$0.isPlaying }
    guard let player = try? AVAudioPlayer(data: data) else {
      Self.log.error("Unreadable audio: \(data.count) bytes")
      return
    }
    player.volume = Float(volume * volume)
    player.play()
    players.append(player)
  }
}

/// The sounds and recorded phrases of instances, kept a week in the app's caches: an instance
/// serves the same files for weeks.
private actor AudioFiles {
  private static let lifetime: TimeInterval = 7 * 24 * 3_600
  private static let timeout: TimeInterval = 8

  private let directory = URL.cachesDirectory.appending(path: "MomentAudio", directoryHint: .isDirectory)

  func data(at url: URL) async -> Data? {
    let file = directory.appending(path: "\(Self.stableHash(url.absoluteString)).\(url.pathExtension)")
    let modified = try? file.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate
    if let modified, Date.now.timeIntervalSince(modified) < Self.lifetime,
      let data = try? Data(contentsOf: file)
    {
      return data
    }
    guard let data = await download(URLRequest(url: url, timeoutInterval: Self.timeout)) else {
      return nil
    }
    try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    try? data.write(to: file, options: .atomic)
    return data
  }

  /// `data(at:)`, unless it takes longer than `delay`.
  func data(at url: URL, within delay: TimeInterval) async -> Data? {
    await withTaskGroup(of: Data?.self) { group in
      group.addTask { await self.data(at: url) }
      group.addTask {
        try? await Task.sleep(for: .seconds(delay))
        return nil
      }
      let first = await group.next() ?? nil
      group.cancelAll()
      return first
    }
  }

  /// What the screen's server says in the screen's own words, as WAV.
  func announcement(at url: URL, body: Data, proof: String?) async -> Data? {
    var request = URLRequest(url: url, timeoutInterval: Self.timeout)
    request.httpMethod = "POST"
    request.httpBody = body
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    if let proof { request.setValue(proof, forHTTPHeaderField: "X-Screen-Access") }
    return await download(request)
  }

  private func download(_ request: URLRequest) async -> Data? {
    guard let (data, response) = try? await URLSession.shared.data(for: request),
      (response as? HTTPURLResponse)?.statusCode == 200
    else { return nil }
    return data
  }

  /// FNV-1a: the same name for the same URL, from one launch to the next.
  private static func stableHash(_ text: String) -> String {
    var hash: UInt64 = 0xcbf2_9ce4_8422_2325
    for byte in text.utf8 {
      hash = (hash ^ UInt64(byte)) &* 0x0000_0100_0000_01b3
    }
    return String(hash, radix: 16)
  }
}
