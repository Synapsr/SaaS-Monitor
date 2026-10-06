// First: screens format numbers with it.
import "@/lib/intl";
import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { audioPreferencesStore } from "@/audio/preferences";
import { handleForegroundNotifications } from "@/notifications/handler";
import { useNotifications } from "@/notifications/use-notifications";
import { shareScreens } from "@/screens/bridge";
import { screensStore, useScreens } from "@/screens/store";
import { colors, navigationTheme } from "@/ui/theme";

// The screens come from the keychain: the splash stays until they are read.
void SplashScreen.preventAutoHideAsync();
handleForegroundNotifications();

export default function RootLayout() {
  const { ready, screens } = useScreens();

  useEffect(() => {
    void screensStore.load();
    // Read at launch: the notification service extension follows it too, through the App Group.
    void audioPreferencesStore.load();
  }, []);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hide();
    // On launch and whenever screens change: widgets and watches show the same ones.
    void shareScreens(screens);
  }, [ready, screens]);

  useNotifications();

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerTintColor: colors.accentInk,
          headerTitleStyle: { color: colors.ink },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Screens" }} />
        <Stack.Screen name="add" options={{ title: "Add a screen", presentation: "modal" }} />
        <Stack.Screen name="screen/[key]/index" options={{ headerShown: false }} />
        <Stack.Screen
          name="screen/[key]/settings"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.85, 1],
            sheetGrabberVisible: true,
            headerShown: false,
          }}
        />
        <Stack.Screen name="demo" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Settings", presentation: "modal" }} />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: "fitToContents",
            sheetGrabberVisible: true,
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
