import AVFoundation
import UserNotifications
import os

/// Makes the sound of a moment's notification: the screen's sound, then its voice over the sound's
/// tail, as its wall display plays them (`momentAudio` on the web), in one file the system plays.
enum MomentSound {
  /// Mono, at the sounds' own rate: CD quality.
  static let sampleRate = 44_100.0
  /// iOS plays the default sound instead of a longer one (30 seconds).
  static let maxSeconds = 29.0
  /// A request that takes longer is not worth waiting for: the default sound plays instead.
  static let requestTimeout: TimeInterval = 8
  /// Sounds and recorded phrases are kept this long, should the instance get new ones.
  static let cacheLifetime: TimeInterval = 7 * 24 * 3_600
  /// Sounds made for earlier notifications are deleted after this long: they played.
  static let soundLifetime: TimeInterval = 10 * 60

  private static let log = Logger(
    subsystem: "com.saasmonitor.app.notification-service", category: "sound")

  /// The name of the sound file made for the moment, in the App Group's `Library/Sounds`; `nil`
  /// when nothing could be made of it.
  static func make(_ audio: MomentAudio, of screen: SharedScreen) async -> UNNotificationSoundName? {
    async let sound = soundSamples(audio.sound, of: screen)
    async let voice = voiceSamples(audio.voice, of: screen)
    let (soundSamples, voiceSamples) = await (sound, voice)
    if Task.isCancelled || (soundSamples == nil && voiceSamples == nil) { return nil }

    let samples = mix(
      sound: soundSamples.map { ($0, audio.sound?.volume ?? 0) },
      voice: voiceSamples.map { ($0, audio.voice?.volume ?? 0) },
      delay: audio.voice?.delay ?? 0)
    do {
      let name = try write(samples)
      log.info("Made \(name.rawValue, privacy: .public): \(Double(samples.count) / sampleRate) s")
      return name
    } catch {
      log.error("Could not write the sound: \(error.localizedDescription, privacy: .public)")
      return nil
    }
  }

  // MARK: - Sound and voice

  private static func soundSamples(_ sound: MomentAudio.Sound?, of screen: SharedScreen) async
    -> [Float]?
  {
    guard let sound, let url = screen.url("/sounds/\(sound.pack)/\(sound.event).wav") else {
      return nil
    }
    do {
      return try samples(of: try await cachedFile(url))
    } catch {
      log.error("No sound: \(error.localizedDescription, privacy: .public)")
      return nil
    }
  }

  /// The screen's own words, else its recorded phrase.
  private static func voiceSamples(_ voice: MomentAudio.Voice?, of screen: SharedScreen) async
    -> [Float]?
  {
    guard let voice else { return nil }
    if let body = voice.announcement, let url = screen.announcementURL {
      do {
        return try await announcement(url, body: body, proof: screen.accessProof)
      } catch {
        log.info("Recorded phrase instead: \(error.localizedDescription, privacy: .public)")
      }
    }
    guard let url = screen.url("/voices/\(voice.id)/\(voice.phrase).mp3") else { return nil }
    do {
      return try samples(of: try await cachedFile(url))
    } catch {
      log.error("No voice: \(error.localizedDescription, privacy: .public)")
      return nil
    }
  }

  /// What the screen's server says in the screen's own words, as WAV.
  private static func announcement(_ url: URL, body: Data, proof: String?) async throws -> [Float] {
    var request = URLRequest(url: url, timeoutInterval: requestTimeout)
    request.httpMethod = "POST"
    request.httpBody = body
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    if let proof { request.setValue(proof, forHTTPHeaderField: "X-Screen-Access") }
    let data = try await download(request)
    let file = FileManager.default.temporaryDirectory
      .appendingPathComponent("announcement-\(UUID().uuidString).wav")
    try data.write(to: file)
    defer { try? FileManager.default.removeItem(at: file) }
    return try samples(of: file)
  }

  // MARK: - Files

  private static func download(_ request: URLRequest) async throws -> Data {
    let (data, response) = try await URLSession.shared.data(for: request)
    guard let status = (response as? HTTPURLResponse)?.statusCode, status == 200 else {
      throw MomentSoundError.unavailable
    }
    return data
  }

