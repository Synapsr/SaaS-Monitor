import SwiftUI

/// The open notch: the selected screen as its wall shows it, in short. Its number and how it moved,
/// its curve, its latest events; which screen, and where to open it, beside the notch.
struct ScreenPanel: View {
  let model: NotchModel

  var body: some View {
    let screen = model.library.selected
    let snapshot = model.monitor.snapshot(of: screen)
    VStack(spacing: 0) {
      PanelBar(model: model, screen: screen, snapshot: snapshot)
      Group {
        if let screen {
          if let state = snapshot?.state, state.status == .ready {
            ScreenFiguresView(figures: ScreenFigures(state))
          } else {
            ScreenStatus(screen: screen, snapshot: snapshot, actions: model.actions)
          }
        } else {
          Welcome(actions: model.actions)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

/// Beside the notch: the screen shown, to switch to another, and its wall and the settings.
private struct PanelBar: View {
  let model: NotchModel
  let screen: SharedScreen?
  let snapshot: ScreenSnapshot?

  var body: some View {
    let layout = model.layout
    let wing = (layout.size(.expanded).width - 2 * NotchLayout.flare - layout.notch.width) / 2
    let style = (snapshot?.state.map { ScreenFigures($0).style } ?? ScreenStyle(accent: "emerald", theme: .dark)).onDark
    HStack(spacing: 0) {
      HStack(spacing: 6) {
        if let screen {
          if model.library.screens.count > 1 {
            Menu {
              ForEach(model.library.screens) { other in
                Button {
                  model.library.select(other.key)
                } label: {
                  if other.key == screen.key { Label(other.name, systemImage: "checkmark") } else { Text(other.name) }
                }
              }
            } label: {
              ScreenName(screen: screen, snapshot: snapshot, style: style, chevron: true)
            }
            .menuStyle(.borderlessButton)
            .menuIndicator(.hidden)
            .fixedSize()
          } else {
            ScreenName(screen: screen, snapshot: snapshot, style: style, chevron: false)
          }
        }
        Spacer(minLength: 0)
      }
      .padding(.leading, 20)
      .frame(width: wing)

      Spacer(minLength: 0)

      HStack(spacing: 2) {
        Spacer(minLength: 0)
        if let screen {
          BarButton(symbol: "arrow.up.right.square", help: "Open the wall in your browser") {
            model.actions.openWall(screen)
          }
        }
        BarButton(symbol: "gearshape", help: "Settings") { model.actions.openSettings() }
      }
      .padding(.trailing, 14)
      .frame(width: wing)
    }
    .frame(height: layout.notch.height)
  }
}

private struct ScreenName: View {
  let screen: SharedScreen
  let snapshot: ScreenSnapshot?
  let style: ScreenStyle
  let chevron: Bool

  var body: some View {
    HStack(spacing: 6) {
      if let snapshot, snapshot.state != nil {
        let fresh = !snapshot.isStale(at: .now)
        if fresh { LiveDot(color: style.glow, size: 5) } else { Circle().fill(style.ink3).frame(width: 5, height: 5) }
      }
      Text(screen.name)
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(style.ink)
        .lineLimit(1)
      if chevron {
        Image(systemName: "chevron.down")
          .font(.system(size: 8, weight: .bold))
          .foregroundStyle(style.ink3)
      }
    }
    .contentShape(.rect)
  }
}

private struct BarButton: View {
  let symbol: String
  let help: String
  let action: () -> Void
  @State private var hovered = false

  var body: some View {
    Button(action: action) {
      Image(systemName: symbol)
        .font(.system(size: 12, weight: .medium))
        .foregroundStyle(ScreenStyle.notch.ink.opacity(hovered ? 0.95 : 0.62))
        .frame(width: 26, height: 22)
        .background(ScreenStyle.notch.ink.opacity(hovered ? 0.1 : 0), in: .rect(cornerRadius: 6))
    }
    .buttonStyle(.plain)
    .onHover { hovered = $0 }
    .help(help)
    .accessibilityLabel(help)
  }
}

/// The screen's number, how it moved in 30 days and today's revenue, its curve, and its two latest
/// events.
private struct ScreenFiguresView: View {
  let figures: ScreenFigures
  @Environment(\.isStillRender) private var isStillRender

  var body: some View {
    let style = figures.style.onDark
    let format = figures.format
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .bottom) {
        VStack(alignment: .leading, spacing: 1) {
          TelemetryLabel(figures.metric.label, locale: format.locale, size: 10)
            .foregroundStyle(style.ink3)
          HeroReadout(figures, style: style, size: 40)
        }
        Spacer(minLength: 12)
        VStack(alignment: .trailing, spacing: 7) {
          DeltaChip(figures, style: style, size: 12)
          HStack(spacing: 5) {
            Text(figures.text.today)
              .foregroundStyle(style.ink3)
            Text(format.amount(figures.revenueToday))
              .fontWeight(.semibold)
              .monospacedDigit()
              .foregroundStyle(style.ink)
              .contentTransition(.numericText(value: Double(figures.revenueToday)))
          }
          .font(.system(size: 12))
        }
        .padding(.bottom, 6)
      }

      Sparkline(
        values: figures.series, color: style.glow, dotColor: style.glowInk, lineWidth: 2, fillOpacity: 0.26,
        drawsIn: !isStillRender, endInset: 6
      )
      .frame(height: 34)
      .padding(.horizontal, -4)

      if figures.feed.isEmpty {
        Text(figures.text.noActivity)
          .font(.system(size: 12))
          .foregroundStyle(style.ink3)
      } else {
        HStack(alignment: .top, spacing: 16) {
          ForEach(figures.feed.prefix(2)) { item in
            FeedRow(item: item, figures: figures, style: style, now: .now, iconSize: 24)
              .frame(maxWidth: .infinity, alignment: .leading)
          }
        }
      }
    }
    .padding(.horizontal, 22)
    .padding(.top, 8)
    .padding(.bottom, 16)
    .environment(\.locale, format.locale)
  }
}

/// A screen without numbers to show: being imported, waiting for an account, locked, gone…
private struct ScreenStatus: View {
  let screen: SharedScreen
  let snapshot: ScreenSnapshot?
  let actions: NotchModel.Actions

  var body: some View {
    let state = snapshot?.state
    let text = (state?.screen.settings.language ?? .en).text
    let style = (state.map { ScreenFigures($0).style } ?? ScreenStyle(accent: "emerald", theme: .dark)).onDark
    VStack(spacing: 10) {
      Image(systemName: symbol)
        .font(.system(size: 20, weight: .medium))
        .foregroundStyle(style.glowInk)
        .frame(width: 44, height: 44)
        .background(style.glowWash, in: .circle)
      Text(message(text))
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(style.ink2)
        .multilineTextAlignment(.center)
        .frame(maxWidth: 360)
      if snapshot?.problem == .locked {
        NotchButton(title: "Enter the password", prominent: true) { actions.unlock(screen) }
      }
    }
    .padding(.bottom, 12)
  }

  private var symbol: String {
    switch snapshot?.problem {
    case .locked: return "lock"
    case .gone: return "link.badge.plus"
    case .offline: return "icloud.slash"
    case nil: break
    }
    return switch snapshot?.state?.status {
    case .importing: "arrow.down.circle"
    case .error: "exclamationmark.triangle"
    default: "creditcard"
    }
  }

  private func message(_ text: DisplayText) -> String {
    switch snapshot?.problem {
    case .locked: return text.status.locked
    case .gone: return text.status.gone
    case .offline: return text.status.offline
    case nil: break
    }
    guard let state = snapshot?.state else { return text.status.importing }
    return ScreenFigures(state).statusMessage ?? text.status.importing
  }
}

/// Before any screen: what the notch is for, and how to start.
private struct Welcome: View {
  let actions: NotchModel.Actions

  var body: some View {
    VStack(spacing: 12) {
      PulseMark()
        .stroke(ScreenStyle.notch.glow, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
        .frame(width: 44, height: 31)
      VStack(spacing: 4) {
        Text("Your SaaS, live in the notch")
          .font(.system(size: 15, weight: .semibold))
          .foregroundStyle(ScreenStyle.notch.ink)
        Text("Add a screen from your SaaS Monitor dashboard, or try the demo.")
          .font(.system(size: 12))
          .foregroundStyle(ScreenStyle.notch.ink2)
      }
      HStack(spacing: 8) {
        NotchButton(title: "Add a screen", prominent: true) { actions.addScreen() }
        NotchButton(title: "Try the demo", prominent: false) { actions.addDemo() }
      }
    }
    .padding(.bottom, 10)
  }
}

/// A button on the notch's black: light when it is the thing to do.
struct NotchButton: View {
  let title: String
  let prominent: Bool
  let action: () -> Void
  @State private var hovered = false

  var body: some View {
    Button(action: action) {
      Text(title)
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(prominent ? ScreenStyle.notch.background : ScreenStyle.notch.ink)
        .padding(.horizontal, 14)
        .frame(height: 28)
        .background(
          prominent ? ScreenStyle.notch.ink.opacity(hovered ? 1 : 0.92) : ScreenStyle.notch.ink.opacity(hovered ? 0.16 : 0.1),
          in: .capsule)
    }
    .buttonStyle(.plain)
    .onHover { hovered = $0 }
  }
}
