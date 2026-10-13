import SwiftUI

/// The notch, grown into what it shows: the black of the hardware notch, which it extends
/// seamlessly, springing from one size to the next as its content blurs in.
struct NotchView: View {
  let model: NotchModel
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    let presentation = model.presentation
    let layout = model.layout
    let size = layout.size(presentation)
    let shape = NotchShape(flare: NotchLayout.flare, bottomRadius: layout.bottomRadius(presentation))
    let raised = presentation == .moment || presentation == .expanded

    ZStack(alignment: .top) {
      // The hardware notch's black: a screen's colors would show its edge.
      shape
        .fill(.black)
        .overlay { MomentGlow(moment: presentation == .moment ? model.stage.current : nil, shape: shape) }
        .overlay(alignment: .top) {
          content(presentation)
            .padding(.horizontal, NotchLayout.flare)
            .frame(width: size.width, height: size.height)
            .clipShape(shape)
        }
        .frame(width: size.width, height: size.height)
        .shadow(color: .black.opacity(raised ? 0.5 : 0), radius: raised ? 18 : 0, y: raised ? 8 : 0)
        .opacity(presentation == .closed && !layout.hasNotch ? 0 : 1)

      if presentation == .moment, let moment = model.stage.current, moment.celebration == .milestone {
        let style = moment.card.style
        GeometryReader { proxy in
          Confetti(
            colors: [style.glow, style.glowInk, style.ink, Color(hex: "#fbbf24")],
            origin: CGPoint(x: proxy.size.width / 2, y: size.height - 24))
        }
        .id(moment.id)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    .animation(reduceMotion ? .easeInOut(duration: 0.2) : .spring(response: 0.42, dampingFraction: 0.8), value: presentation)
    .environment(\.colorScheme, .dark)
  }

  @ViewBuilder
  private func content(_ presentation: NotchPresentation) -> some View {
    let layout = model.layout
    ZStack(alignment: .top) {
      switch presentation {
      case .closed:
        Color.clear
      case .compact:
        if let figures = model.selectedFigures {
          CompactFigures(figures: figures, layout: layout)
            .transition(.blurReplace)
        }
      case .moment:
        if let moment = model.stage.current {
          MomentBanner(moment: moment, layout: layout)
            .id(moment.id)
            .transition(.blurReplace)
        }
      case .expanded:
        ScreenPanel(model: model)
          .transition(.blurReplace)
      }
    }
  }
}

/// The accent rising behind a celebrated moment, as on the wall.
private struct MomentGlow<S: Shape>: View {
  let moment: StagedMoment?
  let shape: S

  var body: some View {
    if let moment, moment.card.isCelebration {
      let style = moment.card.style
      shape
        .fill(
          RadialGradient(
            colors: [style.glow.opacity(moment.celebration == .milestone ? 0.42 : 0.3), .clear],
            center: .bottom, startRadius: 0, endRadius: 260)
        )
        .transition(.opacity)
    }
  }
}
