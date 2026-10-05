package com.saasmonitor.screenbridge

import com.saasmonitor.core.SharedScreen
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/** `SharedScreen` of the TypeScript API (`src/ScreenBridge.types.ts`), as JavaScript sends it. */
class SharedScreenRecord : Record {
  @Field val key: String = ""
  @Field val name: String = ""
  @Field val baseUrl: String = ""
  @Field val token: String = ""
  @Field val accessProof: String? = null

  /** `null` for a screen missing what it takes to fetch it. */
  fun toSharedScreen(): SharedScreen? =
    if (key.isEmpty() || baseUrl.isEmpty() || token.isEmpty()) {
      null
    } else {
      SharedScreen(key, name, baseUrl.trimEnd('/'), token, accessProof)
    }
}
