import CoreGraphics
import Testing

@testable import SaaSMonitor

struct NotchLayoutTests {
  /// A 15-inch MacBook Air's notch, in points.
  private let layout = NotchLayout(notch: CGSize(width: 185, height: 37), hasNotch: true)
  private let screen = CGRect(x: 0, y: 0, width: 1710, height: 1112)

  @Test func closedCoversTheHardwareNotchExactly() {
    let frame = layout.frame(.closed, on: screen)
    // The flares reach past the notch on the top edge only.
    #expect(frame.width == 185 + 2 * NotchLayout.flare)
    #expect(frame.height == 37)
    #expect(frame.midX == screen.midX)
    #expect(frame.maxY == screen.maxY)
  }

  @Test func growsAsItShowsMore() {
    let sizes = [NotchPresentation.closed, .compact, .moment, .expanded].map(layout.size)
    for (smaller, larger) in zip(sizes, sizes.dropFirst()) {
      #expect(larger.width >= smaller.width)
      #expect(larger.height >= smaller.height)
    }
  }

  @Test func theWindowHoldsTheLargestShape() {
    let canvas = layout.canvas
    let expanded = layout.size(.expanded)
    #expect(canvas.width > expanded.width)
    #expect(canvas.height > expanded.height)
  }

  @Test func opensFromTheNotchAndStaysOpenNearIt() {
    let notch = layout.hotZone(.closed, on: screen)
    #expect(notch.contains(CGPoint(x: screen.midX, y: screen.maxY - 10)))
    #expect(!notch.contains(CGPoint(x: screen.midX, y: screen.maxY - 80)))
    #expect(layout.hotZone(.expanded, on: screen).contains(CGPoint(x: screen.midX, y: screen.maxY - 200)))
  }

  @Test func aScreenWithoutNotchOpensFromTheMenuBarsMiddle() {
    let virtual = NotchLayout(notch: CGSize(width: 0, height: 24), hasNotch: false)
    #expect(virtual.bottomRadius(.closed) == 0)
    #expect(virtual.hotZone(.closed, on: screen).width == virtual.hotZone(.compact, on: screen).width)
  }
}
