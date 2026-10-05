import SwiftUI
import WidgetKit

/// A screen on the lock screen, and on watch faces and the Smart Stack: rendered by the system in
/// one or two tints, so it leans on the hierarchy of `.primary` and `.secondary` rather than the
/// screen's colors, which only show where the face is in full color. Amounts hide on a locked
/// device.
struct AccessoryScreenView: View {
  @Environment(\.widgetFamily) private var family
  @Environment(\.widgetRenderingMode) private var renderingMode
  let entry: ScreenEntry

  var body: some View {
    switch entry.content {
    case .figures(let figures): numbers(figures)
    case .message(let message, let figures): self.message(message, name: figures?.name ?? entry.screen?.name)
    }
  }

  @ViewBuilder
  private func numbers(_ figures: ScreenFigures) -> some View {
    switch family {
    case .accessoryCircular:
      Gauge(value: figures.goal.progress) {
        Text(figures.metric.label)
      } currentValueLabel: {
        Text(figures.format.compactNumber(figures.value)).privacySensitive()
      }
      .gaugeStyle(.accessoryCircular)
      .tint(accent(figures))
    case .accessoryInline:
      ViewThatFits {
        Text("\(Image(systemName: trendSymbol(figures))) \(figures.valueText) \(figures.metric.label) \(figures.growthPercentText ?? "")")
        Text("\(figures.valueText) \(figures.metric.label)")
      }
      .privacySensitive()
    #if os(watchOS)
    case .accessoryCorner:
      Text(figures.format.compactNumber(figures.value))
        .privacySensitive()
        .widgetCurvesContent()
        .widgetLabel {
          Gauge(value: figures.goal.progress) {
            Text(figures.metric.label)
          } currentValueLabel: {
            Text(figures.goalPercentText)
          }
          .tint(accent(figures))
        }
    #endif
    default:
      rectangular(figures)
    }
  }

  private func rectangular(_ figures: ScreenFigures) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 4) {
        Text(figures.name).lineLimit(1)
        Text(figures.metric.label).foregroundStyle(.secondary)
        if entry.isStale {
          Spacer(minLength: 2)
          Image(systemName: "clock.arrow.circlepath").foregroundStyle(.secondary)
        }
      }
      .font(.headline)
      .widgetAccentable()
      Text(figures.valueText)
        .font(.system(size: 26, weight: .semibold))
        .monospacedDigit()
        .minimumScaleFactor(0.6)
        .privacySensitive()
      Label {
        Text(figures.growthText).privacySensitive()
      } icon: {
        Image(systemName: trendSymbol(figures))
      }
      .font(.caption.weight(.medium))
      .monospacedDigit()
      .foregroundStyle(accent(figures))
    }
    .lineLimit(1)
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  @ViewBuilder
  private func message(_ message: String, name: String?) -> some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        Image(systemName: entry.screen == nil ? "plus" : "exclamationmark")
          .font(.title3.weight(.semibold))
      }
    case .accessoryInline:
      Text(name.map { "\($0): \(message)" } ?? message)
    #if os(watchOS)
    case .accessoryCorner:
      Image(systemName: entry.screen == nil ? "plus" : "exclamationmark")
        .widgetLabel(name ?? "SaaS Monitor")
    #endif
    default:
      VStack(alignment: .leading, spacing: 1) {
        Text(name ?? "SaaS Monitor").font(.headline).lineLimit(1).widgetAccentable()
        Text(message).font(.caption).foregroundStyle(.secondary).lineLimit(2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }

  private func trendSymbol(_ figures: ScreenFigures) -> String {
    figures.isGrowing ? "chart.line.uptrend.xyaxis" : "chart.line.downtrend.xyaxis"
  }

  /// The screen's accent where the face shows colors; the system's tint elsewhere.
  private func accent(_ figures: ScreenFigures) -> Color {
    renderingMode == .fullColor && figures.isGrowing ? figures.style.onDark.glowInk : .primary
  }
}
