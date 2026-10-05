import Foundation

/// JSON as the server writes it: dates are ISO 8601, with milliseconds (`Date.toISOString()`).
enum ScreenJSON {
  static func decoder() -> JSONDecoder {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .custom { decoder in
      let text = try decoder.singleValueContainer().decode(String.self)
      if let date = parseDate(text) { return date }
      throw DecodingError.dataCorrupted(
        .init(codingPath: decoder.codingPath, debugDescription: "Not an ISO 8601 date: \(text)")
      )
    }
    return decoder
  }

  static func encoder() -> JSONEncoder {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .custom { date, encoder in
      var container = encoder.singleValueContainer()
      try container.encode(date.formatted(withMilliseconds))
    }
    return encoder
  }

  private static let withMilliseconds = Date.ISO8601FormatStyle(includingFractionalSeconds: true)

  private static func parseDate(_ text: String) -> Date? {
    (try? withMilliseconds.parse(text)) ?? (try? Date.ISO8601FormatStyle().parse(text))
  }
}
