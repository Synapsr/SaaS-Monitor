import Foundation
import Observation
import ServiceManagement

/// The app's own settings, on this Mac: what each screen shows and plays is its owner's choice, on
/// the dashboard.
@MainActor
@Observable
final class Preferences {
  /// The sounds and voices of moments, as the screens' settings have them.
  var playsSounds: Bool {
    didSet { defaults.set(playsSounds, forKey: Keys.playsSounds) }
  }

  /// The screen's curve and number beside the notch, between moments.
  var showsFigures: Bool {
    didSet { defaults.set(showsFigures, forKey: Keys.showsFigures) }
  }

  /// Over apps in full screen too, where the menu bar hides.
  var showsOverFullScreen: Bool {
    didSet { defaults.set(showsOverFullScreen, forKey: Keys.showsOverFullScreen) }
  }

  /// Starts with the Mac: a notch that only shows once opened would miss most moments.
  var opensAtLogin: Bool {
    get {
      access(keyPath: \.opensAtLogin)
      return SMAppService.mainApp.status == .enabled
    }
    set {
      withMutation(keyPath: \.opensAtLogin) {
        do {
          if newValue { try SMAppService.mainApp.register() } else { try SMAppService.mainApp.unregister() }
        } catch {
          // Refused, e.g. by a management profile: the toggle shows the status as it is.
        }
      }
    }
  }

  @ObservationIgnored private let defaults: UserDefaults

  private enum Keys {
    static let playsSounds = "playsSounds"
    static let showsFigures = "showsFigures"
    static let showsOverFullScreen = "showsOverFullScreen"
  }

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
    defaults.register(defaults: [
      Keys.playsSounds: true,
      Keys.showsFigures: true,
      Keys.showsOverFullScreen: true,
    ])
    playsSounds = defaults.bool(forKey: Keys.playsSounds)
    showsFigures = defaults.bool(forKey: Keys.showsFigures)
    showsOverFullScreen = defaults.bool(forKey: Keys.showsOverFullScreen)
  }
}
