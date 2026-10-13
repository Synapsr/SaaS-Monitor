import Foundation

/// The language a screen speaks (`settings.language`): its words, and how it writes numbers and
/// dates ("12 480 $US" in French), like the wall (`src/lib/display/i18n`).
enum Language: String, Codable, Sendable, FallbackDecodable {
  case en, fr, de, es, it, pt, nl

  static var fallback: Language { .en }

  var locale: Locale { Locale(identifier: localeIdentifier) }

  var text: DisplayText {
    switch self {
    case .en: .en
    case .fr: .fr
    case .de: .de
    case .es: .es
    case .it: .it
    case .pt: .pt
    case .nl: .nl
    }
  }

  private var localeIdentifier: String {
    switch self {
    case .en: "en_US"
    case .fr: "fr_FR"
    case .de: "de_DE"
    case .es: "es_ES"
    case .it: "it_IT"
    case .pt: "pt_BR"
    case .nl: "nl_NL"
    }
  }
}
