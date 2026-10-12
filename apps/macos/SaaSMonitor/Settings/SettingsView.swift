import AppKit
import SwiftUI

/// The app's settings, on one page: the screens it follows, the one in the notch, and the few
/// things the notch does on this Mac.
struct SettingsView: View {
  let library: ScreenLibrary
  let monitor: ScreenMonitor
  let preferences: Preferences
  let onAdd: () -> Void
  let onRemove: (SharedScreen) -> Void

  @Environment(\.colorScheme) private var colorScheme

  private static let version =
    Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? ""

  var body: some View {
    @Bindable var preferences = preferences
    VStack(alignment: .leading, spacing: 22) {
      HStack(spacing: 14) {
        Image(nsImage: NSApp.applicationIconImage)
          .resizable()
          .frame(width: 54, height: 54)
        VStack(alignment: .leading, spacing: 2) {
          Text("SaaS Monitor")
            .font(.title2.weight(.semibold))
          Text("Your screens, live in the notch.")
            .foregroundStyle(.secondary)
        }
      }

      SettingsGroup("Screens") {
        ForEach(library.screens) { screen in
          ScreenRow(
            screen: screen,
            snapshot: monitor.snapshot(of: screen),
            isShown: library.selected?.key == screen.key,
            show: { library.select(screen.key) },
            remove: { onRemove(screen) })
          RowDivider()
        }
        AddScreenRow(action: onAdd)
      }

      SettingsGroup("Notch") {
        ToggleRow(
          symbol: "chart.line.uptrend.xyaxis", title: "Numbers beside the notch",
          detail: "The curve and the number, between moments", isOn: $preferences.showsFigures)
        RowDivider()
        ToggleRow(
          symbol: "speaker.wave.2.fill", title: "Sounds and voices",
          detail: "As each screen plays them", isOn: $preferences.playsSounds)
        RowDivider()
        ToggleRow(
          symbol: "arrow.up.left.and.arrow.down.right", title: "Over full-screen apps",
          isOn: $preferences.showsOverFullScreen)
        RowDivider()
        ToggleRow(symbol: "power", title: "Open at login", isOn: $preferences.opensAtLogin)
      }

      // A full menu bar hides the app's icon behind the notch: quitting stays at hand here.
      HStack {
        Text("Version \(Self.version)")
        Spacer()
        Button("Quit SaaS Monitor") { NSApp.terminate(nil) }
          .buttonStyle(.borderless)
      }
      .font(.callout)
      .foregroundStyle(.secondary)
      .padding(.horizontal, 4)
    }
    .padding(.horizontal, 24)
    .padding(.top, 26)
    .padding(.bottom, 20)
    .frame(width: 440)
    .tint(Brand.tint(colorScheme))
  }
}

/// The brand's emerald, as each theme draws it.
enum Brand {
  static func tint(_ scheme: ColorScheme) -> Color {
    ScreenStyle(accent: "emerald", theme: scheme == .dark ? .dark : .light).glow
  }
}

/// A titled card of rows, as System Settings groups them.
private struct SettingsGroup<Content: View>: View {
  let title: String
  @ViewBuilder let content: Content

  init(_ title: String, @ViewBuilder content: () -> Content) {
    self.title = title
    self.content = content()
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 7) {
      Text(title)
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(.secondary)
        .padding(.leading, 4)
      VStack(spacing: 0) { content }
        .background(Color(nsColor: .controlBackgroundColor), in: .rect(cornerRadius: 12))
        .overlay {
          RoundedRectangle(cornerRadius: 12).strokeBorder(Color(nsColor: .separatorColor).opacity(0.6), lineWidth: 0.5)
        }
    }
  }
}

private struct RowDivider: View {
  var body: some View {
    Divider().padding(.leading, 56)
  }
}

/// A screen: its curve in its own colors, its name and instance, its number now. Clicked, it goes
/// in the notch; a tick says which one is.
private struct ScreenRow: View {
  let screen: SharedScreen
  let snapshot: ScreenSnapshot?
  let isShown: Bool
  let show: () -> Void
  let remove: () -> Void
  @State private var hovered = false

