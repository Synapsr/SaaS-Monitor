import SwiftUI

/// The screens shared by the iPhone app. With a single one, the app opens on it.
struct ScreenListView: View {
  @Environment(WatchScreens.self) private var model
  @State private var path: [SharedScreen] = []

  var body: some View {
    NavigationStack(path: $path) {
      Group {
        if model.screens.isEmpty {
          NoScreenView()
        } else if model.screens.count == 1, let screen = model.screens.first {
          ScreenDetailView(screen: screen)
        } else {
          List(model.screens) { screen in
            NavigationLink(value: screen) { ScreenRow(screen: screen) }
          }
          .navigationTitle("Screens")
        }
      }
      .navigationDestination(for: SharedScreen.self) { ScreenDetailView(screen: $0) }
    }
    // A complication opens its screen: `saasmonitor://screen/{key}`.
    .onOpenURL { url in
      guard url.host() == "screen", let screen = model.screen(key: url.lastPathComponent) else { return }
      path = model.screens.count == 1 ? [] : [screen]
    }
  }
}

/// A screen and its last known number.
private struct ScreenRow: View {
  let screen: SharedScreen
  @State private var figures: ScreenFigures?

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(screen.name).font(.headline).lineLimit(1)
      if let figures, figures.hasNumbers {
        HStack(spacing: 4) {
          Text(figures.valueText).monospacedDigit()
          Text(figures.metric.label).foregroundStyle(.secondary)
        }
        .font(.footnote)
      }
    }
    .padding(.vertical, 2)
    // Again on each return from a screen, which has just fetched its numbers.
    .task { figures = ScreenLoader().cached(screen)?.state.map(ScreenFigures.init) }
  }
}

/// Screens come from the iPhone app.
private struct NoScreenView: View {
  var body: some View {
    VStack(spacing: 8) {
      Image(systemName: "iphone")
        .font(.title2)
        .foregroundStyle(.tint)
      Text("Add a screen in SaaS Monitor on your iPhone: it shows up here.")
        .font(.footnote)
        .multilineTextAlignment(.center)
        .foregroundStyle(.secondary)
    }
    .padding()
  }
}

#Preview {
  ScreenListView()
    .environment(WatchScreens())
}
