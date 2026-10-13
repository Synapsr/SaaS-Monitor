import SwiftUI
import WidgetKit

/// A screen on the home screen, in StandBy and in CarPlay: on its theme's background, with the
/// accent's glow, like the wall. StandBy and CarPlay remove the background: the content then
/// switches to the dark theme, as it sits on black.
struct SystemScreenView: View {
  @Environment(\.widgetFamily) private var family
  @Environment(\.showsWidgetContainerBackground) private var showsBackground
  let entry: ScreenEntry

  var body: some View {
    content
      .containerBackground(for: .widget) {
        TelemetryBackground(style: screenStyle, glowCenter: .topLeading, glowRadius: family == .systemMedium ? 260 : 190)
      }
  }

  @ViewBuilder
  private var content: some View {
    switch entry.content {
    case .figures(let figures):
      if family == .systemMedium {
        MediumScreenView(entry: entry, figures: figures, style: style)
      } else {
        SmallScreenView(entry: entry, figures: figures, style: style)
      }
    case .message(let message, let figures):
      WidgetMessageView(
        name: figures?.name ?? entry.screen?.name,
        message: message,
        hasScreen: entry.screen != nil,
        locale: figures?.format.locale ?? .current,
        style: style
      )
    }
  }

  /// The screen's own colors, or the dark theme's where the system shows no background.
  private var style: ScreenStyle {
    showsBackground ? screenStyle : screenStyle.onDark
  }

  private var screenStyle: ScreenStyle {
    entry.content.figures?.style ?? ScreenStyle(accent: "emerald", theme: .dark)
  }
}

/// Why there are no numbers: no screen yet, a protected or gone screen, or one still importing.
struct WidgetMessageView: View {
  let name: String?
  let message: String
  let hasScreen: Bool
  let locale: Locale
  let style: ScreenStyle

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Image(systemName: hasScreen ? "exclamationmark" : "plus")
        .font(.system(size: 14, weight: .bold))
        .foregroundStyle(style.glowInk)
        .frame(width: 30, height: 30)
        .background(style.glowWash, in: .circle)
        .overlay { Circle().strokeBorder(style.glow.opacity(0.4), lineWidth: 1) }
        .widgetAccentable()
      Spacer(minLength: 0)
      if let name {
        TelemetryLabel(name, locale: locale).foregroundStyle(style.ink3)
      }
      Text(message)
        .font(.subheadline.weight(.medium))
        .foregroundStyle(style.ink)
        .lineLimit(4)
        .minimumScaleFactor(0.8)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}
