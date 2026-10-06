import SwiftUI
import WidgetKit

@main
struct WatchWidgets: WidgetBundle {
  var body: some Widget {
    WatchScreenWidget()
  }
}

/// A screen on watch faces and in the Smart Stack. A tap opens it in the watch app.
struct WatchScreenWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: "ScreenWidget",
      intent: SelectScreenIntent.self,
      provider: ScreenTimelineProvider()
    ) { entry in
      AccessoryScreenView(entry: entry)
        .containerBackground(for: .widget) {
          // Shown in the Smart Stack only: faces draw complications on their own background.
          TelemetryBackground(
            style: (entry.content.figures?.style ?? ScreenStyle(accent: "emerald", theme: .dark)).onDark,
            glowCenter: .topLeading,
            glowRadius: 160,
            showsGrid: false
          )
        }
        .widgetURL(entry.url)
    }
    .configurationDisplayName("Screen")
    .description("Your recurring revenue, its growth and your goal, at a glance.")
    .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryCorner, .accessoryInline])
  }
}

#Preview("Smart Stack", as: .accessoryRectangular) {
  WatchScreenWidget()
} timeline: {
  ScreenEntry.sample()
  ScreenEntry.preview(.sample(metric: .arr, accent: "sky", language: .fr, currency: "eur"), stale: true)
}

#Preview("Corner", as: .accessoryCorner) {
  WatchScreenWidget()
} timeline: {
  ScreenEntry.sample()
}

#Preview("Circular", as: .accessoryCircular) {
  WatchScreenWidget()
} timeline: {
  ScreenEntry.sample()
}
