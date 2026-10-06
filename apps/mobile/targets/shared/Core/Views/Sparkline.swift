import SwiftUI

/// The screen's curve, no axes nor labels: a smooth line in the accent over a fill fading to
/// nothing, and its last point, now, glowing. Drawn edge to edge along the bottom of a hero.
struct Sparkline: View {
  /// Oldest first.
  let values: [Int]
  var color: Color
  /// The last point's dot; its halo is `color`'s.
  var dotColor: Color
  var lineWidth: CGFloat = 2
  /// The fill's opacity right under the line.
  var fillOpacity: Double = 0.32
  var showsDot = true
  /// Draws itself in once when it appears, unless motion is reduced.
  var drawsIn = false
  /// Room left after the last point, which the fill crosses flat: keeps the dot off an edge.
  var endInset: CGFloat = 0

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.isLuminanceReduced) private var isLuminanceReduced
  @State private var appeared = false

  /// More than a wrist or a widget can tell apart.
  private static let resolution = 48

  var body: some View {
    let drawn: CGFloat = drawsIn && !appeared ? 0 : 1
    let points = Self.sample(values, count: Self.resolution)
    GeometryReader { proxy in
      let curve = SparklineCurve(points: points, size: proxy.size, inset: dotRadius + 1, endInset: endInset)
      ZStack(alignment: .topLeading) {
        if fillOpacity > 0, !isLuminanceReduced {
          curve.area(size: proxy.size)
            .fill(LinearGradient(
              colors: [color.opacity(fillOpacity), color.opacity(0)],
              startPoint: .top,
              endPoint: .bottom
            ))
            .opacity(drawn)
        }
        curve.line
          .trim(from: 0, to: drawn)
          .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
        if showsDot, let last = curve.last {
          Circle()
            .fill(dotColor)
            .frame(width: dotRadius * 2, height: dotRadius * 2)
            .background {
              if !isLuminanceReduced {
                Circle().fill(color.opacity(0.28)).frame(width: dotRadius * 5, height: dotRadius * 5)
              }
            }
            .shadow(color: isLuminanceReduced ? .clear : color, radius: dotRadius * 1.2)
            .position(last)
            .opacity(drawn < 1 ? 0 : 1)
        }
      }
    }
    .accessibilityHidden(true)
    .onAppear {
      guard drawsIn, !appeared else { return }
      withAnimation(reduceMotion ? nil : .easeOut(duration: 1.1).delay(0.1)) { appeared = true }
    }
  }

  private var dotRadius: CGFloat { showsDot ? max(2, lineWidth * 1.4) : lineWidth / 2 }

  /// `count` points of `values` at most, evenly spread, keeping the first and the last.
  static func sample(_ values: [Int], count: Int) -> [Double] {
    guard values.count > count, count > 1 else { return values.map(Double.init) }
    let step = Double(values.count - 1) / Double(count - 1)
    return (0..<count).map { Double(values[Int((Double($0) * step).rounded())]) }
  }
}

/// The geometry of a sparkline in its frame: a monotone cubic curve (`d3.curveMonotoneX`), which
/// never overshoots the values it passes through.
struct SparklineCurve {
  let points: [CGPoint]

  /// Keeps the line, its round caps and the dot inside the frame, and the dot `endInset` from its
  /// trailing edge.
  init(points values: [Double], size: CGSize, inset: CGFloat, endInset: CGFloat = 0) {
    guard let low = values.min(), let high = values.max(), values.count > 1 else {
      points = []
      return
    }
    let width = max(1, size.width - max(inset, endInset))
    // A flat curve sits a little below the middle; the bottom keeps room for the fill to fade.
    let top = inset
    let bottom = max(top + 1, size.height * 0.82)
    let span = high - low
    points = values.enumerated().map { index, value in
      let x = width * CGFloat(index) / CGFloat(values.count - 1)
      let share = span > 0 ? (value - low) / span : 0.4
      return CGPoint(x: x, y: bottom - (bottom - top) * CGFloat(share))
    }
  }

  var last: CGPoint? { points.last }

  var line: Path {
    var path = Path()
    guard let first = points.first else { return path }
    path.move(to: first)
    addSegments(to: &path)
    return path
  }

  /// The line closed along the bottom of the frame, for the fill. Past the last point, kept inside
  /// so that its dot doesn't touch the edge, the fill goes on flat to the edge.
  func area(size: CGSize) -> Path {
    var path = line
    guard let first = points.first, let last = points.last else { return path }
    path.addLine(to: CGPoint(x: size.width, y: last.y))
    path.addLine(to: CGPoint(x: size.width, y: size.height))
    path.addLine(to: CGPoint(x: first.x, y: size.height))
    path.closeSubpath()
    return path
  }

  private func addSegments(to path: inout Path) {
    let tangents = Self.tangents(points)
    for index in 1..<points.count {
      let start = points[index - 1]
      let end = points[index]
      let third = (end.x - start.x) / 3
      path.addCurve(
        to: end,
        control1: CGPoint(x: start.x + third, y: start.y + tangents[index - 1] * third),
        control2: CGPoint(x: end.x - third, y: end.y - tangents[index] * third)
      )
    }
  }

  /// Fritsch–Carlson tangents: flat at local extremes, limited so no segment overshoots.
  private static func tangents(_ points: [CGPoint]) -> [CGFloat] {
    let count = points.count
    guard count > 1 else { return Array(repeating: 0, count: count) }
    let slopes = (0..<count - 1).map { index -> CGFloat in
      let dx = points[index + 1].x - points[index].x
      return dx == 0 ? 0 : (points[index + 1].y - points[index].y) / dx
    }
    var tangents = [CGFloat](repeating: 0, count: count)
    tangents[0] = slopes[0]
    tangents[count - 1] = slopes[count - 2]
    for index in 1..<count - 1 {
      let before = slopes[index - 1]
      let after = slopes[index]
      tangents[index] = before * after <= 0 ? 0 : (before + after) / 2
    }
    for index in 0..<count - 1 {
      let slope = slopes[index]
      if slope == 0 {
        tangents[index] = 0
        tangents[index + 1] = 0
        continue
      }
      let a = tangents[index] / slope
      let b = tangents[index + 1] / slope
      let length = a * a + b * b
      if length > 9 {
        let tau = 3 / length.squareRoot()
        tangents[index] = tau * a * slope
        tangents[index + 1] = tau * b * slope
      }
    }
    return tangents
  }
}
