import SwiftUI

/// A screen on the wrist: its recurring revenue, growth, today's revenue, goal and latest
/// activity, fetched from its instance while the app is in front, and its moments as they happen.
struct ScreenDetailView: View {
  @Environment(\.scenePhase) private var scenePhase
  let screen: SharedScreen
  @State private var snapshot: ScreenSnapshot?
  @State private var moments = MomentPresenter()

  /// As often as the wall: moments come as they happen. Only while the app is in front.
  private static let refreshInterval: Duration = .seconds(10)

  var body: some View {
    ScrollView {
      Group {
        if let snapshot {
          switch ScreenContent(snapshot) {
          case .figures(let figures):
            ScreenFiguresView(figures: figures, snapshot: snapshot)
          case .message(let message, _):
            Text(message)
              .font(.footnote)
              .foregroundStyle(.secondary)
              .frame(maxWidth: .infinity, alignment: .leading)
          }
        } else {
          ProgressView()
        }
      }
      .padding(.horizontal, 4)
    }
    .navigationTitle(screen.name)
    .containerBackground(accentGradient, for: .navigation)
    .task(id: scenePhase) { await refresh() }
    .fullScreenCover(isPresented: showsMoment) { MomentStage(presenter: moments) }
  }

  private var showsMoment: Binding<Bool> {
    Binding(get: { moments.current != nil }, set: { if !$0 { moments.clear() } })
  }

  private func refresh() async {
    let loader = ScreenLoader()
    if snapshot == nil { snapshot = loader.cached(screen) }
    while scenePhase == .active, !Task.isCancelled {
      let loaded = await loader.load(screen)
      snapshot = loaded
      // Only states just fetched: the last one known may be hours old.
      if loaded.problem == nil, let state = loaded.state { moments.track(state) }
      try? await Task.sleep(for: Self.refreshInterval)
    }
  }

  /// The accent glowing from the top, as on the wall.
  private var accentGradient: LinearGradient {
    let style = snapshot?.state.map(ScreenFigures.init)?.style.onDark ?? ScreenStyle(accent: "emerald", theme: .dark)
    return LinearGradient(colors: [style.glow.opacity(0.3), style.background], startPoint: .top, endPoint: .center)
  }
}

private struct ScreenFiguresView: View {
  let figures: ScreenFigures
  let snapshot: ScreenSnapshot

  private var style: ScreenStyle { figures.style.onDark }

  var body: some View {
    TimelineView(.everyMinute) { context in
      VStack(alignment: .leading, spacing: 10) {
        hero
        GoalBar(figures: figures, style: style, showsRemaining: true)
          .font(.caption2)
        activity(now: context.date)
        if snapshot.isStale(at: context.date), let fetchedAt = snapshot.fetchedAt {
          Label(figures.format.fetchTime(fetchedAt, now: context.date), systemImage: snapshot.problem == .offline ? "icloud.slash" : "clock")
            .font(.caption2)
            .foregroundStyle(style.ink3)
        }
      }
    }
  }

  private var hero: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(figures.metric.label)
        .font(.caption2.weight(.semibold))
        .foregroundStyle(style.ink3)
      Text(figures.valueText)
        .font(.system(size: 32, weight: .semibold))
        .monospacedDigit()
        .lineLimit(1)
        .minimumScaleFactor(0.5)
        .foregroundStyle(style.ink)
      GrowthLabel(figures: figures, style: style)
        .font(.footnote)
      HStack(spacing: 4) {
        Text(figures.text.revenueToday).foregroundStyle(style.ink3)
        Text(figures.revenueTodayText).fontWeight(.semibold).monospacedDigit().foregroundStyle(style.ink)
      }
      .font(.footnote)
      .lineLimit(1)
      .padding(.top, 2)
    }
  }

  @ViewBuilder
  private func activity(now: Date) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(figures.text.latestActivity)
        .font(.caption2.weight(.semibold))
        .foregroundStyle(style.ink3)
      if figures.feed.isEmpty {
        Text(figures.text.noActivity).font(.footnote).foregroundStyle(style.ink2)
      }
      ForEach(figures.feed.prefix(5)) { item in
        FeedRow(item: item, figures: figures, style: style, now: now, iconSize: 22)
          .font(.footnote)
      }
    }
  }
}

#Preview {
  NavigationStack {
    ScreenDetailView(screen: .sample)
  }
}
