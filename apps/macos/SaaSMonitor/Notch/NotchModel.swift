import Foundation
import Observation

/// What the notch shows at every instant: the open screen while the pointer is over it, else the
/// moment on stage, else the selected screen's numbers beside the notch.
@MainActor
@Observable
final class NotchModel {
  var layout: NotchLayout
  /// The pointer rests over the notch.
  var isOpen = false {
    didSet { stage.isHeld = isOpen }
  }

  let library: ScreenLibrary
  let monitor: ScreenMonitor
  let stage: MomentStage
  let preferences: Preferences
  /// What the notch's buttons do, wired by the app.
  @ObservationIgnored var actions = Actions()

  struct Actions {
    var addScreen: () -> Void = {}
    var addDemo: () -> Void = {}
    /// Asks again for the password of a screen that changed it.
    var unlock: (SharedScreen) -> Void = { _ in }
    var openSettings: () -> Void = {}
    var openWall: (SharedScreen) -> Void = { _ in }
  }

  init(layout: NotchLayout, library: ScreenLibrary, monitor: ScreenMonitor, stage: MomentStage, preferences: Preferences) {
    self.layout = layout
    self.library = library
    self.monitor = monitor
    self.stage = stage
    self.preferences = preferences
  }

  #if DEBUG
    /// Holds a look, for development and screenshots (`NotchPreview`).
    var preview: NotchPresentation?
  #endif

  var presentation: NotchPresentation {
    #if DEBUG
      if let preview, preview != .moment || stage.current != nil { return preview }
    #endif
    if isOpen { return .expanded }
    if stage.current != nil { return .moment }
    if preferences.showsFigures, selectedFigures != nil { return .compact }
    return .closed
  }

  /// The selected screen's numbers, once it has some.
  var selectedFigures: ScreenFigures? {
    guard let state = monitor.snapshot(of: library.selected)?.state, state.status == .ready else { return nil }
    return ScreenFigures(state)
  }
}
