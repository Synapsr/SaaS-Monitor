import SwiftUI
import WidgetKit

@main
struct ScreenWidgets: WidgetBundle {
  var body: some Widget {
    ScreenWidget()
  }
}

/// A screen on the home screen, the lock screen, in StandBy and in CarPlay (which shows small
/// widgets since iOS 26).
struct ScreenWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: "ScreenWidget",
      intent: SelectScreenIntent.self,
      provider: ScreenTimelineProvider()
    ) { entry in
      ScreenWidgetView(entry: entry)
    }
    .configurationDisplayName("Screen")
    .description("Your recurring revenue live: its growth, its curve, your goal and today’s revenue.")
    .supportedFamilies([
      .systemSmall, .systemMedium, .accessoryRectangular, .accessoryCircular, .accessoryInline,
    ])
  }
}

struct ScreenWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ScreenEntry

  var body: some View {
    Group {
      switch family {
      case .systemSmall, .systemMedium, .systemLarge, .systemExtraLarge:
        SystemScreenView(entry: entry)
      default:
        AccessoryScreenView(entry: entry)
          .containerBackground(for: .widget) {}
      }
    }
    .widgetURL(entry.url)
  }
}
