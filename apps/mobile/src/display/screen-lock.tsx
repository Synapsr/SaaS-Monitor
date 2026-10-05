import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import type { UnlockResult } from "@/screens/api";
import { useDisplay } from "@/display/context";
import { StatusMessage } from "@/display/status-message";
import { DisplayText } from "@/display/text";
import { LockIcon } from "@/ui/icons";

/**
 * Asks for the password of a screen that has one, or a new one, in the screen's own language and
 * colors (the web's `ScreenLock`). Nothing else of the screen shows.
 */
export function ScreenLock({ onUnlock }: { onUnlock: (password: string) => Promise<UnlockResult> }) {
  const { locale, palette, scale } = useDisplay();
  const { text } = locale;
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (password === "" || pending) return;
    setPending(true);
    setError(null);
    const result = await onUnlock(password);
    setPending(false);
    if (result.kind === "wrong-password") setError(text.lock.wrongPassword);
    else if (result.kind === "too-many-attempts") setError(text.lock.tooManyAttempts);
    else if (result.kind !== "unlocked") setError(text.status.gone);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <StatusMessage icon={LockIcon} title={text.lock.title} details={text.lock.details}>
        <View style={{ width: "100%", maxWidth: 360 * scale, gap: 10 * scale, marginTop: 6 * scale }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={text.lock.password}
            placeholderTextColor={palette.ink3}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            keyboardAppearance={palette.theme}
            selectionColor={palette.glow}
            accessibilityLabel={text.lock.password}
            style={{
              height: 52 * scale,
              borderRadius: 16 * scale,
              paddingHorizontal: 16 * scale,
              fontSize: 17 * scale,
              textAlign: "center",
              color: palette.ink,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: error ? palette.warn : palette.hairline,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: pending }}
            onPress={() => void submit()}
            style={({ pressed }) => ({
              height: 52 * scale,
              borderRadius: 16 * scale,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.glow,
              opacity: pending || password === "" ? 0.6 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <DisplayText size={17} weight="600" style={{ color: palette.screen }}>
              {text.lock.open}
            </DisplayText>
          </Pressable>
          {error && (
            <DisplayText size={15} tone="warnInk" accessibilityRole="alert" style={{ textAlign: "center" }}>
              {error}
            </DisplayText>
          )}
        </View>
      </StatusMessage>
    </KeyboardAvoidingView>
  );
}
