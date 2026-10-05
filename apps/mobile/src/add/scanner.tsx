import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useIsFocused } from "expo-router";
import { Linking, View } from "react-native";
import { Button } from "@/ui/button";
import { ScanQrCodeIcon } from "@/ui/icons";
import { AppText } from "@/ui/text";
import { colors, radius } from "@/ui/theme";

interface ScannerProps {
  /** Called with the text of each QR code in view; scanning pauses while `paused`. */
  onScan: (data: string) => void;
  paused: boolean;
}

/** The camera, reading QR codes: a screen's QR code holds its link. */
export function Scanner({ onScan, paused }: ScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  // Only one camera preview may run: none while another screen covers this one.
  const focused = useIsFocused();

  return (
    <View
      style={{
        aspectRatio: 1,
        width: "100%",
        maxWidth: 420,
        alignSelf: "center",
        borderRadius: radius.large,
        overflow: "hidden",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      {permission?.granted ? (
        focused && (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={paused ? undefined : (result: BarcodeScanningResult) => onScan(result.data)}
          />
        )
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
          <ScanQrCodeIcon size={40} color={colors.accent} strokeWidth={1.8} />
          <AppText variant="callout" tone="ink2" style={{ textAlign: "center" }}>
            {permission && !permission.canAskAgain
              ? "The camera is off for SaaS Monitor. Turn it on in Settings to scan a screen’s QR code."
              : "Point your camera at the QR code of a screen to add it."}
          </AppText>
          {permission && !permission.canAskAgain ? (
            <Button label="Open Settings" variant="secondary" onPress={() => void Linking.openSettings()} />
          ) : (
            <Button label="Use the camera" variant="secondary" onPress={() => void requestPermission()} />
          )}
        </View>
      )}
      {permission?.granted && <Viewfinder />}
    </View>
  );
}

/** Corners framing where the code goes. */
function Viewfinder() {
  const corner = { position: "absolute", width: 36, height: 36, borderColor: colors.accent } as const;
  const inset = "18%";
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <View style={[corner, { top: inset, left: inset, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 }]} />
      <View style={[corner, { top: inset, right: inset, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 }]} />
      <View style={[corner, { bottom: inset, left: inset, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 }]} />
      <View style={[corner, { bottom: inset, right: inset, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 }]} />
    </View>
  );
}
