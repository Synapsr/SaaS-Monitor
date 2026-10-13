import AppKit

/// Owns what the app is made of, and wires it: screens followed, their moments staged in the notch
/// and played, the windows to add screens and change settings.
@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
  let preferences = Preferences()
  let library = ScreenLibrary()
  let stage = MomentStage()
  private(set) lazy var monitor = ScreenMonitor(library: library)
  private(set) lazy var windows = Windows(app: self)
  private(set) var notch: NotchController?
  private let player = MomentPlayer()
  private var observers: [NSObjectProtocol] = []

  func applicationDidFinishLaunching(_ notification: Notification) {
    // Unit tests run inside the app: no notch, no windows.
    guard ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] == nil else { return }
    // Revenue stays off the disk, but for the last state of each screen (`StateCache`).
    URLCache.shared = URLCache(memoryCapacity: 4 * 1024 * 1024, diskCapacity: 0)
    #if DEBUG
      if UserDefaults.standard.bool(forKey: "RenderStoreShots") {
        StoreShots.render()
        NSApp.terminate(nil)
        return
      }
      // `-OpenAtLogin NO` takes a development build out of the login items.
      if UserDefaults.standard.object(forKey: "OpenAtLogin") != nil {
        preferences.opensAtLogin = UserDefaults.standard.bool(forKey: "OpenAtLogin")
      }
    #endif
    let model = NotchModel(
      layout: NSScreen.main.map(NotchLayout.init(screen:)) ?? NotchLayout(notch: .zero, hasNotch: false),
      library: library, monitor: monitor, stage: stage, preferences: preferences)
    model.actions = NotchModel.Actions(
      addScreen: { [weak self] in self?.windows.showAddScreen() },
      addDemo: { [weak self] in Task { await self?.addDemo() } },
      unlock: { [weak self] screen in self?.windows.showAddScreen(link: screen.link) },
      openSettings: { [weak self] in self?.windows.showSettings() },
      openWall: { screen in
        if let url = screen.link.url { NSWorkspace.shared.open(url) }
      })
    notch = NotchController(model: model)

    monitor.onFirstState = { [weak self] state, screen in
      self?.player.prefetch(pack: state.screen.settings.sound.pack, of: screen)
    }
    monitor.onMoments = { [weak self] moments, state, screen in
      self?.stage.enqueue(moments, state: state, screen: screen)
    }
    stage.onStage = { [weak self] moment in
      guard let self, self.preferences.playsSounds, let audio = moment.audio else { return }
      self.player.play(audio, of: moment.screen)
    }
    followSleep()
    monitor.resume()

    #if DEBUG
      if let preview = NotchPreview(arguments: UserDefaults.standard) {
        preview.start(model: model, stage: stage)
        return
      }
    #endif
    if library.screens.isEmpty { windows.showAddScreen() }
  }

  /// A screen was added: show it at once, and where it lives.
  func added(_ screen: SharedScreen) {
    Task {
      await monitor.refresh()
      notch?.peek()
    }
  }

  func remove(_ screen: SharedScreen) {
    stage.forget(screen: screen.key)
    library.remove(screen.key)
  }

  /// The demo screen, fed by a simulation: moments come every minute or so.
  func addDemo() async {
    guard let (state, _) = try? await ScreenAccess().open(.demo, password: nil) else {
      windows.showAddScreen(link: .demo)
      return
    }
    let screen = SharedScreen(.demo, name: state.screen.name, accessProof: nil)
    library.add(screen)
    added(screen)
  }

  /// Nothing to follow while the Mac sleeps: on waking, what happened meanwhile plays as a summary.
  private func followSleep() {
    let center = NSWorkspace.shared.notificationCenter
    for name in [NSWorkspace.willSleepNotification, NSWorkspace.screensDidSleepNotification] {
      observers.append(
        center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
          MainActor.assumeIsolated { self?.monitor.pause() }
        })
    }
    for name in [NSWorkspace.didWakeNotification, NSWorkspace.screensDidWakeNotification] {
      observers.append(
        center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
          MainActor.assumeIsolated { self?.monitor.resume() }
        })
    }
  }
}