  var body: some View {
    let figures = snapshot?.state.flatMap { $0.status == .ready ? ScreenFigures($0) : nil }
    HStack(spacing: 12) {
      ScreenThumbnail(figures: figures)
      VStack(alignment: .leading, spacing: 1) {
        Text(screen.name)
          .fontWeight(.medium)
        Text(screen.link.instanceLabel)
          .font(.caption)
          .foregroundStyle(.secondary)
      }
      .lineLimit(1)
      Spacer(minLength: 8)
      if hovered {
        Button(action: remove) {
          Image(systemName: "trash")
        }
        .buttonStyle(.borderless)
        .foregroundStyle(.secondary)
        .help("Remove \(screen.name)")
      } else if let figures {
        Text(figures.compactValueText)
          .monospacedDigit()
          .foregroundStyle(.secondary)
      }
      Image(systemName: isShown ? "checkmark.circle.fill" : "circle")
        .font(.title3)
        .foregroundStyle(isShown ? AnyShapeStyle(.tint) : AnyShapeStyle(.quaternary))
        .help(isShown ? "In the notch" : "Show in the notch")
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 9)
    .contentShape(.rect)
    .onTapGesture(perform: show)
    .onHover { hovered = $0 }
    .contextMenu {
      Button("Show in the notch", action: show)
        .disabled(isShown)
      if let url = screen.link.url {
        Button("Open the wall") { NSWorkspace.shared.open(url) }
      }
      Divider()
      Button("Remove", role: .destructive, action: remove)
    }
    .accessibilityElement(children: .combine)
    .accessibilityAddTraits(isShown ? [.isButton, .isSelected] : .isButton)
  }
}

/// A screen in a tile: its curve in its accent on the notch's black, or the pulse before it has
/// one.
private struct ScreenThumbnail: View {
  let figures: ScreenFigures?

  var body: some View {
    let style = figures?.style.onDark ?? .notch
    ZStack {
      RoundedRectangle(cornerRadius: 9)
        .fill(style.background)
      if let figures, figures.series.count > 1 {
        Sparkline(values: figures.series, color: style.glow, dotColor: style.glowInk, lineWidth: 1.5, fillOpacity: 0.3)
          .padding(.horizontal, 5)
          .padding(.vertical, 9)
      } else {
        PulseMark()
          .stroke(style.glow, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
          .padding(9)
      }
    }
    .frame(width: 36, height: 36)
    .overlay {
      RoundedRectangle(cornerRadius: 9).strokeBorder(.white.opacity(0.08), lineWidth: 0.5)
    }
  }
}

private struct AddScreenRow: View {
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      HStack(spacing: 12) {
        Image(systemName: "plus")
          .font(.system(size: 14, weight: .semibold))
          .frame(width: 36, height: 36)
          .background(.tint.opacity(0.14), in: .rect(cornerRadius: 9))
        Text("Add a screen")
          .fontWeight(.medium)
        Spacer()
      }
      .foregroundStyle(.tint)
      .padding(.horizontal, 12)
      .padding(.vertical, 9)
      .contentShape(.rect)
    }
    .buttonStyle(.plain)
  }
}

/// A switch, its icon on a quiet tile: the color is left to the screens and to what is on.
private struct ToggleRow: View {
  let symbol: String
  let title: String
  var detail: String?
  @Binding var isOn: Bool

  var body: some View {
    HStack(spacing: 12) {
      Image(systemName: symbol)
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(.secondary)
        .frame(width: 28, height: 28)
        .background(.quaternary.opacity(0.6), in: .rect(cornerRadius: 7))
        .frame(width: 36)
      VStack(alignment: .leading, spacing: 1) {
        Text(title)
        if let detail {
          Text(detail)
            .font(.caption)
            .foregroundStyle(.secondary)
        }
      }
      Spacer(minLength: 8)
      Toggle(title, isOn: $isOn)
        .labelsHidden()
        .toggleStyle(.switch)
        .controlSize(.small)
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 9)
  }
}
