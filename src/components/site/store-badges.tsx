import { ArrowDownToLineIcon, HourglassIcon } from "lucide-react";
import { apps, type StoreApp } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";
import { cn } from "@/lib/utils";

const STORE_NAMES = { appStore: "App Store", googlePlay: "Google Play" } as const;

/**
 * Where to get the app: a link to each store once it lists the app (`apps.*.live`), and until
 * then a badge saying it is coming, linking nowhere. Words and a neutral icon rather than the
 * stores' own badges: those are for apps people can download.
 */
export function StoreBadges({
  text,
  className,
}: {
  text: SiteText["apps"]["stores"];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-3", className)}>
      {(["appStore", "googlePlay"] as const).map((store) => (
        <li key={store}>
          <Badge app={apps[store]} name={STORE_NAMES[store]} text={text} store={store} />
        </li>
      ))}
    </ul>
  );
}

function Badge({
  app,
  name,
  store,
  text,
}: {
  app: StoreApp;
  name: string;
  store: keyof typeof STORE_NAMES;
  text: SiteText["apps"]["stores"];
}) {
  const content = (
    <>
      {app.live ? (
        <ArrowDownToLineIcon aria-hidden className="size-5 text-(--ink)" />
      ) : (
        <HourglassIcon aria-hidden className="size-4.5 text-(--ink-3)" />
      )}
      <span aria-hidden className="flex flex-col leading-tight">
        <span className="text-[0.6875rem] text-(--ink-3)">
          {app.live ? text[store].liveLine : text.soon}
        </span>
        <span className="text-[1.0625rem] font-semibold tracking-tight">{name}</span>
      </span>
    </>
  );
  const className =
    "flex h-14 min-w-40 items-center gap-3 rounded-2xl bg-(--surface-raised) pr-5 pl-4 shadow-(--edge)";

  if (!app.live) {
    return (
      <p role="img" aria-label={text[store].soon} className={className}>
        {content}
      </p>
    );
  }
  return (
    <a
      href={app.url}
      aria-label={text[store].live}
      className={cn(
        className,
        "transition-[background-color,box-shadow,scale] duration-150 hover:bg-(--surface-hover) hover:shadow-(--edge-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow) active:scale-[0.96]",
      )}
    >
      {content}
    </a>
  );
}
