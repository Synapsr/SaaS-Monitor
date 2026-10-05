import AppIntents
import WidgetKit

/// Which screen a widget or a complication shows: one of those the app shares, the first by
/// default.
struct SelectScreenIntent: WidgetConfigurationIntent {
  static let title: LocalizedStringResource = "Screen"
  static let description = IntentDescription("Choose the screen to show.")

  @Parameter(title: "Screen")
  var screen: ScreenEntity?

  init() {}

  init(screen: ScreenEntity) {
    self.screen = screen
  }
}

struct ScreenEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Screen"
  static let defaultQuery = ScreenQuery()

  /// The screen's key: its token may change, its key never does.
  let id: String
  let name: String

  var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(name)") }

  init(_ screen: SharedScreen) {
    id = screen.key
    name = screen.name
  }
}

struct ScreenQuery: EntityQuery {
  func entities(for identifiers: [ScreenEntity.ID]) async throws -> [ScreenEntity] {
    ScreenStore.screens().filter { identifiers.contains($0.key) }.map(ScreenEntity.init)
  }

  func suggestedEntities() async throws -> [ScreenEntity] {
    ScreenStore.screens().map(ScreenEntity.init)
  }

  func defaultResult() async -> ScreenEntity? {
    ScreenStore.screens().first.map(ScreenEntity.init)
  }
}
