import SwiftUI

/// A screen on the wrist, a page at a time as the Digital Crown turns: now, the goal, today and
/// this month, the latest activity. Fetched from its instance while the app is in front, with its
/// moments as they happen.
struct ScreenDetailView: View {
  @Environment(\.scenePhase) private var scenePhase
  let screen: SharedScreen
  @State private var snapshot: ScreenSnapshot?
  @State private var moments = MomentPresenter()

  /// As often as the wall: moments come as they happen. Only while the app is in front.
  private static let refreshInterval: Duration = .seconds(10)

  var body: some View {
    content
      .navigationTitle(screen.name)
      // In the screen's accent, as everything else.
      .toolbarForegroundStyle(style(of: snapshot?.state.map(ScreenFigures.init)).glowInk, for: .navigationBar)
      .task(id: scenePhase) { await refresh() }
      .fullScreenCover(isPresented: showsMoment) { MomentStage(presenter: moments) }
  }

  @ViewBuilder
  private var content: some View {
    if let snapshot {
      switch ScreenContent(snapshot) {
      case .figures(let figures):
        ScreenPages(figures: figures, snapshot: snapshot)
      case .message(let message, let figures):
        ScreenMessageView(message: message, symbol: Self.symbol(snapshot.problem, figures?.status), style: style(of: figures))
      }
    } else {
      ProgressView()
        .containerBackground(for: .navigation) { TelemetryBackground(style: style(of: nil)) }
    }
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

  private static func symbol(_ problem: ScreenSnapshot.Problem?, _ status: DisplayState.Status?) -> String {
    switch (problem, status) {
    case (.locked, _): "lock.fill"
    case (.gone, _): "link"
    case (_, .importing): "hourglass"
    case (_, .empty): "powerplug"
    case (_, .error): "exclamationmark.triangle"
    default: "icloud.slash"
    }
  }

  /// The watch is always dark: the screen's accent on the dark theme.
  private func style(of figures: ScreenFigures?) -> ScreenStyle {
    figures?.style.onDark ?? ScreenStyle(accent: "emerald", theme: .dark)
  }
}

/// Why there are no numbers: a protected or gone screen, one still importing, or an instance out
/// of reach.
private struct ScreenMessageView: View {
  let message: String
  let symbol: String
  let style: ScreenStyle

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Image(systemName: symbol)
        .font(.system(size: 17, weight: .semibold))
        .foregroundStyle(style.glowInk)
        .frame(width: 38, height: 38)
        .background(style.glowWash, in: .circle)
        .overlay { Circle().strokeBorder(style.glow.opacity(0.4), lineWidth: 1) }
        .shadow(color: style.glow.opacity(0.5), radius: 8)
      Text(message)
        .font(.headline)
        .foregroundStyle(style.ink)
        .fixedSize(horizontal: false, vertical: true)
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding(.horizontal, 4)
    .containerBackground(for: .navigation) { TelemetryBackground(style: style, showsGrid: false) }
  }
}

#Preview {
  NavigationStack {
    ScreenDetailView(screen: .sample)
  }
}
