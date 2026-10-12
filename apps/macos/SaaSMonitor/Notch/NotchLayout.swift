import AppKit

/// What the notch shows, from nothing to a screen's numbers.
enum NotchPresentation: Equatable, Sendable {
  /// The hardware notch alone: nothing drawn beside it.
  case closed
  /// The screen's curve and number on either side of the notch.
  case compact
  /// A moment, below the notch.
  case moment
  /// The screen, as long as the pointer stays over it.
  case expanded
}

/// The sizes the notch takes, grown from the hardware notch. A screen without one gets a virtual
/// notch, as tall as its menu bar and as narrow as nothing: it shows only when there is something
/// to show.
struct NotchLayout: Equatable, Sendable {
  /// The hardware notch, in points.
  let notch: CGSize
  let hasNotch: Bool

  /// The outward curves where the shape meets the top of the screen, as around the real notch.
  static let flare: CGFloat = 6
  /// The room on each side of the notch in `compact`.
  static let wing: CGFloat = 78
  /// Around the largest shape, for its shadow.
  static let margin: CGFloat = 36

  func size(_ presentation: NotchPresentation) -> CGSize {
    let body: CGSize =
      switch presentation {
      case .closed: notch
      case .compact: CGSize(width: notch.width + 2 * Self.wing, height: notch.height)
      case .moment: CGSize(width: max(notch.width + 2 * Self.wing, 440), height: notch.height + 84)
      case .expanded: CGSize(width: max(notch.width + 2 * 178, 532), height: notch.height + 196)
      }
    return CGSize(width: body.width + 2 * Self.flare, height: body.height)
  }

  /// Of the bottom corners: the hardware notch's own when closed, rounder as it grows.
  func bottomRadius(_ presentation: NotchPresentation) -> CGFloat {
    switch presentation {
    case .closed: hasNotch ? 10 : 0
    case .compact: 11
    case .moment: 24
    case .expanded: 28
    }
  }

  /// The window the shapes live in: the largest one and its shadow, and room below for a
  /// milestone's confetti. See-through, it lets clicks through.
  var canvas: CGSize {
    let largest = size(.expanded)
    return CGSize(width: largest.width + 2 * Self.margin, height: max(largest.height + Self.margin, 440))
  }

  /// Where the shape of `presentation` lies on a screen of `frame`, top-centered.
  func frame(_ presentation: NotchPresentation, on frame: CGRect) -> CGRect {
    let size = size(presentation)
    return CGRect(x: frame.midX - size.width / 2, y: frame.maxY - size.height, width: size.width, height: size.height)
  }

  /// Where the pointer opens the notch, or keeps it open: the shape, a little larger. A virtual
  /// notch with nothing shown opens from the middle of the menu bar.
  func hotZone(_ presentation: NotchPresentation, on frame: CGRect) -> CGRect {
    let shape =
      presentation == .closed && !hasNotch
      ? self.frame(.compact, on: frame) : self.frame(presentation, on: frame)
    let slack: CGFloat = presentation == .expanded ? 12 : 4
    return shape.insetBy(dx: -slack, dy: -slack)
  }
}

extension NotchLayout {
  /// The notch of `screen`: the hardware one, between the menu bar's two halves, or a virtual one.
  init(screen: NSScreen) {
    let top = screen.safeAreaInsets.top
    if top > 0, let left = screen.auxiliaryTopLeftArea, let right = screen.auxiliaryTopRightArea {
      self.init(notch: CGSize(width: screen.frame.width - left.width - right.width, height: top), hasNotch: true)
    } else {
      let menuBar = screen.frame.maxY - screen.visibleFrame.maxY
      self.init(notch: CGSize(width: 0, height: menuBar > 0 ? menuBar : 24), hasNotch: false)
    }
  }
}
