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
        ScreenBackground(style: screenStyle)
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
      WidgetMessageView(name: figures?.name ?? entry.screen?.name, message: message, hasScreen: entry.screen != nil, style: style)
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
  let style: ScreenStyle

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Image(systemName: hasScreen ? "exclamationmark.circle" : "plus.circle")
        .font(.title3)
        .foregroundStyle(style.glowInk)
        .widgetAccentable()
      Spacer(minLength: 0)
      if let name {
        Text(name).font(.caption.weight(.semibold)).foregroundStyle(style.ink2).lineLimit(1)
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
