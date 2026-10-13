import AppKit
import Observation
import SwiftUI

/// Puts the notch on the screen that has one (else the main screen), opens it when the pointer
/// rests over it, and lets clicks through everywhere else.
@MainActor
final class NotchController {
  let model: NotchModel
  private let panel: NotchPanel
  private var screen: NSScreen?
  private var monitors: [Any] = []
  private var observers: [NSObjectProtocol] = []
  private var pending: Task<Void, Never>?
  /// Horizontal scrolling over the open notch, toward switching screens.
  private var swipe: CGFloat = 0

  /// Long enough to cross the notch on the way to the menu bar without opening it.
  static let openDelay: Duration = .milliseconds(140)
  /// Short slips outside don't close it.
  static let closeDelay: Duration = .milliseconds(320)

  init(model: NotchModel) {
    self.model = model
    panel = NotchPanel(contentRect: .zero)
    let host = NSHostingView(rootView: NotchView(model: model))
    host.sizingOptions = []
    panel.contentView = host
    place()
    panel.orderFrontRegardless()

    observers.append(
      NotificationCenter.default.addObserver(
        forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main
      ) { [weak self] _ in MainActor.assumeIsolated { self?.place() } })
    let pointer: (NSEvent) -> Void = { [weak self] _ in MainActor.assumeIsolated { self?.pointerMoved() } }
    monitors.append(NSEvent.addGlobalMonitorForEvents(matching: [.mouseMoved, .leftMouseDragged], handler: pointer) as Any)
    monitors.append(
      NSEvent.addLocalMonitorForEvents(matching: [.mouseMoved, .leftMouseDragged, .mouseExited]) { event in
        pointer(event)
        return event
      } as Any)
    monitors.append(
      NSEvent.addLocalMonitorForEvents(matching: .scrollWheel) { [weak self] event in
        MainActor.assumeIsolated { self?.scrolled(event) }
        return event
      } as Any)
    follow()
  }

  /// On the screen with the notch, or the main one; again whenever screens change.
  func place() {
    guard let screen = NSScreen.screens.first(where: { $0.safeAreaInsets.top > 0 }) ?? NSScreen.main else { return }
    self.screen = screen
    model.layout = NotchLayout(screen: screen)
    let canvas = model.layout.canvas
    let frame = CGRect(
      x: screen.frame.midX - canvas.width / 2, y: screen.frame.maxY - canvas.height,
      width: canvas.width, height: canvas.height)
    panel.setFrame(frame, display: true)
    applyPreferences()
  }

  /// Opens the notch for a moment, e.g. to show where a screen just added lives.
  func peek(for duration: Duration = .seconds(3)) {
    pending?.cancel()
    model.isOpen = true
    update()
    pending = Task { [weak self] in
      try? await Task.sleep(for: duration)
      guard !Task.isCancelled, let self else { return }
      if !self.isPointerInside() { self.model.isOpen = false }
      self.update()
    }
  }

  private func applyPreferences() {
    var behavior: NSWindow.CollectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
    if model.preferences.showsOverFullScreen { behavior.insert(.fullScreenAuxiliary) }
    panel.collectionBehavior = behavior
  }

  private func isPointerInside() -> Bool {
    guard let screen else { return false }
    return model.layout.hotZone(model.presentation, on: screen.frame).contains(NSEvent.mouseLocation)
  }

  private func pointerMoved() {
    let inside = isPointerInside()
    guard inside != model.isOpen else {
      pending?.cancel()
      pending = nil
      return
    }
    guard pending == nil else { return }
    pending = Task { [weak self] in
      try? await Task.sleep(for: inside ? Self.openDelay : Self.closeDelay)
      guard !Task.isCancelled, let self else { return }
      self.pending = nil
      // Still where it was heading.
      guard self.isPointerInside() == inside else { return }
      if inside { NSHapticFeedbackManager.defaultPerformer.perform(.alignment, performanceTime: .now) }
      self.model.isOpen = inside
      self.update()
    }
  }

  /// A swipe sideways over the open notch shows the next screen, or the previous one.
  private func scrolled(_ event: NSEvent) {
    guard model.isOpen, abs(event.scrollingDeltaX) > abs(event.scrollingDeltaY) else { return }
    if event.phase == .began { swipe = 0 }
    swipe += event.scrollingDeltaX
    if abs(swipe) > 60 {
      model.library.selectNeighbor(by: swipe < 0 ? 1 : -1)
      swipe = 0
    }
  }

  /// The notch takes clicks only while open: elsewhere, they reach the menu bar and the apps.
  private func update() {
    panel.ignoresMouseEvents = !model.isOpen
  }

  /// Keeps the window in step with what the notch shows and with the app's settings.
  private func follow() {
    withObservationTracking {
      _ = model.presentation
      _ = model.preferences.showsOverFullScreen
    } onChange: { [weak self] in
      Task { @MainActor in
        guard let self else { return }
        self.applyPreferences()
        self.update()
        self.follow()
      }
    }
  }
}
