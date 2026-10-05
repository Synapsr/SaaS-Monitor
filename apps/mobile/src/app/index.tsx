import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { ScreenCard } from "@/home/screen-card";
import { Welcome } from "@/home/welcome";
import { useScreenSummaries } from "@/screens/use-screen-summaries";
import { screensStore, useScreens } from "@/screens/store";
import { IconButton } from "@/ui/button";
import { PlusIcon, SettingsIcon, TvIcon } from "@/ui/icons";
import { AppText } from "@/ui/text";
import { colors } from "@/ui/theme";

/** The screens of this device, each with its numbers at a glance. */
export default function Home() {
  const router = useRouter();
  const { ready, screens } = useScreens();
  const { summaries, refresh } = useScreenSummaries(screens);
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const empty = ready && screens.length === 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitleEnabled: !empty,
          title: empty ? "" : "Screens",
          headerLeft: () => (
            <IconButton icon={SettingsIcon} label="Settings" onPress={() => router.push("/settings")} />
          ),
          headerRight: () =>
            empty ? null : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                {screens.length > 1 && (
                  <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setEditing((value) => !value)}>
                    <AppText variant="headline" tone="accentInk">
                      {editing ? "Done" : "Edit"}
                    </AppText>
                  </Pressable>
                )}
                <IconButton icon={PlusIcon} label="Add a screen" onPress={() => router.push("/add")} />
              </View>
            ),
        }}
      />
      {empty ? (
        <Welcome />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.accent}
              onRefresh={() => {
                setRefreshing(true);
                void refresh().finally(() => setRefreshing(false));
              }}
            />
          }
        >
          {screens.map((screen, index) => (
            <ScreenCard
              key={screen.key}
              screen={screen}
              summary={summaries.get(screen.key) ?? { kind: "loading" }}
              editing={editing}
              first={index === 0}
              last={index === screens.length - 1}
              onPress={() => router.push({ pathname: "/screen/[key]", params: { key: screen.key } })}
              onMove={(offset) => screensStore.move(screen.key, offset)}
            />
          ))}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingHorizontal: 6, paddingTop: 10 }}>
            <TvIcon size={16} color={colors.ink3} />
            <AppText variant="caption" tone="ink3" style={{ flex: 1 }}>
              Turn your phone sideways on a screen for TV mode: it stays awake, like the wall.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/demo")}
            style={{ alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 8 }}
          >
            <AppText variant="callout" tone="accentInk">
              Try the demo screen
            </AppText>
          </Pressable>
        </ScrollView>
      )}
    </>
  );
}
