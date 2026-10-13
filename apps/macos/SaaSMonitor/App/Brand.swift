import AppKit
import SwiftUI

/// The logo's pulse (`LOGO_PULSE_PATH` on the web, `M12 40h9l6-16 8 24 6-14h11`), drawn in the
/// box of its strokes (`8 18 48 34`) scaled to the rect.
struct PulseMark: Shape {
  static let points: [CGPoint] = [
    CGPoint(x: 12, y: 40), CGPoint(x: 21, y: 40), CGPoint(x: 27, y: 24), CGPoint(x: 35, y: 48),
    CGPoint(x: 41, y: 34), CGPoint(x: 52, y: 34),
  ]
  static let box = CGRect(x: 8, y: 18, width: 48, height: 34)

  func path(in rect: CGRect) -> Path {
    let scale = min(rect.width / Self.box.width, rect.height / Self.box.height)
    let offset = CGPoint(
      x: rect.midX - Self.box.midX * scale, y: rect.midY - Self.box.midY * scale)
    var path = Path()
    path.addLines(Self.points.map { CGPoint(x: $0.x * scale + offset.x, y: $0.y * scale + offset.y) })
    return path
  }
}

extension NSImage {
  /// The pulse for the menu bar, a template the system tints.
  static let menuBarPulse: NSImage = {
    let image = NSImage(size: NSSize(width: 18, height: 18), flipped: true) { rect in
      let path = NSBezierPath()
      let mark = PulseMark().path(in: rect.insetBy(dx: 1, dy: 2)).cgPath
      path.append(NSBezierPath(cgPath: mark))
      path.lineWidth = 1.8
      path.lineCapStyle = .round
      path.lineJoinStyle = .round
      NSColor.black.setStroke()
      path.stroke()
      return true
    }
    image.isTemplate = true
    image.accessibilityDescription = "SaaS Monitor"
    return image
  }()
}

extension ScreenStyle {
  /// The notch's own chrome, around what screens show: the brand's emerald on the dark theme.
  static let notch = ScreenStyle(accent: "emerald", theme: .dark)
}
