import SwiftUI

/// A burst of confetti out of the notch, for a milestone or a goal: in the screen's accent, falling
/// and fading in under three seconds. Nothing with reduced motion.
struct Confetti: View {
  let colors: [Color]
  /// Where it bursts from, in the view.
  let origin: CGPoint

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.isStillRender) private var isStillRender
  @State private var start = Date.now

  private static let count = 72
  private static let lifetime: TimeInterval = 2.6
  /// Air slows the pieces down: they spread around the notch rather than fly off.
  private static let drag: Double = 2.4
  private static let gravity: Double = 70

  /// Of a still picture: the burst spread out, before it falls.
  private static let stillTime: TimeInterval = 0.7

  var body: some View {
    if isStillRender {
      Canvas { canvas, _ in
        for index in 0..<Self.count {
          draw(piece: index, at: Self.stillTime, in: &canvas)
        }
      }
      .allowsHitTesting(false)
    } else if !reduceMotion {
      TimelineView(.animation) { context in
        let elapsed = context.date.timeIntervalSince(start)
        Canvas { canvas, _ in
          guard elapsed < Self.lifetime else { return }
          for index in 0..<Self.count {
            draw(piece: index, at: elapsed, in: &canvas)
          }
        }
      }
      .allowsHitTesting(false)
    }
  }

  private func draw(piece index: Int, at time: TimeInterval, in canvas: inout GraphicsContext) {
    // Down and outward, never up into the menu bar.
    let angle = (12 + 156 * Self.random(index, 1)) * .pi / 180
    let speed = 180 + 340 * Self.random(index, 2)
    let travel = (1 - exp(-Self.drag * time)) / Self.drag
    let x = origin.x + cos(angle) * speed * travel
    let y = origin.y + sin(angle) * speed * travel * 0.6 + 0.5 * Self.gravity * time * time
    let spin = (Self.random(index, 3) - 0.5) * 14 * time
    let fade = max(0, 1 - time / Self.lifetime)

    var piece = canvas
    piece.opacity = fade
    piece.translateBy(x: x, y: y)
    piece.rotate(by: .radians(spin))
    let size = CGSize(width: 4 + 4 * Self.random(index, 4), height: 3 + 2 * Self.random(index, 5))
    piece.fill(
      Path(roundedRect: CGRect(origin: CGPoint(x: -size.width / 2, y: -size.height / 2), size: size), cornerRadius: 1),
      with: .color(colors[index % colors.count]))
  }

  /// The same pieces every time: 0 to 1 from the piece and a salt.
  private static func random(_ index: Int, _ salt: Int) -> Double {
    var value = UInt64(truncatingIfNeeded: index &* 7_919 &+ salt &* 104_729) &+ 0x9E37_79B9_7F4A_7C15
    value = (value ^ (value >> 30)) &* 0xBF58_476D_1CE4_E5B9
    value = (value ^ (value >> 27)) &* 0x94D0_49BB_1331_11EB
    value ^= value >> 31
    return Double(value % 10_000) / 10_000
  }
}
