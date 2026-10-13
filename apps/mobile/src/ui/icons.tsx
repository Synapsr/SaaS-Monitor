/*
 * The Lucide icons of the app, one module each: importing the package itself would bundle all
 * of them.
 */
import type { LucideIcon, LucideProps } from "lucide-react-native";
import ShareIos from "lucide-react-native/icons/share";
import ShareAndroid from "lucide-react-native/icons/share-2";
import { Platform } from "react-native";
import Svg, { Path } from "react-native-svg";

export { default as ArrowDownRightIcon } from "lucide-react-native/icons/arrow-down-right";
export { default as ArrowUpRightIcon } from "lucide-react-native/icons/arrow-up-right";
export { default as BellIcon } from "lucide-react-native/icons/bell";
export { default as BellOffIcon } from "lucide-react-native/icons/bell-off";
export { default as CalendarXIcon } from "lucide-react-native/icons/calendar-x";
export { default as CheckIcon } from "lucide-react-native/icons/check";
export { default as ChevronDownIcon } from "lucide-react-native/icons/chevron-down";
export { default as ChevronLeftIcon } from "lucide-react-native/icons/chevron-left";
export { default as ChevronRightIcon } from "lucide-react-native/icons/chevron-right";
export { default as ChevronUpIcon } from "lucide-react-native/icons/chevron-up";
export { default as CircleAlertIcon } from "lucide-react-native/icons/circle-alert";
export { default as CircleDollarSignIcon } from "lucide-react-native/icons/circle-dollar-sign";
export { default as CirclePauseIcon } from "lucide-react-native/icons/circle-pause";
export { default as ClipboardPasteIcon } from "lucide-react-native/icons/clipboard-paste";
export { default as CodeIcon } from "lucide-react-native/icons/code";
export { default as CopyIcon } from "lucide-react-native/icons/copy";
export { default as CreditCardXIcon } from "lucide-react-native/icons/credit-card-x";
export { default as DownloadIcon } from "lucide-react-native/icons/download";
export { default as EllipsisIcon } from "lucide-react-native/icons/ellipsis";
export { default as ExternalLinkIcon } from "lucide-react-native/icons/external-link";
export { default as ImageIcon } from "lucide-react-native/icons/image";
export { default as InfoIcon } from "lucide-react-native/icons/info";
export { default as Link2OffIcon } from "lucide-react-native/icons/link-2-off";
export { default as LockIcon } from "lucide-react-native/icons/lock";
export { default as PartyPopperIcon } from "lucide-react-native/icons/party-popper";
export { default as PencilIcon } from "lucide-react-native/icons/pencil";
export { default as PlugIcon } from "lucide-react-native/icons/plug";
export { default as PlusIcon } from "lucide-react-native/icons/plus";
export { default as RotateCcwIcon } from "lucide-react-native/icons/rotate-ccw";
export { default as ScanQrCodeIcon } from "lucide-react-native/icons/scan-qr-code";
export { default as SettingsIcon } from "lucide-react-native/icons/settings";
export { default as ShieldCheckIcon } from "lucide-react-native/icons/shield-check";
export { default as SparklesIcon } from "lucide-react-native/icons/sparkles";
export { default as TrashIcon } from "lucide-react-native/icons/trash";
export { default as TrendingDownIcon } from "lucide-react-native/icons/trending-down";
export { default as TrendingUpIcon } from "lucide-react-native/icons/trending-up";
export { default as TvIcon } from "lucide-react-native/icons/tv";
export { default as UserMinusIcon } from "lucide-react-native/icons/user-minus";
export { default as UserPlusIcon } from "lucide-react-native/icons/user-plus";
export { default as WifiOffIcon } from "lucide-react-native/icons/wifi-off";
export { default as XIcon } from "lucide-react-native/icons/x";

export type { LucideIcon, LucideProps };

/** Each platform's own share symbol: a box and its arrow on iOS, three linked dots on Android. */
export const ShareIcon = Platform.OS === "ios" ? ShareIos : ShareAndroid;

/**
 * A payment made for one of the account's Stripe Connect accounts: the payment's dollar, with an
 * arrow leaving its circle at the top right, as the money passes on (the web's
 * `CONNECT_PAYMENT_ICON`).
 */
export function ConnectPaymentIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
}: Pick<LucideProps, "size" | "color" | "strokeWidth">) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M22 12A10 10 0 1 1 12 2" />
      <Path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <Path d="M12 18V6" />
      <Path d="M16 2h6v6" />
      <Path d="m22 2-3.5 3.5" />
    </Svg>
  );
}

/** The logo's pulse (the web's `LogoPulse`), in a color: screens draw it in their accent. */
export function LogoPulse({ height = 16, color }: { height?: number; color: string }) {
  return (
    <Svg width={(height * 48) / 34} height={height} viewBox="8 18 48 34" fill="none">
      <Path
        d="M12 40h9l6-16 8 24 6-14h11"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
