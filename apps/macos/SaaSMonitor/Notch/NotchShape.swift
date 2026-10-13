import SwiftUI

/// The notch's outline: flush with the top of the screen, its top corners flaring outward as the
/// hardware notch's do, its bottom corners rounded. Animates both radii as it grows.
struct NotchShape: Shape {
  var flare: CGFloat
  var bottomRadius: CGFloat

  var animatableData: AnimatablePair<CGFloat, CGFloat> {
    get { AnimatablePair(flare, bottomRadius) }
    set {
      flare = newValue.first
      bottomRadius = newValue.second
    }
  }

  func path(in rect: CGRect) -> Path {
    let flare = min(flare, rect.width / 2, rect.height)
    let radius = max(0, min(bottomRadius, (rect.width - 2 * flare) / 2, rect.height - flare))
    var path = Path()
    path.move(to: CGPoint(x: rect.minX, y: rect.minY))
    path.addQuadCurve(
      to: CGPoint(x: rect.minX + flare, y: rect.minY + flare),
      control: CGPoint(x: rect.minX + flare, y: rect.minY))
    path.addLine(to: CGPoint(x: rect.minX + flare, y: rect.maxY - radius))
    path.addQuadCurve(
      to: CGPoint(x: rect.minX + flare + radius, y: rect.maxY),
      control: CGPoint(x: rect.minX + flare, y: rect.maxY))
    path.addLine(to: CGPoint(x: rect.maxX - flare - radius, y: rect.maxY))
    path.addQuadCurve(
      to: CGPoint(x: rect.maxX - flare, y: rect.maxY - radius),
      control: CGPoint(x: rect.maxX - flare, y: rect.maxY))
    path.addLine(to: CGPoint(x: rect.maxX - flare, y: rect.minY + flare))
    path.addQuadCurve(
      to: CGPoint(x: rect.maxX, y: rect.minY),
      control: CGPoint(x: rect.maxX - flare, y: rect.minY))
    path.closeSubpath()
    return path
  }
}
