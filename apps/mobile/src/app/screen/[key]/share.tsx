import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { recurringMetric, type RecurringMetric } from "@/contract/display/metric";
import { screenView } from "@/contract/display/rotation";
import { captureImage, copyImage, saveImage, shareImage } from "@/share/export";
import { shareRequest, type ShareRequest } from "@/share/requests";
import { ShareCard, SHARE_CARD_WIDTH } from "@/share/share-card";
import {
  namesCustomers,
  shareChoices,
  shareDay,
  shareFileName,
  shareSource,
  subjectKey,
  subjectLabel,
  type ShareSubject,
} from "@/share/subjects";
import { Button } from "@/ui/button";
import { CheckIcon, CopyIcon, DownloadIcon, ShareIcon, type LucideProps } from "@/ui/icons";
import { SettingsGroup, SwitchRow } from "@/ui/settings-group";
import { AppText } from "@/ui/text";
import { colors, radius } from "@/ui/theme";

/** Parts measure themselves before they draw: the image waits until they have. */
const SETTLE_MS = 350;
/** How long "Copied" and "Saved" stay. */
const DONE_MS = 1_800;

type Action = "copy" | "save" | "share";

/** An image of a screen or of the part that was held, to copy, save or send. */
export default function ShareSheet() {
  const { key } = useLocalSearchParams<{ key: string }>();
  // The screen as it was when the image was asked for: what came since doesn't change it.
  const [request] = useState(() => (key ? shareRequest(key) : undefined));
  if (!request) return null;
  return <Composer request={request} />;
}

interface Capture {
  uri: string;
  /** Of the card, in points. */
  width: number;
  height: number;
  /** What it shows: a subject, with or without customer names. */
  of: string;
}

function Composer({ request }: { request: ShareRequest }) {
  const insets = useSafeAreaInsets();
  const { state, slide, at } = request;
  const [subject, setSubject] = useState(request.subject);
  const [customerNames, setCustomerNames] = useState(false);
  const [image, setImage] = useState<Capture | null>(null);
  const [attempt, setAttempt] = useState(0);
  // The drawing that failed, until the image changes or "Try again" draws it again.
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const [done, setDone] = useState<Action | null>(null);
  const card = useRef<View>(null);
  const cardSize = useRef({ width: SHARE_CARD_WIDTH, height: 0 });

  const choices = useMemo(() => shareChoices(request.subject), [request.subject]);
  const { settings } = state.screen;
  const metric = recurringMetric(settings.metric).label;
  const asksNames = namesCustomers(subject, screenView(state, slide).feed);
  const shown = useMemo(
    () => shareSource(state, subject, { customerNames: asksNames && customerNames }),
    [state, subject, asksNames, customerNames],
  );
  const of = `${subjectKey(subject)}:${asksNames && customerNames}`;
  const ready = image !== null && image.of === of;
  const failed = failure === `${of}#${attempt}`;
  const fileName = shareFileName(state.screen.name, subject, metric, shareDay(at, settings.timeZone));

  // Each change of the image draws it again, once its parts have settled.
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        captureImage(card)
          .then((uri) => current && setImage({ uri, ...cardSize.current, of }))
          .catch(() => current && setFailure(`${of}#${attempt}`));
      });
    }, SETTLE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [of, attempt]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(null), DONE_MS);
    return () => clearTimeout(timer);
  }, [done]);

  async function run(action: Action) {
    if (!image || !ready || busy) return;
    setBusy(action);
    try {
      if (action === "copy") {
        await copyImage(image.uri);
        confirm("copy");
      } else if (action === "save") {
        if ((await saveImage(image.uri, fileName)) === "saved") confirm("save");
        else askForPhotos();
      } else {
        await shareImage(image.uri, fileName);
      }
    } catch {
      Alert.alert(action === "save" ? "Couldn’t save the image" : action === "copy" ? "Couldn’t copy the image" : "Couldn’t share the image", "Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  function confirm(action: Action) {
    setDone(action);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function choose(choice: ShareSubject) {
    if (subjectKey(choice) === subjectKey(subject)) return;
    void Haptics.selectionAsync();
    setSubject(choice);
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Drawn for the image, out of sight behind the sheet. */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0 }}>
        <ShareCard
          key={of}
          ref={card}
          state={shown.state}
          subject={shown.subject}
          slide={slide}
          at={at}
          onLayout={(event) => {
            cardSize.current = { width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height };
          }}
        />
      </View>

      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, paddingTop: 28, paddingBottom: insets.bottom + 16, gap: 18 }]}>
        <AppText variant="title" accessibilityRole="header" style={{ paddingHorizontal: 20 }}>
          Share as an image
        </AppText>

        <Preview image={image} ready={ready} failed={failed} onRetry={() => setAttempt((count) => count + 1)} />

        <Choices choices={choices} selected={subject} metric={metric} onChoose={choose} />

        {asksNames && (
          <View style={{ paddingHorizontal: 20 }}>
            <SettingsGroup>
              <SwitchRow
                label="Show customer names"
                detail="Hidden unless you choose: images travel further than screens."
                value={customerNames}
                onValueChange={setCustomerNames}
              />
            </SettingsGroup>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20 }}>
          <ActionButton
            icon={done === "copy" ? CheckIcon : CopyIcon}
            label={done === "copy" ? "Copied" : "Copy"}
            disabled={!ready}
            loading={busy === "copy"}
            onPress={() => void run("copy")}
          />
          <ActionButton
            icon={done === "save" ? CheckIcon : DownloadIcon}
            label={done === "save" ? "Saved" : "Save"}
            disabled={!ready}
            loading={busy === "save"}
            onPress={() => void run("save")}
          />
          <ActionButton
            icon={ShareIcon}
            label="Share"
            primary
            disabled={!ready}
            loading={busy === "share"}
            onPress={() => void run("share")}
          />
        </View>

        {request.subject.kind === "screen" && (
          <AppText variant="caption" tone="ink3" style={{ textAlign: "center", paddingHorizontal: 28 }}>
            Touch and hold a number, the chart or a payment on the screen to share just that.
          </AppText>
        )}
      </View>
    </View>
  );
}

