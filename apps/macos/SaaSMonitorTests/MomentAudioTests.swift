import Foundation
import Testing

@testable import SaaSMonitor

/// The rules of the web app's `momentAudio` (`src/lib/display/moment-audio.test.ts`).
struct MomentAudioTests {
  private func item(
    _ kind: FeedItem.Kind, amount: Int = 49_00, churn: FeedItem.Churn.Reason? = nil, connect: Bool = false
  ) -> FeedItem {
    FeedItem(
      id: "item-\(kind.rawValue)", kind: kind, amount: amount, occurredAt: .now, live: true, customerKey: "cus",
      customerName: nil, customerEmail: nil, country: "FR", planName: "Pro",
      connect: connect ? FeedItem.Connect(applicationFee: 5_00) : nil, customerSubscribed: true,
      churn: churn.map { FeedItem.Churn(reason: $0, endsAt: nil) }, accountId: "acct", accountName: "Acme")
  }

  private func settings(voice: Bool = false, language: Language = .en) -> ScreenSettings {
    var settings = ScreenSettings()
    settings.voice.enabled = voice
    settings.language = language
    return settings
  }

  @Test func paymentRingsTheRegister() throws {
    let audio = try #require(MomentAudio(.payment(item(.payment)), settings: settings(), personalizedVoice: false))
    #expect(audio.sound == MomentAudio.Sound(pack: "register", event: .payment, volume: 0.7))
    #expect(audio.voice == nil)
  }

  @Test func movementsGoUpOrDown() {
    let settings = settings()
    #expect(Moment.movement(item(.new)).sound(on: settings) == .mrrUp)
    #expect(Moment.movement(item(.churn, amount: -29_00)).sound(on: settings) == .mrrDown)
    #expect(Moment.customer(item(.customer, amount: 0)).sound(on: settings) == .customer)
    #expect(Moment.milestone(amount: 10_000_00, metric: .mrr, isGoal: false).sound(on: settings) == .milestone)
  }

  @Test func voiceSpeaksOverTheSoundsTail() throws {
    let audio = try #require(
      MomentAudio(.payment(item(.payment)), settings: settings(voice: true, language: .fr), personalizedVoice: false))
    let voice = try #require(audio.voice)
    #expect(voice.id == "maelys")
    #expect(voice.phrase == "payment")
    #expect(voice.delay == 0.9)
    #expect(voice.announcement == nil)
  }

  @Test func lossesStayQuietByDefault() {
    let settings = settings(voice: true)
    #expect(Moment.movement(item(.churn, amount: -29_00)).phrase(on: settings) == nil)
    #expect(Moment.movement(item(.contraction, amount: -10_00)).phrase(on: settings) == nil)
  }

  @Test func saysWhatSaysTheMost() {
    var settings = settings(voice: true)
    settings.events["cancellation"] = {
      var channels = ScreenSettings.EventChannels()
      channels.voice = true
      return channels
    }()
    #expect(Moment.movement(item(.churn, amount: -29_00, churn: .scheduled)).phrase(on: settings) == "cancellationScheduled")
    #expect(Moment.movement(item(.churn, amount: -29_00, churn: .paused)).phrase(on: settings) == "pause")
    #expect(Moment.milestone(amount: 10_000_00, metric: .mrr, isGoal: true).phrase(on: settings) == "goal")
    #expect(Moment.payment(item(.payment, connect: true)).phrase(on: settings) == "connectPayment")
  }

  @Test func noVoiceWhereNoneSpeaksTheLanguage() {
    #expect(Moment.payment(item(.payment)).phrase(on: settings(voice: true, language: .it)) == nil)
  }

  @Test func mutedEventsPlayNothing() {
    var settings = settings()
    var channels = ScreenSettings.EventChannels()
    channels.sound = false
    settings.events["payment"] = channels
    #expect(MomentAudio(.payment(item(.payment)), settings: settings, personalizedVoice: false) == nil)
    // A test celebration was asked for.
    #expect(MomentAudio(.test(id: "t1"), settings: settings, personalizedVoice: false)?.sound?.event == .payment)
  }

  @Test func asksTheServerForItsOwnWords() throws {
    let audio = try #require(
      MomentAudio(
        .milestone(amount: 10_000_00, metric: .arr, isGoal: false), settings: settings(voice: true),
        personalizedVoice: true))
    let body = try #require(audio.voice?.announcement?.body)
    let json = try #require(JSONSerialization.jsonObject(with: body) as? [String: Any])
    #expect(json["format"] as? String == "wav")
    let moment = try #require(json["moment"] as? [String: Any])
    #expect(moment["kind"] as? String == "milestone")
    #expect(moment["id"] as? String == "milestone:arr:1000000")
    #expect(moment["amount"] as? Int == 10_000_00)
    #expect(moment["metric"] as? String == "arr")
    #expect(moment["isGoal"] as? Bool == false)
    #expect(moment.keys.contains("accountId"))
  }
}
