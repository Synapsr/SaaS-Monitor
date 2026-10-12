import {
  BookOpenIcon,
  ChartLineIcon,
  PaletteIcon,
  RocketIcon,
  ServerIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TvIcon,
  type LucideIcon,
} from "lucide-react";
import type { DocsPage } from "@/lib/site/docs/pages";

/** Each page of the docs by its icon, in the sidebar, the phone menu and the cards. */
export const DOCS_ICONS: Record<DocsPage, LucideIcon> = {
  overview: BookOpenIcon,
  "get-started": RocketIcon,
  "wall-display": TvIcon,
  customize: PaletteIcon,
  apps: SmartphoneIcon,
  numbers: ChartLineIcon,
  security: ShieldCheckIcon,
  "self-hosting": ServerIcon,
};