/** The image itself, as it will be sent: fitted to the room the sheet leaves it. */
function Preview({ image, ready, failed, onRetry }: { image: Capture | null; ready: boolean; failed: boolean; onRetry: () => void }) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const fit = box && image ? Math.min((box.width - 40) / image.width, box.height / image.height, 1) : 0;

  return (
    <View
      onLayout={(event) => setBox({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
      style={{ flex: 1, minHeight: 120, alignItems: "center", justifyContent: "center" }}
    >
      {failed ? (
        <View style={{ alignItems: "center", gap: 12, paddingHorizontal: 32 }}>
          <AppText variant="callout" tone="ink2" style={{ textAlign: "center" }}>
            The image couldn’t be drawn.
          </AppText>
          <Button label="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : image && fit > 0 ? (
        <Animated.View
          key={image.uri}
          entering={FadeIn.duration(220)}
          style={{
            borderRadius: radius.large,
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.5)",
            opacity: ready ? 1 : 0.55,
          }}
        >
          <Image
            source={{ uri: image.uri }}
            accessibilityLabel="Preview of the image"
            style={{
              width: image.width * fit,
              height: image.height * fit,
              borderRadius: radius.large,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          />
        </Animated.View>
      ) : null}
      {!ready && !failed && (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </View>
  );
}

/** What to share: the part that was held is selected, every other one a tap away. */
function Choices({
  choices,
  selected,
  metric,
  onChoose,
}: {
  choices: ShareSubject[];
  selected: ShareSubject;
  metric: RecurringMetric["label"];
  onChoose: (subject: ShareSubject) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, paddingHorizontal: 20 }}>
      {choices.map((choice) => {
        const key = subjectKey(choice);
        const active = key === subjectKey(selected);
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChoose(choice)}
            style={({ pressed }) => ({
              height: 36,
              paddingHorizontal: 14,
              borderRadius: 18,
              justifyContent: "center",
              backgroundColor: active ? colors.accentWash : colors.surface,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.hairline,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppText variant="label" tone={active ? "accentInk" : "ink2"} numberOfLines={1}>
              {subjectLabel(choice, metric)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ActionButtonProps {
  icon: (props: Pick<LucideProps, "size" | "color" | "strokeWidth">) => React.ReactNode;
  label: string;
  primary?: boolean;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}

/** One of three equal buttons, icon over label, like the system's quick actions. */
function ActionButton({ icon, label, primary = false, disabled, loading, onPress }: ActionButtonProps) {
  const ink = primary ? colors.onAccent : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 68,
        borderRadius: radius.medium,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: primary ? colors.accent : colors.surfaceRaised,
        borderWidth: primary ? 0 : 1,
        borderColor: colors.hairline,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {loading ? <ActivityIndicator color={ink} /> : createElement(icon, { size: 21, color: ink, strokeWidth: 2.2 })}
      <AppText variant="label" style={{ color: ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** iOS asks once: after a "Don't Allow", only Settings can change it. */
function askForPhotos() {
  Alert.alert(
    "Allow SaaS Monitor to add photos",
    Platform.OS === "ios"
      ? "In Settings, SaaS Monitor, Photos, choose “Add Photos Only”."
      : "In Settings, allow SaaS Monitor to use storage.",
    [
      { text: "Not now", style: "cancel" },
      { text: "Open Settings", onPress: () => void Linking.openSettings() },
    ],
  );
}