  /// The file at `url`, in the App Group's caches: an instance serves the same files for weeks.
  private static func cachedFile(_ url: URL) async throws -> URL {
    guard let container = SharedSettings.container else { throw MomentSoundError.noAppGroup }
    let directory = container.appendingPathComponent("Library/Caches/MomentAudio", isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let file = directory.appendingPathComponent(
      "\(stableHash(url.absoluteString)).\(url.pathExtension)")
    let modified = try? file.resourceValues(forKeys: [.contentModificationDateKey])
      .contentModificationDate
    if let modified, Date().timeIntervalSince(modified) < cacheLifetime { return file }

    let data = try await download(URLRequest(url: url, timeoutInterval: requestTimeout))
    try data.write(to: file, options: .atomic)
    return file
  }

  /// FNV-1a: the same name for the same URL, from one launch of the extension to the next.
  private static func stableHash(_ text: String) -> String {
    var hash: UInt64 = 0xcbf2_9ce4_8422_2325
    for byte in text.utf8 {
      hash = (hash ^ UInt64(byte)) &* 0x0000_0100_0000_01b3
    }
    return String(hash, radix: 16)
  }

  // MARK: - Audio

  /// The samples of an audio file (WAV, MP3…), mono at `sampleRate`.
  private static func samples(of url: URL) throws -> [Float] {
    let file = try AVAudioFile(forReading: url)
    let input = file.processingFormat
    guard file.length > 0,
      Double(file.length) / input.sampleRate <= maxSeconds,
      let buffer = AVAudioPCMBuffer(pcmFormat: input, frameCapacity: AVAudioFrameCount(file.length))
    else { throw MomentSoundError.unreadable }
    try file.read(into: buffer)

    guard
      let output = AVAudioFormat(
        commonFormat: .pcmFormatFloat32, sampleRate: sampleRate, channels: 1, interleaved: false)
    else { throw MomentSoundError.unreadable }
    if input.sampleRate == sampleRate, input.channelCount == 1, !input.isInterleaved,
      input.commonFormat == .pcmFormatFloat32
    {
      return channel(of: buffer)
    }

    guard let converter = AVAudioConverter(from: input, to: output),
      let converted = AVAudioPCMBuffer(
        pcmFormat: output,
        frameCapacity: AVAudioFrameCount(Double(buffer.frameLength) * sampleRate / input.sampleRate)
          + 4_096)
    else { throw MomentSoundError.unreadable }
    // Both channels of a stereo file, rather than its left one.
    converter.downmix = true
    var fed = false
    var error: NSError?
    let status = converter.convert(to: converted, error: &error) { _, state in
      if fed {
        state.pointee = .endOfStream
        return nil
      }
      fed = true
      state.pointee = .haveData
      return buffer
    }
    if status == .error { throw error ?? MomentSoundError.unreadable }
    return channel(of: converted)
  }

  private static func channel(of buffer: AVAudioPCMBuffer) -> [Float] {
    guard let data = buffer.floatChannelData else { return [] }
    return Array(UnsafeBufferPointer(start: data[0], count: Int(buffer.frameLength)))
  }

  /// The sound, and the voice `delay` seconds after it starts, each at its volume squared, like on
  /// the wall: the screen's sliders feel even to the ear.
  static func mix(
    sound: ([Float], Float)?, voice: ([Float], Float)?, delay: TimeInterval
  ) -> [Float] {
    let offset = voice == nil ? 0 : Int(delay * sampleRate)
    let length = min(
      Int(maxSeconds * sampleRate),
      max(sound?.0.count ?? 0, voice.map { offset + $0.0.count } ?? 0))
    var output = [Float](repeating: 0, count: length)
    if case let (samples, volume)? = sound {
      let gain = volume * volume
      for index in 0..<min(samples.count, length) { output[index] += samples[index] * gain }
    }
    if case let (samples, volume)? = voice {
      let gain = volume * volume
      for index in 0..<max(0, min(samples.count, length - offset)) {
        output[offset + index] += samples[index] * gain
      }
    }
    // A loud voice over a loud sound is turned down as a whole, rather than clipped.
    let peak = output.reduce(0) { max($0, abs($1)) }
    if peak > 0.99 {
      let gain = 0.99 / peak
      for index in output.indices { output[index] *= gain }
    }
    return output
  }

  /// Writes the samples as 16-bit linear PCM in the App Group's `Library/Sounds`, where
  /// notifications find their sounds, and deletes those of earlier notifications.
  private static func write(_ samples: [Float]) throws -> UNNotificationSoundName {
    guard let container = SharedSettings.container, !samples.isEmpty else {
      throw MomentSoundError.noAppGroup
    }
    let directory = container.appendingPathComponent("Library/Sounds", isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    deleteOldSounds(in: directory)

    let name = "moment-\(UUID().uuidString).caf"
    let settings: [String: Any] = [
      AVFormatIDKey: kAudioFormatLinearPCM,
      AVSampleRateKey: sampleRate,
      AVNumberOfChannelsKey: 1,
      AVLinearPCMBitDepthKey: 16,
      AVLinearPCMIsFloatKey: false,
      AVLinearPCMIsBigEndianKey: false,
    ]
    // Closed, and so complete, once this scope ends.
    do {
      let file = try AVAudioFile(
        forWriting: directory.appendingPathComponent(name), settings: settings,
        commonFormat: .pcmFormatFloat32, interleaved: false)
      guard
        let buffer = AVAudioPCMBuffer(
          pcmFormat: file.processingFormat, frameCapacity: AVAudioFrameCount(samples.count)),
        let data = buffer.floatChannelData
      else { throw MomentSoundError.unreadable }
      buffer.frameLength = AVAudioFrameCount(samples.count)
      samples.withUnsafeBufferPointer { data[0].update(from: $0.baseAddress!, count: samples.count) }
      try file.write(from: buffer)
    }
    return UNNotificationSoundName(name)
  }

  private static func deleteOldSounds(in directory: URL) {
    let files =
      (try? FileManager.default.contentsOfDirectory(
        at: directory, includingPropertiesForKeys: [.contentModificationDateKey])) ?? []
    for file in files where file.lastPathComponent.hasPrefix("moment-") {
      let modified = try? file.resourceValues(forKeys: [.contentModificationDateKey])
        .contentModificationDate
      if Date().timeIntervalSince(modified ?? .distantPast) > soundLifetime {
        try? FileManager.default.removeItem(at: file)
      }
    }
  }
}

enum MomentSoundError: Error {
  case noAppGroup
  case unavailable
  case unreadable
}
