import * as Clipboard from "expo-clipboard";
import { Directory, File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import { Platform, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

/*
 * What becomes of an image of a screen: copied, saved to the photo library, or handed to another
 * app. Images stay in the app's cache, which the system empties when it needs room.
 */

const directory = new Directory(Paths.cache, "share");

/** Draws a view into a PNG, at the device's pixel density: a file of the cache. */
export function captureImage(view: RefObject<View | null>): Promise<string> {
  return captureRef(view, { format: "png", result: "tmpfile" });
}

/** A copy of the image under its name: chats, Photos and Files show it. */
async function named(uri: string, fileName: string): Promise<File> {
  directory.create({ intermediates: true, idempotent: true });
  const file = new File(directory, fileName);
  await new File(uri).copy(file, { overwrite: true });
  return file;
}

/** Copies the image, to paste in a chat or a document. */
export async function copyImage(uri: string): Promise<void> {
  await Clipboard.setImageAsync(await new File(uri).base64());
}

/**
 * Adds the image to the photo library. iOS asks once to add photos (never to read them); Android
 * 11 and later need no permission at all, earlier versions ask for storage.
 */
export async function saveImage(uri: string, fileName: string): Promise<"saved" | "denied"> {
  if (Platform.OS === "ios" || (Platform.OS === "android" && Platform.Version < 30)) {
    const { granted } = await MediaLibrary.requestPermissionsAsync(true);
    if (!granted) return "denied";
  }
  await MediaLibrary.Asset.create((await named(uri, fileName)).uri);
  return "saved";
}

/** Opens the system's share sheet on the image: Messages, WhatsApp, Slack, X, Mail… */
export async function shareImage(uri: string, fileName: string): Promise<void> {
  const file = await named(uri, fileName);
  await Sharing.shareAsync(file.uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: fileName });
}
