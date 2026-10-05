import ExpoModulesCore

/// A screen as JavaScript hands it over (`SharedScreen` in `src/ScreenBridge.types.ts`).
struct SharedScreenRecord: Record {
  @Field var key: String = ""
  @Field var name: String = ""
  @Field var baseUrl: String = ""
  @Field var token: String = ""
  @Field var accessProof: String? = nil

  var screen: SharedScreen {
    SharedScreen(key: key, name: name, baseUrl: baseUrl, token: token, accessProof: accessProof)
  }
}

/// A screen as widgets and the watch read it: JSON with the same keys. Its twin is
/// `targets/shared/Core/Model/SharedScreen.swift`.
struct SharedScreen: Codable, Sendable {
  let key: String
  let name: String
  let baseUrl: String
  let token: String
  let accessProof: String?
}
