import AppKit
import SwiftUI

/// The app's two windows, opened from the menu bar or from the notch. A menu bar app has to come
/// to the front for them.
@MainActor
final class Windows {
  private unowned let app: AppDelegate
  private var addScreen: NSWindow?
  private var settings: NSWindow?

  init(app: AppDelegate) {
    self.app = app
  }

  /// `link`: a screen to add again, e.g. one whose password changed.
  func showAddScreen(link: ScreenLink? = nil) {
    let view = AddScreenView(
      library: app.library, preferences: app.preferences, link: link,
      onAdded: { [weak self] screen in
        self?.addScreen?.close()
        self?.app.added(screen)
      },
      onCancel: { [weak self] in self?.addScreen?.close() })
    if let addScreen {
      addScreen.contentViewController = NSHostingController(rootView: view)
      show(addScreen)
      return
    }
    let window = window(title: "Add a screen", content: view)
    addScreen = window
    show(window)
  }

  func showSettings() {
    if let settings {
      show(settings)
      return
    }
    let view = SettingsView(
      library: app.library, monitor: app.monitor, preferences: app.preferences,
      onAdd: { [weak self] in self?.showAddScreen() },
      onRemove: { [weak self] screen in self?.app.remove(screen) })
    let window = window(title: "SaaS Monitor settings", content: view)
    settings = window
    show(window)
  }

  private func window(title: String, content: some View) -> NSWindow {
    let window = NSWindow(contentViewController: NSHostingController(rootView: content))
    // Titled for the Window menu and VoiceOver, but drawn without a bar: the content says it.
    window.title = title
    window.titleVisibility = .hidden
    window.titlebarAppearsTransparent = true
    window.styleMask = [.titled, .closable, .fullSizeContentView]
    window.isMovableByWindowBackground = true
    window.isReleasedWhenClosed = false
    // Centered once SwiftUI has sized it.
    window.layoutIfNeeded()
    window.center()
    return window
  }

  /// In front of the app in use: opened from the notch, which never takes the focus, the app
  /// isn't active, and macOS no longer lets it push itself forward.
  private func show(_ window: NSWindow) {
    window.orderFrontRegardless()
    window.makeKey()
    NSApp.activate()
  }
}
