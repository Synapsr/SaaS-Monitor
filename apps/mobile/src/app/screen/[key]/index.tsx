import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useDisplay } from "@/display/context";
import { ScreenDisplay } from "@/display/screen-display";
import { ScreenFrame } from "@/display/screen-frame";
import { ScreenLock } from "@/display/screen-lock";
import { ScreenShell } from "@/display/screen-shell";
import { StatusMessage } from "@/display/status-message";
import { DisplayText } from "@/display/text";
import { usePolledState } from "@/display/use-polled-state";
import { setFocusedScreen } from "@/notifications/handler";
import { rememberState, removeScreen, unlockSavedScreen } from "@/screens/actions";
import { instanceLabel } from "@/screens/link";
import { useScreen, useScreens } from "@/screens/store";
import { displayName } from "@/screens/types";
import { Link2OffIcon, TvIcon, WifiOffIcon } from "@/ui/icons";

/** A screen of the device, live: portrait like a page, landscape like the wall. */
export default function ScreenRoute() {
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { ready } = useScreens();
  const screen = useScreen(key);
  const { state, connection, refresh } = usePolledState(screen ?? null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (key && state) rememberState(key, state);
  }, [key, state]);

  // Its notifications show as moments here: no banner on top of them. Its sounds and voices only
  // play while it is in front, not under its settings.
  useFocusEffect(
    useCallback(() => {
      setFocusedScreen(key ?? null);
      setFocused(true);
      return () => {
        setFocusedScreen(null);
        setFocused(false);
      };
    }, [key]),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  if (!ready) return null;
  if (!screen) {
    return (
      <ScreenFrame theme="dark" onBack={back}>
        {({ layout, scale, leading }) => (
          <ScreenShell appearance={null} layout={layout} scale={scale} name="" leading={leading}>
            <StatusMessage icon={Link2OffIcon} title="This screen isn’t on this device" tone="neutral" />
          </ScreenShell>
        )}
      </ScreenFrame>
    );
  }

  const theme = state?.screen.settings.theme ?? screen.appearance?.theme ?? "dark";
  const openSettings = () => router.push({ pathname: "/screen/[key]/settings", params: { key: screen.key } });

  return (
    <ScreenFrame theme={theme} onBack={back} onSettings={openSettings}>
      {({ layout, scale, leading, trailing }) => {
        const shell = (children: React.ReactNode) => (
          <ScreenShell
            appearance={screen.appearance}
            layout={layout}
            scale={scale}
            name={displayName(screen)}
            leading={leading}
            trailing={trailing}
          >
            {children}
          </ScreenShell>
        );
        if (connection === "locked") {
          return shell(<ScreenLock onUnlock={(password) => unlockSavedScreen(screen.key, password)} />);
        }
        if (connection === "gone") {
          return shell(
            <Gone
              onRemove={() => {
                void removeScreen(screen.key);
                back();
              }}
            />,
          );
        }
        if (!state) {
          return shell(
            connection === "offline" ? (
              <StatusMessage
                icon={WifiOffIcon}
                title="Can’t reach this screen"
                details={`${instanceLabel(screen.baseUrl)} doesn’t answer right now. The screen comes back by itself.`}
                tone="neutral"
              />
            ) : (
              <Loading />
            ),
          );
        }
        return (
          <ScreenDisplay
            state={{ ...state, screen: { ...state.screen, name: displayName({ ...screen, name: state.screen.name }) } }}
            online={connection === "online"}
            layout={layout}
            scale={scale}
            leading={leading}
            trailing={trailing}
            onRefresh={refresh}
            footer={layout === "phone" && <TvHint />}
            audio={focused ? screen : null}
          />
        );
      }}
    </ScreenFrame>
  );
}

function Loading() {
  const { palette } = useDisplay();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={palette.glow} />
    </View>
  );
}

function Gone({ onRemove }: { onRemove: () => void }) {
  const { locale, palette, scale } = useDisplay();
  const { text } = locale;
  return (
    <StatusMessage icon={Link2OffIcon} title={text.status.gone} details={text.status.goneDetails("SaaS Monitor")} tone="neutral">
      <Pressable
        accessibilityRole="button"
        onPress={onRemove}
        style={{ marginTop: 8 * scale, paddingHorizontal: 18 * scale, paddingVertical: 12 * scale, borderRadius: 14 * scale, backgroundColor: palette.fill }}
      >
        <DisplayText size={16} weight="600">
          Remove from this device
        </DisplayText>
      </Pressable>
    </StatusMessage>
  );
}

/** Where TV mode hides: turning the phone. */
function TvHint() {
  const { palette, scale } = useDisplay();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 * scale, paddingVertical: 4 * scale }}>
      <TvIcon size={14 * scale} color={palette.ink3} />
      <DisplayText size={12} tone="ink3">
        Turn your phone for TV mode
      </DisplayText>
    </View>
  );
}
