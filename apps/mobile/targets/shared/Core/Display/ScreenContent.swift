import Foundation

/// What a screen shows: its numbers, or a sentence saying why there are none, in its language.
enum ScreenContent: Sendable {
  case figures(ScreenFigures)
  /// `figures`, when known, still name the screen and give it its colors.
  case message(String, figures: ScreenFigures?)

  init(_ snapshot: ScreenSnapshot) {
    let figures = snapshot.state.map(ScreenFigures.init)
    let status = (figures?.text ?? .en).status
    switch snapshot.problem {
    case .locked:
      self = .message(status.locked, figures: figures)
    case .gone:
      self = .message(status.gone, figures: figures)
    case .offline, nil:
      if let figures, let message = figures.statusMessage {
        self = .message(message, figures: figures)
      } else if let figures {
        self = .figures(figures)
      } else {
        self = .message(status.offline, figures: nil)
      }
    }
  }

  var figures: ScreenFigures? {
    switch self {
    case .figures(let figures): figures
    case .message(_, let figures): figures
    }
  }
}
