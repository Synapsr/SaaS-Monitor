import SwiftUI

/// The screens shared by the iPhone app, each on its card. With a single one, the app opens on it.
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
          ScrollView {
            VStack(spacing: 8) {
              ForEach(model.screens) { screen in
                NavigationLink(value: screen) { ScreenCard(screen: screen) }
                  .buttonStyle(CardButtonStyle())
              }
            }
          }
          .navigationTitle("Screens")
          .containerBackground(for: .navigation) {
            TelemetryBackground(style: ScreenStyle(accent: "emerald", theme: .dark), showsGrid: false)
          }
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

/// A screen, its number and its curve, as last fetched; fetched again when the list shows. A
/// screen without numbers says why.
private struct ScreenCard: View {
  let screen: SharedScreen
  @State private var snapshot: ScreenSnapshot?

  var body: some View {
    let content = snapshot.map(ScreenContent.init)
    let figures = content?.figures
    let style = figures?.style.onDark ?? ScreenStyle(accent: "emerald", theme: .dark)
    let numbers: ScreenFigures? = if case .figures(let figures) = content { figures } else { nil }
    TimelineView(.everyMinute) { context in
      VStack(alignment: .leading, spacing: 3) {
        HStack(spacing: 6) {
          Text(screen.name)
            .font(.headline)
            .foregroundStyle(style.ink)
            .lineLimit(1)
          Spacer(minLength: 0)
          if let snapshot, let numbers {
            LiveIndicator(
              freshness: .init(snapshot, at: context.date),
              format: numbers.format,
              style: style,
              now: context.date,
              showsLabel: false
            )
          }
        }
        if let numbers {
          HStack(alignment: .firstTextBaseline, spacing: 5) {
            HeroReadout(numbers, style: style, size: 24, compact: true)
              .layoutPriority(1)
            TelemetryLabel(numbers.metric.label, locale: numbers.format.locale, size: 9)
              .foregroundStyle(style.ink3)
            Spacer(minLength: 0)
            DeltaChip(numbers, style: style, size: 11, showsPeriod: false)
          }
          Color.clear.frame(height: numbers.series.count > 1 ? 24 : 0)
        } else if case .message(let message, _) = content {
          Text(message)
            .font(.caption2)
            .foregroundStyle(style.ink3)
            .lineLimit(2)
        }
      }
      .padding(.horizontal, 12)
      .padding(.top, 10)
      .padding(.bottom, (numbers?.series.count ?? 0) > 1 ? 0 : 10)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(alignment: .bottom) {
        if let numbers, numbers.series.count > 1 {
          Sparkline(values: numbers.series, color: style.glow, dotColor: style.glowInk, lineWidth: 1.5, fillOpacity: 0.3, endInset: 16)
            .frame(height: 26)
            // Now's dot stays clear of the card's round corner.
            .padding(.bottom, 3)
        }
      }
      .watchCard(style: style, cornerRadius: 20, tint: 0.1)
    }
    // Again on each return from a screen, which has just fetched its numbers.
    .task {
      let loader = ScreenLoader()
      if snapshot == nil { snapshot = loader.cached(screen) }
      snapshot = await loader.load(screen)
    }
  }
}

/// Cards sink a little under the finger.
private struct CardButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .scaleEffect(configuration.isPressed ? 0.97 : 1)
      .opacity(configuration.isPressed ? 0.85 : 1)
      .animation(.spring(duration: 0.25), value: configuration.isPressed)
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
