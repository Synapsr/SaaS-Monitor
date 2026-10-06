import SwiftUI
import WidgetKit

/// The goal, or next milestone, as a circular gauge (`goal-progress.tsx` as a ring): a dim track,
/// the progress from the accent's deep shade to its glow with round caps and a glowing tip, and
/// whatever its caller puts in the middle.
struct GoalRing<Center: View>: View {
  /// From 0 to 1.
  let progress: Double
  let style: ScreenStyle
  var lineWidth: CGFloat = 8
  /// The tip's glow: off where the system draws the ring in a tint.
  var glows = true
  /// Fills from empty when it appears, unless motion is reduced.
  var fillsIn = false
  @ViewBuilder var center: Center

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.isLuminanceReduced) private var isLuminanceReduced
  @State private var appeared = false

  var body: some View {
    ZStack {
      Circle()
        .stroke(style.ink.opacity(0.12), lineWidth: lineWidth)
      RingArc(progress: fillsIn && !appeared ? 0 : progress, style: style, lineWidth: lineWidth, glows: glows && !isLuminanceReduced)
      center
        .padding(lineWidth * 1.2)
    }
    .padding(lineWidth / 2)
    .onAppear {
      guard fillsIn, !appeared else { return }
      withAnimation(reduceMotion ? nil : .spring(duration: 1.6, bounce: 0).delay(0.15)) { appeared = true }
    }
  }
}

/// The progress of a ring, animatable as a whole: its gradient follows the arc as it grows.
private struct RingArc: View, Animatable {
  var progress: Double
  let style: ScreenStyle
  let lineWidth: CGFloat
  let glows: Bool

  nonisolated var animatableData: Double {
    get { progress }
    set { progress = newValue }
  }

  var body: some View {
    let progress = min(1, max(0, progress))
    GeometryReader { proxy in
      let radius = min(proxy.size.width, proxy.size.height) / 2
      let center = CGPoint(x: proxy.size.width / 2, y: proxy.size.height / 2)
      let angle = Angle.degrees(360 * progress - 90)
      let tip = CGPoint(
        x: center.x + radius * CGFloat(cos(angle.radians)),
        y: center.y + radius * CGFloat(sin(angle.radians))
      )
      ZStack {
        if progress > 0 {
          Circle()
            .trim(from: 0, to: progress)
            .stroke(
              AngularGradient(
                colors: [style.glowDeep, style.glow],
                center: .center,
                startAngle: .degrees(0),
                endAngle: .degrees(360 * max(progress, 0.01))
              ),
              style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
            )
            .rotationEffect(.degrees(-90))
            // The start's round cap, which the gradient's far end would color otherwise.
            .overlay {
              Circle()
                .fill(style.glowDeep)
                .frame(width: lineWidth, height: lineWidth)
                .position(x: center.x, y: center.y - radius)
                .opacity(progress < 0.97 ? 1 : 0)
            }
            .widgetAccentable()
          Circle()
            .fill(style.glowInk)
            .frame(width: lineWidth * 0.62, height: lineWidth * 0.62)
            .shadow(color: glows ? style.glow : .clear, radius: lineWidth * 0.8)
            .shadow(color: glows ? style.glow.opacity(0.6) : .clear, radius: lineWidth * 1.6)
            .position(tip)
            .widgetAccentable()
        }
      }
    }
  }
}
