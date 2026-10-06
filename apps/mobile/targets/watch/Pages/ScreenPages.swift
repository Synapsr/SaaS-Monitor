import SwiftUI

/// A screen's numbers as vertical pages: the hero first, then what it leads to.
struct ScreenPages: View {
  let figures: ScreenFigures
  let snapshot: ScreenSnapshot

  private var style: ScreenStyle { figures.style.onDark }

  var body: some View {
    TabView {
      NowPage(figures: figures, snapshot: snapshot, style: style)
        .containerBackground(for: .tabView) { TelemetryBackground(style: style) }
      GoalPage(figures: figures, style: style)
        .containerBackground(for: .tabView) { TelemetryBackground(style: style, glowCenter: .center, glowRadius: 150, showsGrid: false) }
      TodayPage(figures: figures, style: style)
        .containerBackground(for: .tabView) { TelemetryBackground(style: style, showsGrid: false) }
      ActivityPage(figures: figures, style: style)
        .containerBackground(for: .tabView) { TelemetryBackground(style: style, showsGrid: false) }
    }
    .tabViewStyle(.verticalPage)
  }
}

extension View {
  /// Keeps a page's content off the round edges, and clear of the page indicator on the trailing
  /// one.
  func pageInsets() -> some View {
    padding(.leading, 6).padding(.trailing, 12)
  }
}
