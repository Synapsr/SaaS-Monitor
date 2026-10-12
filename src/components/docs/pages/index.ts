import type { DocsPageProps } from "@/components/docs/page-props";
import type { DocsPage } from "@/lib/site/docs/pages";
import { AppsDoc } from "./apps";
import { CustomizeDoc } from "./customize";
import { GetStartedDoc } from "./get-started";
import { NumbersDoc } from "./numbers";
import { OverviewDoc } from "./overview";
import { SecurityDoc } from "./security";
import { SelfHostingDoc } from "./self-hosting";
import { WallDisplayDoc } from "./wall-display";

/** Each page of the docs, by the component that renders it. */
export const DOCS_PAGE_COMPONENTS: Record<DocsPage, (props: DocsPageProps) => React.ReactNode> = {
  overview: OverviewDoc,
  "get-started": GetStartedDoc,
  "wall-display": WallDisplayDoc,
  customize: CustomizeDoc,
  apps: AppsDoc,
  numbers: NumbersDoc,
  security: SecurityDoc,
  "self-hosting": SelfHostingDoc,
};
