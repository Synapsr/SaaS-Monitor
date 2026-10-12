import AppKit

/// The window the notch draws in: borderless, see-through, above the menu bar and on every Space,
/// never taking the focus from the app in use. Clicks go through it unless the notch is open.
final class NotchPanel: NSPanel {
  init(contentRect: NSRect) {
    super.init(
      contentRect: contentRect, styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
    isFloatingPanel = true
    level = NSWindow.Level(rawValue: NSWindow.Level.mainMenu.rawValue + 3)
    backgroundColor = .clear
    isOpaque = false
    hasShadow = false
    isMovable = false
    isReleasedWhenClosed = false
    hidesOnDeactivate = false
    animationBehavior = .none
    ignoresMouseEvents = true
    collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle, .fullScreenAuxiliary]
  }

  override var canBecomeKey: Bool { false }
  override var canBecomeMain: Bool { false }

  /// Windows are kept below the menu bar: this one sits over it, around the notch.
  override func constrainFrameRect(_ frameRect: NSRect, to screen: NSScreen?) -> NSRect {
    frameRect
  }
}
