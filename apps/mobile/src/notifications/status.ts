import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

/** Moments arrive on this Android channel (AGENTS.md), created before asking for permission. */
export const MOMENTS_CHANNEL = "moments";

/**
 * Whether this device can get notifications, and its Expo push token when it can.
 * - `unconfigured`: allowed, but this build has no EAS project id, which Expo push tokens need.
 * - `unavailable`: allowed, but no token for now (offline, a simulator without push…).
 */
export type NotificationsStatus =
  | { kind: "loading" }
  | { kind: "undetermined" }
  | { kind: "denied" }
  | { kind: "unconfigured" }
  | { kind: "unavailable" }
  | { kind: "ready"; pushToken: string };

/** The EAS project of the build: Expo's push service routes tokens with it. */
export function easProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined;
  const projectId = extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return typeof projectId === "string" && projectId.length > 0 ? projectId : null;
}

function isGranted(permissions: Notifications.NotificationPermissionsStatus): boolean {
  if (permissions.granted) return true;
  const status = permissions.ios?.status;
  return (
    status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

/** Android 13 shows the permission prompt only once a channel exists. */
async function createMomentsChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(MOMENTS_CHANNEL, {
    name: "Moments",
    description: "Payments, new subscribers and everything else your screens send to phones.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 120, 90, 120],
    lightColor: "#34d399",
  });
}

async function pushStatus(): Promise<NotificationsStatus> {
  const projectId = easProjectId();
  if (projectId === null) return { kind: "unconfigured" };
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { kind: "ready", pushToken: data };
  } catch (error) {
    console.warn("No push token for now", error);
    return { kind: "unavailable" };
  }
}

async function statusFrom(
  permissions: Notifications.NotificationPermissionsStatus,
): Promise<NotificationsStatus> {
  if (isGranted(permissions)) return pushStatus();
  return permissions.canAskAgain ? { kind: "undetermined" } : { kind: "denied" };
}

/** The device's notifications, for React (`useNotificationsStatus`) and the registrations. */
class NotificationsStore {
  private status: NotificationsStatus = { kind: "loading" };
  private readonly listeners = new Set<() => void>();
  /** Reads and requests run one after the other: the last one says how things stand. */
  private queue: Promise<unknown> = Promise.resolve();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): NotificationsStatus => this.status;

  /** Reads the permission again (it may change in Settings) and fetches a token when allowed. */
  refresh(): Promise<NotificationsStatus> {
    return this.run(async () => {
      await createMomentsChannel();
      return statusFrom(await Notifications.getPermissionsAsync());
    });
  }

  /** Asks the system for permission: once only, then it sends people to Settings. */
  request(): Promise<NotificationsStatus> {
    return this.run(async () => {
      await createMomentsChannel();
      const permissions = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      });
      return statusFrom(permissions);
    });
  }

  private run(task: () => Promise<NotificationsStatus>): Promise<NotificationsStatus> {
    const result = this.queue
      .then(task)
      .catch((error: unknown): NotificationsStatus => {
        console.warn("Notifications are unavailable", error);
        return { kind: "unavailable" };
      })
      .then((status) => {
        if (JSON.stringify(status) !== JSON.stringify(this.status)) {
          this.status = status;
          for (const listener of this.listeners) listener();
        }
        return status;
      });
    this.queue = result;
    return result;
  }
}

export const notificationsStore = new NotificationsStore();

export function useNotificationsStatus(): NotificationsStatus {
  return useSyncExternalStore(notificationsStore.subscribe, notificationsStore.getSnapshot);
}
