import SwiftUI

/// Revenue today against yesterday, and this month against the same days of the previous one:
/// the wall's tiles, stacked.
struct TodayPage: View {
  let figures: ScreenFigures
  let style: ScreenStyle

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      stat(label: figures.text.today, amount: figures.revenueToday) {
        Text(figures.revenueYesterdayText)
          .foregroundStyle(style.ink3)
      }
      Rectangle()
        .fill(style.ink.opacity(0.1))
        .frame(height: 1)
        .padding(.vertical, 9)
      stat(label: figures.text.thisMonth, amount: figures.monthToDate) {
        HStack(spacing: 5) {
          if let change = figures.monthChange, let text = figures.monthChangeText {
            DeltaChip(trend: Trend(change), value: text, style: style, size: 11)
          }
          if let versus = figures.versusText {
            Text(versus).foregroundStyle(style.ink3)
          }
        }
      }
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .pageInsets()
  }

  private func stat(label: String, amount: Int, @ViewBuilder detail: () -> some View) -> some View {
    VStack(alignment: .leading, spacing: 2) {
      TelemetryLabel(label, locale: figures.format.locale)
        .foregroundStyle(style.ink3)
      HeroReadout(text: figures.format.attributedAmount(amount), value: amount, style: style, size: 30)
      detail()
        .font(.caption2)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
    .accessibilityElement(children: .combine)
  }
}
