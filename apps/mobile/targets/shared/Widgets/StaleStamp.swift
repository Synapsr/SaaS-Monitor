import SwiftUI

/// When outdated numbers are from, discreetly: "14:05" next to a clock, or a cloud crossed out when
/// the instance couldn't be reached.
struct StaleStamp: View {
  let fetchedAt: Date
  let now: Date
  let format: ScreenFormat
  let offline: Bool
  let style: ScreenStyle

  var body: some View {
    Label(format.fetchTime(fetchedAt, now: now), systemImage: offline ? "icloud.slash" : "clock")
      .labelStyle(.titleAndIcon)
      .font(.caption2)
      .monospacedDigit()
      .imageScale(.small)
      .foregroundStyle(style.ink3)
      .lineLimit(1)
  }
}
