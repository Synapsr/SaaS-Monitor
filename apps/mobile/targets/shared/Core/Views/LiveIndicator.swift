import SwiftUI

/// Whether the numbers are live, as the wall's top bar says it: the accent's dot with a soft
/// pulsing halo, and "LIVE". Numbers that may be outdated get a still, dim dot (a crossed-out cloud
/// when the instance can't be reached) and their age instead: "2 h ago".
struct LiveIndicator: View {
  let freshness: Freshness
  let format: ScreenFormat
  let style: ScreenStyle
  /// The time ages are counted from.
  let now: Date
  var size: CGFloat = 10
  var showsLabel = true

  enum Freshness: Equatable {
    case live
    /// `fetchedAt` is when the numbers were fetched.
    case stale(fetchedAt: Date, offline: Bool)
  }

  var body: some View {
    HStack(spacing: size * 0.5) {
      switch freshness {
      case .live:
        LiveDot(color: style.glow, size: size * 0.6)
      case .stale(_, let offline):
        if offline {
          Image(systemName: "icloud.slash")
            .font(.system(size: size * 0.95, weight: .semibold))
        } else {
          Circle().fill(style.ink3).frame(width: size * 0.6, height: size * 0.6)
        }
      }
      if showsLabel {
        TelemetryLabel(label, locale: format.locale, size: size)
      }
    }
    .foregroundStyle(freshness == .live ? style.ink2 : style.ink3)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(label)
  }

  private var label: String {
    switch freshness {
    case .live: format.text.live
    case .stale(let fetchedAt, _): format.feedTime(fetchedAt, now: now)
    }
  }
}

extension LiveIndicator.Freshness {
  init(_ snapshot: ScreenSnapshot, at date: Date) {
    if snapshot.isStale(at: date), let fetchedAt = snapshot.fetchedAt {
      self = .stale(fetchedAt: fetchedAt, offline: snapshot.problem == .offline)
    } else {
      self = .live
    }
  }
}

/// The accent's dot, its halo breathing out every few seconds: the only thing that loops. Still
/// with reduced motion, on a dimmed Always On screen, and in widgets, which don't animate.
struct LiveDot: View {
  let color: Color
  var size: CGFloat = 6
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.isLuminanceReduced) private var isLuminanceReduced
  @State private var pulsing = false

  var body: some View {
    Circle()
      .fill(color)
      .frame(width: size, height: size)
      .shadow(color: isLuminanceReduced ? .clear : color.opacity(0.9), radius: size * 0.6)
      .background {
        if !reduceMotion && !isLuminanceReduced {
          Circle()
            .fill(color)
            .scaleEffect(pulsing ? 2.8 : 1)
            .opacity(pulsing ? 0 : 0.6)
            .onAppear {
              withAnimation(.easeOut(duration: 2.4).repeatForever(autoreverses: false)) { pulsing = true }
            }
        }
      }
  }
}
