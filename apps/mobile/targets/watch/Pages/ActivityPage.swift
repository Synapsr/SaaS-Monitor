import SwiftUI

/// The latest feed items, each on its card.
struct ActivityPage: View {
  let figures: ScreenFigures
  let style: ScreenStyle

  /// What a wrist reads before it turns back.
  private static let length = 5

  var body: some View {
    TimelineView(.everyMinute) { context in
      ScrollView {
        VStack(alignment: .leading, spacing: 6) {
          TelemetryLabel(figures.text.latestActivity, locale: figures.format.locale)
            .foregroundStyle(style.ink3)
            .padding(.leading, 4)
          if figures.feed.isEmpty {
            Text(figures.text.noActivity)
              .font(.footnote)
              .foregroundStyle(style.ink2)
              .padding(.leading, 4)
          }
          ForEach(figures.feed.prefix(Self.length)) { item in
            FeedRow(item: item, figures: figures, style: style, now: context.date, iconSize: 26)
              .font(.footnote)
              .padding(.horizontal, 8)
              .padding(.vertical, 7)
              .watchCard(style: style, cornerRadius: 14)
          }
        }
        .padding(.trailing, 6)
      }
    }
  }
}
