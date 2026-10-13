import Foundation
import Observation

/// The screens added to the app, and the one the notch shows. Kept as the iPhone app keeps them
/// (`ScreenStore`), in the app's own defaults.
@MainActor
@Observable
final class ScreenLibrary {
  private(set) var screens: [SharedScreen]
  /// The screen the notch opens on; the first one when it is gone or none was chosen.
  private(set) var selectedKey: String?

  private static let selectedKeyDefault = "selectedScreen"

  init() {
    screens = ScreenStore.screens()
    selectedKey = UserDefaults.standard.string(forKey: Self.selectedKeyDefault)
  }

  #if DEBUG
    /// Screens in memory only, never saved: for previews and store screenshots.
    init(previewing screens: [SharedScreen]) {
      self.screens = screens
      selectedKey = screens.first?.key
    }
  #endif

  var selected: SharedScreen? {
    screens.first { $0.key == selectedKey } ?? screens.first
  }

  /// Adds a screen, or updates it when it was added before (a new password), and shows it.
  func add(_ screen: SharedScreen) {
    if let index = screens.firstIndex(where: { $0.key == screen.key }) {
      screens[index] = screen
    } else {
      screens.append(screen)
    }
    save()
    select(screen.key)
  }

  func remove(_ key: String) {
    screens.removeAll { $0.key == key }
    save()
    if selectedKey == key { select(screens.first?.key) }
  }

  func select(_ key: String?) {
    selectedKey = key
    UserDefaults.standard.set(key, forKey: Self.selectedKeyDefault)
  }

  /// Shows the next screen, or the previous one (`by: -1`), round the list.
  func selectNeighbor(by offset: Int) {
    guard let current = selected, let index = screens.firstIndex(where: { $0.key == current.key }),
      screens.count > 1
    else { return }
    select(screens[(index + offset + screens.count) % screens.count].key)
  }

  /// Keeps a screen's name as its owner renames it on the dashboard.
  func rename(_ key: String, to name: String) {
    guard let index = screens.firstIndex(where: { $0.key == key }), screens[index].name != name,
      !name.isEmpty
    else { return }
    let screen = screens[index]
    screens[index] = SharedScreen(
      key: screen.key, name: name, baseUrl: screen.baseUrl, token: screen.token,
      accessProof: screen.accessProof)
    save()
  }

  private func save() {
    ScreenStore.save(screens)
  }
}
