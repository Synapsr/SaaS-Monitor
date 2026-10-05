import SwiftUI
import WidgetKit

#Preview("Lock screen, rectangular", as: .accessoryRectangular) {
  ScreenWidget()
} timeline: {
  ScreenEntry.sample()
  ScreenEntry.preview(.sample(metric: .arr, language: .fr, currency: "eur"), stale: true)
  ScreenEntry.preview(.sample(), problem: .locked)
}

#Preview("Lock screen, circular", as: .accessoryCircular) {
  ScreenWidget()
} timeline: {
  ScreenEntry.sample()
  ScreenEntry.preview(.sample(metric: .arr))
}

#Preview("Lock screen, inline", as: .accessoryInline) {
  ScreenWidget()
} timeline: {
  ScreenEntry.sample()
}
