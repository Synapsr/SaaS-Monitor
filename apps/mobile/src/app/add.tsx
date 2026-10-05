import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { addErrorMessage, NOT_A_SCREEN_LINK } from "@/add/messages";
import { Scanner } from "@/add/scanner";
import { notificationsStore } from "@/notifications/status";
import { addScreen, type AddResult } from "@/screens/actions";
import { DEMO_TOKEN, instanceLabel, parseScreenLink, type ScreenLink } from "@/screens/link";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { ClipboardPasteIcon, LockIcon } from "@/ui/icons";
import { AppText } from "@/ui/text";
import { colors, radius } from "@/ui/theme";

type Step =
  | { kind: "idle"; error: string | null }
  | { kind: "checking"; link: ScreenLink }
  | { kind: "password"; link: ScreenLink; error: string | null; pending: boolean };

/**
 * Adds a screen from its QR code or its link, and asks for its password when it has one. Other
 * apps may hand a link over: `saasmonitor://add?url=https://…/d/<token>`.
 */
export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; url?: string }>();
  const [mode, setMode] = useState<"scan" | "link">(
    params.mode === "link" || params.url ? "link" : "scan",
  );
  const [step, setStep] = useState<Step>({ kind: "idle", error: null });
  const [text, setText] = useState(params.url ?? "");
  const [password, setPassword] = useState("");
  const rejected = useRef<string | null>(null);
  // The camera reports a code many times a second: one check at a time.
  const busy = useRef(false);

  async function finish(result: AddResult, link: ScreenLink, withPassword: boolean) {
    if (result.kind === "added") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.dismiss();
      router.push({ pathname: "/screen/[key]", params: { key: result.key } });
      // After a first screen, explain notifications before the system asks.
      const notifications = await notificationsStore.refresh();
      if (result.first && notifications.kind === "undetermined") router.push("/notifications");
      return;
    }
    if (result.kind === "locked") {
      setStep({ kind: "password", link, error: withPassword ? "Wrong password. Try again." : null, pending: false });
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const error = addErrorMessage(result, instanceLabel(link.baseUrl));
    setStep(withPassword ? { kind: "password", link, error, pending: false } : { kind: "idle", error });
  }

  async function open(input: string) {
    if (busy.current || step.kind !== "idle") return;
    const link = parseScreenLink(input);
    if (!link) {
      if (rejected.current !== input) {
        rejected.current = input;
        setStep({ kind: "idle", error: NOT_A_SCREEN_LINK });
      }
      return;
    }
    if (link.token === DEMO_TOKEN) {
      router.dismiss();
      router.push("/demo");
      return;
    }
    busy.current = true;
    setStep({ kind: "checking", link });
    try {
      await finish(await addScreen(link), link, false);
    } finally {
      busy.current = false;
    }
  }

  const openHandedLink = useEffectEvent((url: string) => void open(url));
  const handedUrl = params.url;
  useEffect(() => {
    if (!handedUrl) return;
    // Once the sheet is up, so that what happens shows in it.
    const timer = setTimeout(() => openHandedLink(handedUrl), 300);
    return () => clearTimeout(timer);
  }, [handedUrl]);

  async function unlock() {
    if (step.kind !== "password" || password === "") return;
    const { link } = step;
    setStep({ ...step, pending: true });
    await finish(await addScreen(link, password), link, true);
  }

  if (step.kind === "password") {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", gap: 12, paddingTop: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline }}>
              <LockIcon size={26} color={colors.accent} />
            </View>
            <AppText variant="title" style={{ textAlign: "center" }}>
              This screen is protected
            </AppText>
            <AppText variant="callout" tone="ink2" style={{ textAlign: "center" }}>
              Type its password once: this device will remember it. ({instanceLabel(step.link.baseUrl)})
            </AppText>
          </View>
          <Field
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            autoFocus
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void unlock()}
            invalid={step.error !== null}
            accessibilityLabel="Password"
          />
          {step.error && (
            <AppText variant="callout" tone="danger" accessibilityRole="alert">
              {step.error}
            </AppText>
          )}
          <Button label="Open the screen" loading={step.pending} disabled={password === ""} onPress={() => void unlock()} />
          <Button
            label="Use another link"
            variant="plain"
            onPress={() => {
              setPassword("");
              setStep({ kind: "idle", error: null });
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const checking = step.kind === "checking";
  const error = step.kind === "idle" ? step.error : null;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
        <Segmented value={mode} onChange={setMode} />
        {mode === "scan" ? (
          <View style={{ gap: 14 }}>
            <Scanner paused={checking} onScan={(data) => void open(data)} />
            <AppText variant="callout" tone="ink2" style={{ textAlign: "center" }}>
              In SaaS Monitor, open a screen’s settings and choose “Open on your phone” to show its QR code.
            </AppText>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Field
              value={text}
              onChangeText={(value) => {
                setText(value);
                if (error) setStep({ kind: "idle", error: null });
              }}
              placeholder="https://saas-monitor.com/d/…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              textContentType="URL"
              returnKeyType="go"
              autoFocus={params.mode === "link"}
              onSubmitEditing={() => void open(text)}
              invalid={error !== null}
              accessibilityLabel="Screen link"
            />
            <PasteButton
              onPaste={(value) => {
                setText(value);
                void open(value);
              }}
            />
            <Button label="Add the screen" loading={checking} disabled={text.trim() === ""} onPress={() => void open(text)} />
          </View>
        )}
        {checking && mode === "scan" && (
          <AppText variant="callout" tone="accentInk" style={{ textAlign: "center" }}>
            Opening the screen on {instanceLabel(step.link.baseUrl)}…
          </AppText>
        )}
        {error && (
          <AppText variant="callout" tone="danger" accessibilityRole="alert" style={{ textAlign: mode === "scan" ? "center" : "left" }}>
            {error}
          </AppText>
        )}
        <AppText variant="caption" tone="ink3" style={{ textAlign: "center" }}>
          A screen’s link is its key: the app keeps it in this device’s keychain, and only talks to
          the screen’s own instance.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Segmented({ value, onChange }: { value: "scan" | "link"; onChange: (value: "scan" | "link") => void }) {
  const options = [
    { value: "scan", label: "Scan a QR code" },
    { value: "link", label: "Paste a link" },
  ] as const;
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", padding: 4, borderRadius: radius.medium, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: radius.small, alignItems: "center", backgroundColor: selected ? colors.surfaceRaised : "transparent" }}
          >
            <AppText variant="label" tone={selected ? "ink" : "ink3"}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pastes without the system's "Allow paste?" prompt where the platform's paste button exists. */
function PasteButton({ onPaste }: { onPaste: (text: string) => void }) {
  if (Clipboard.isPasteButtonAvailable) {
    return (
      <Clipboard.ClipboardPasteButton
        acceptedContentTypes={["plain-text"]}
        backgroundColor={colors.surfaceRaised}
        foregroundColor={colors.ink}
        cornerStyle="large"
        displayMode="iconAndLabel"
        style={{ height: 50, width: "100%" }}
        onPress={(data) => {
          if (data.type === "text") onPaste(data.text);
        }}
      />
    );
  }
  return (
    <Button
      label="Paste"
      variant="secondary"
      icon={ClipboardPasteIcon}
      onPress={async () => onPaste(await Clipboard.getStringAsync())}
    />
  );
}
