import SwiftUI
import WidgetKit

/// A screen on the lock screen, and on watch faces and the Smart Stack, as instruments: the goal's
/// ring around the number, or the number with its curve. The system renders them in one or two
/// tints on most faces, so they lean on the hierarchy of `.primary` and `.secondary` and mark their
/// accent parts accentable; the screen's colors only show where the face is in full color. Amounts
/// hide on a locked device.
struct AccessoryScreenView: View {
  @Environment(\.widgetFamily) private var family
  @Environment(\.widgetRenderingMode) private var renderingMode
  @Environment(\.isLuminanceReduced) private var isLuminanceReduced
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
      circular(figures)
    case .accessoryInline:
      // The arrow says the way: "MRR 5,8 k€ ▲ 1,2 %".
      ViewThatFits {
        Text(verbatim: "\(figures.metric.label) \(figures.compactValueText) \(arrow(figures)) \(figures.unsignedDeltaText)")
        Text(verbatim: "\(figures.metric.label) \(figures.compactValueText)")
        Text(verbatim: figures.compactValueText)
      }
      .monospacedDigit()
      .privacySensitive()
    #if os(watchOS)
    case .accessoryCorner:
      Text(figures.format.compactNumber(figures.value))
        .fontWeight(.semibold)
        .monospacedDigit()
        .privacySensitive()
        .widgetCurvesContent()
        .widgetLabel {
          Gauge(value: figures.goal.progress) {
            Text(figures.metric.label)
          } currentValueLabel: {
            Text(figures.goalPercentText)
          }
          .tint(ringGradient(figures))
        }
    #endif
    default:
      rectangular(figures)
    }
  }

  /// The goal's ring around the compact number and its metric.
  private func circular(_ figures: ScreenFigures) -> some View {
    GeometryReader { proxy in
      let side = min(proxy.size.width, proxy.size.height)
      let lineWidth = max(3.5, side * 0.085)
      ZStack {
        AccessoryWidgetBackground()
        AccessoryRing(progress: figures.goal.progress, lineWidth: lineWidth, tint: ringGradient(figures), glows: glows)
          .padding(lineWidth * 0.9)
        VStack(spacing: 0) {
          Text(verbatim: figures.format.compactNumber(figures.value))
            .font(.system(size: side * 0.26, weight: .semibold))
            .monospacedDigit()
            .minimumScaleFactor(0.5)
            .privacySensitive()
          Text(verbatim: figures.metric.label)
            .font(.system(size: side * 0.13, weight: .semibold, design: .monospaced))
            .tracking(side * 0.012)
            .foregroundStyle(.secondary)
        }
        .lineLimit(1)
        .padding(.horizontal, lineWidth * 2.6)
      }
      .frame(width: proxy.size.width, height: proxy.size.height)
    }
    .accessibilityElement(children: .combine)
  }

  /// "PELLI · MRR" and whether it's live, the number, how it moved, and its curve.
  private func rectangular(_ figures: ScreenFigures) -> some View {
    VStack(alignment: .leading, spacing: 1) {
      HStack(spacing: 4) {
        Text(verbatim: figures.name.uppercased(with: figures.format.locale))
          .layoutPriority(-1)
        Text(verbatim: "· \(figures.metric.label)")
          .foregroundStyle(.secondary)
          .fixedSize()
        Spacer(minLength: 2)
        freshness(figures)
      }
      .font(.system(size: 11, weight: .semibold, design: .monospaced))
      .tracking(1)
      .lineLimit(1)
      .widgetAccentable()
      HStack(alignment: .bottom, spacing: 6) {
        VStack(alignment: .leading, spacing: 0) {
          HeroReadout(
            text: figures.format.attributedAmount(figures.value),
            value: figures.value,
            style: figures.style.onDark,
            size: 24,
            ink: .primary
          )
          .privacySensitive()
          HStack(spacing: 3) {
            Text(verbatim: "\(arrow(figures)) \(figures.deltaText)")
              .fontWeight(.semibold)
              .privacySensitive()
            Text(verbatim: figures.text.thirtyDays)
              .font(.system(size: 10, weight: .medium, design: .monospaced))
              .foregroundStyle(.secondary)
          }
          .font(.system(size: 12))
          .monospacedDigit()
          .foregroundStyle(accent(figures))
          .widgetAccentable()
        }
        .layoutPriority(1)
        if figures.series.count > 1 {
          Sparkline(
            values: figures.series,
            color: sparklineColor(figures),
            dotColor: renderingMode == .fullColor ? figures.style.onDark.glowInk : .primary,
            lineWidth: 1.6,
            fillOpacity: renderingMode == .vibrant ? 0.22 : 0.3
          )
          .frame(maxWidth: .infinity, maxHeight: 30)
          .widgetAccentable()
          .privacySensitive()
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  @ViewBuilder
  private func freshness(_ figures: ScreenFigures) -> some View {
    if entry.isStale {
      Image(systemName: entry.isOffline ? "icloud.slash" : "clock")
        .font(.system(size: 10, weight: .semibold))
        .foregroundStyle(.secondary)
    } else {
      Circle()
        .fill(renderingMode == .fullColor ? figures.style.onDark.glow : .primary)
        .frame(width: 5, height: 5)
    }
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
      VStack(alignment: .leading, spacing: 2) {
        Text(verbatim: (name ?? "SaaS Monitor").uppercased())
          .font(.system(size: 11, weight: .semibold, design: .monospaced))
          .tracking(1)
          .lineLimit(1)
          .widgetAccentable()
        Text(message).font(.caption).foregroundStyle(.secondary).lineLimit(2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }

  private func arrow(_ figures: ScreenFigures) -> String {
    switch figures.trend {
    case .up: "▲"
    case .flat: "–"
    case .down: "▼"
    }
  }

  private var glows: Bool { renderingMode == .fullColor && !isLuminanceReduced }

  /// The screen's colors where the face shows them; the system's tint elsewhere.
  private func accent(_ figures: ScreenFigures) -> Color {
    renderingMode == .fullColor && figures.trend == .up ? figures.style.onDark.glowInk : .secondary
  }

  private func sparklineColor(_ figures: ScreenFigures) -> Color {
    renderingMode == .fullColor ? figures.style.onDark.glow : .primary
  }

  private func ringGradient(_ figures: ScreenFigures) -> Gradient {
    let style = figures.style.onDark
    return renderingMode == .fullColor ? Gradient(colors: [style.glowDeep, style.glow]) : Gradient(colors: [.primary])
  }
}

/// A gauge's ring as complications draw it: a faint track, the progress with round caps, and its
/// tip lit where the face is in full color.
private struct AccessoryRing: View {
  let progress: Double
  let lineWidth: CGFloat
  let tint: Gradient
  let glows: Bool

  var body: some View {
    let progress = min(1, max(0, progress))
    ZStack {
      Circle()
        .stroke(.primary.opacity(0.18), lineWidth: lineWidth)
      if progress > 0 {
        Circle()
          .trim(from: 0, to: progress)
          .stroke(
            AngularGradient(gradient: tint, center: .center, startAngle: .degrees(0), endAngle: .degrees(360 * progress)),
            style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
          )
          .rotationEffect(.degrees(-90))
          .shadow(color: glows ? (tint.stops.last?.color ?? .clear).opacity(0.7) : .clear, radius: lineWidth * 0.6)
          .widgetAccentable()
      }
    }
  }
}
