import AppIntents
import WidgetKit

/// Which screen a widget or a complication shows: one of those the app shares, the first by
/// default.
struct SelectScreenIntent: WidgetConfigurationIntent {
  static let title: LocalizedStringResource = "Screen"
  static let description = IntentDescription("Choose the screen to show.")

  /// The screen's key: its token may change, its key never does. A key, not an `AppEntity`: App
  /// Intents rebuilds a configured entity by asking `linkd`, which turns away extensions signed
  /// without a team (every simulator build). The entity then came back `nil`, and every widget
  /// showed the first screen whatever its configuration.
  @Parameter(title: "Screen", optionsProvider: ScreenOptions())
  var screen: String?

  init() {}

  init(screen: SharedScreen) {
    self.screen = screen.key
  }
}

/// The app's screens, offered by name.
struct ScreenOptions: DynamicOptionsProvider {
  func results() async throws -> ItemCollection<String> {
    ItemCollection(sections: [
      ItemSection(items: ScreenStore.screens().map { IntentItem($0.key, title: "\($0.name)") }),
    ])
  }

  func defaultResult() async -> String? {
    ScreenStore.screens().first?.key
  }
}
