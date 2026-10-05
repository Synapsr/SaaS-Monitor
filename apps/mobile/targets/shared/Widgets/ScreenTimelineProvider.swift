import WidgetKit

/// Fetches the chosen screen about every 15 minutes, as WidgetKit's budget allows; the app also
/// reloads widgets when its screens change or a moment arrives.
struct ScreenTimelineProvider: AppIntentTimelineProvider {
  var loader = ScreenLoader()

  /// Asked of WidgetKit, which may wait longer when the widget is rarely seen.
  static let refreshInterval: TimeInterval = 15 * 60

  func placeholder(in context: Context) -> ScreenEntry {
    .sample()
  }

  func snapshot(for configuration: SelectScreenIntent, in context: Context) async -> ScreenEntry {
    guard let screen = ScreenStore.screen(key: configuration.screen?.id) else {
      return context.isPreview ? .sample() : .noScreen(at: .now)
    }
    // The gallery wants an answer at once: the last numbers known will do.
    if context.isPreview, let cached = loader.cached(screen) {
      return ScreenEntry(date: .now, screen: screen, snapshot: cached)
    }
    return ScreenEntry(date: .now, screen: screen, snapshot: await loader.load(screen))
  }

  func timeline(for configuration: SelectScreenIntent, in context: Context) async -> Timeline<ScreenEntry> {
    let now = Date.now
    guard let screen = ScreenStore.screen(key: configuration.screen?.id) else {
      // `setScreens` reloads every widget: nothing to do until then.
      return Timeline(entries: [.noScreen(at: now)], policy: .never)
    }
    let snapshot = await loader.load(screen)
    let entries = Self.entryDates(from: now).map {
      ScreenEntry(date: $0, screen: screen, snapshot: snapshot)
    }
    return Timeline(entries: entries, policy: .after(now.addingTimeInterval(Self.refreshInterval)))
  }

  /// Every minute for a quarter of an hour, then every five minutes for two hours: "5 min ago"
  /// and the staleness of the numbers stay true even when WidgetKit refreshes late.
  static func entryDates(from now: Date) -> [Date] {
    let minutes = Array(0..<15) + Array(stride(from: 15, through: 120, by: 5))
    return minutes.map { now.addingTimeInterval(Double($0) * 60) }
  }

  #if os(watchOS)
  /// A watch face has no configuration screen: it lists one complication per screen.
  func recommendations() -> [AppIntentRecommendation<SelectScreenIntent>] {
    ScreenStore.screens().map {
      AppIntentRecommendation(intent: SelectScreenIntent(screen: ScreenEntity($0)), description: $0.name)
    }
  }
  #endif
}
