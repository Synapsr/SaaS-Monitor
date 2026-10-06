import Foundation

/// What widgets and the watch read of `GET /api/screens/{token}/state`: a subset of the web app's
/// `DisplayState` (`src/lib/display/types.ts`). Every amount is an integer in the minor unit of
/// `currency`, and recurring amounts are MRR, whatever the screen shows.
struct DisplayState: Codable, Sendable {
  let generatedAt: Date
  let screen: Screen
  /// ISO 4217 code, lowercase.
  let currency: String
  let status: Status
  /// The Stripe accounts of the screen: a moment names its account when there are several.
  let accounts: [Account]
  let metrics: DisplayMetrics
  /// `nil` in states cached before widgets drew the curve.
  let series: Series?
  /// Most recent activity first.
  let feed: [FeedItem]
  /// Present after "Send a test celebration" was clicked in the screen's settings.
  let testEvent: TestEvent?

  struct Screen: Codable, Sendable {
    let name: String
    let settings: ScreenSettings
  }

  struct Account: Codable, Sendable {
    let id: String
    let name: String
  }

  struct TestEvent: Codable, Sendable {
    let id: String
  }

  struct Series: Codable, Sendable {
    /// MRR at the end of the days of the screen's chart range, oldest first, the last one being
    /// today's.
    let mrr: [SeriesPoint]
  }

  struct SeriesPoint: Codable, Sendable {
    /// Calendar day in the screen's time zone, `YYYY-MM-DD`.
    let date: String
    let value: Int
  }

  enum Status: String, Codable, Sendable, FallbackDecodable {
    /// No Stripe account is linked to the screen yet.
    case empty
    /// The first import is still running: metrics are incomplete.
    case importing
    case ready
    /// Every linked account is failing.
    case error

    static var fallback: Status { .ready }
  }
}

struct DisplayMetrics: Codable, Sendable {
  let mrr: Int
  /// MRR 30 days ago, for the growth badge.
  let mrr30DaysAgo: Int
  /// Customers with at least one paying subscription.
  let activeCustomers: Int
  /// Average revenue per paying customer: the amount of a test celebration.
  let arpu: Int
  /// Stripe customers created today (screen time zone), paying or not.
  let customersCreatedToday: Int
  let revenue: Revenue

  struct Revenue: Codable, Sendable {
    let today: Int
    let yesterday: Int
    let monthToDate: Int
    /// Same number of days at the start of the previous month; `nil` in states cached before.
    let previousMonthToDate: Int?
  }
}

struct FeedItem: Codable, Identifiable, Sendable {
  let id: String
  let kind: Kind
  /// Payment amount, monthly MRR change (negative for contraction and churn), or 0 for a customer.
  let amount: Int
  let occurredAt: Date
  /// Detected by the live sync rather than imported from history: may be celebrated.
  let live: Bool
  /// The same for every item of a customer, and opaque.
  let customerKey: String?
  /// Only filled when the screen shows customer names.
  let customerName: String?
  /// For a customer without a name, when the screen allows it: masked or in full.
  let customerEmail: String?
  /// ISO 3166-1 alpha-2 code.
  let country: String?
  let planName: String?
  /// A payment collected for one of the account's Stripe Connect accounts.
  let connect: Connect?
  /// For a payment: whether its customer had a subscription bringing MRR. A first payment may
  /// start one a few seconds later.
  let customerSubscribed: Bool?
  /// Why a `churn` happened, when known.
  let churn: Churn?
  let accountId: String
  let accountName: String

  enum Kind: String, Codable, Sendable, FallbackDecodable {
    case payment, customer, new, expansion, reactivation, contraction, churn

    /// A kind a newer server knows reads as a payment: money in, without a recurring amount.
    static var fallback: Kind { .payment }

    /// Money in and customers won are good news; downgrades and cancellations are not.
    var isGoodNews: Bool { self != .contraction && self != .churn }
  }

  struct Connect: Codable, Sendable {
    let applicationFee: Int?
  }

  struct Churn: Codable, Sendable {
    let reason: Reason
    /// When a subscription set not to renew stops.
    let endsAt: Date?

    enum Reason: String, Codable, Sendable, FallbackDecodable {
      case canceled, scheduled, unpaid, paused

      static var fallback: Reason { .canceled }
    }
  }
}

/// A value of a closed set the server may extend: an unknown one decodes as `fallback` rather than
/// failing the whole state.
protocol FallbackDecodable: RawRepresentable<String>, Decodable {
  static var fallback: Self { get }
}

extension FallbackDecodable {
  init(from decoder: any Decoder) throws {
    let raw = try decoder.singleValueContainer().decode(String.self)
    self = Self(rawValue: raw) ?? .fallback
  }
}
