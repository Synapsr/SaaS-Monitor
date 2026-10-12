import {
  ArrowUpRightIcon,
  AudioLinesIcon,
  LanguagesIcon,
  LockIcon,
  Volume2Icon,
  VolumeOffIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ModeBadge } from "@/components/app/accounts/account-status";
import { CopyButton, CopyField } from "@/components/app/copy-button";
import { Button } from "@/components/ui/button";
import type { DisplayState } from "@/lib/display/types";
import { cn } from "@/lib/utils";
import type { Screen } from "@/server/screens";
import { PhoneQrButton } from "./phone-qr-button";
import { QrCode } from "./qr-code";
import { ScreenSnapshot, SnapshotSkeleton } from "./screen-snapshot";
import type { ScreenTag } from "./screen-tags";

/**
 * A screen of the workspace: what it shows right now, what tells it apart, and what people do
 * with it most, one click away. The whole card opens the editor.
 */
export function ScreenCard({
  screen,
  url,
  state,
  tags,
  wide = false,
}: {
  screen: Screen;
  url: string;
  /** See `ScreenSnapshot`. */
  state: Promise<DisplayState | null> | undefined;
  tags: ScreenTag[];
  /**
   * The only screen of the list: on wide pages, its preview and details side by side, with its
   * link and QR code in plain sight rather than behind buttons.
   */
  wide?: boolean;
}) {
  const editHref = `/app/screens/${screen.id}`;
  const titleId = `screen-${screen.id}`;
  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "relative flex w-full flex-col gap-1 rounded-2xl bg-card p-2 shadow-xs ring-1 ring-foreground/10 transition-[box-shadow,scale] duration-200 ease-out",
        "hover:shadow-md hover:ring-foreground/20 dark:hover:ring-foreground/25",
        "has-[[data-screen-link]:focus-visible]:ring-3 has-[[data-screen-link]:focus-visible]:ring-ring/50",
        "has-[[data-screen-link]:active]:scale-[0.99]",
        wide && "lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-2",
      )}
    >
      {/*
       * Above the card's link so that its own actions can be clicked, but transparent to the
       * pointer everywhere else: a click on the preview opens the editor like the rest of the card.
       */}
      <div className="pointer-events-none relative z-10 [&_a]:pointer-events-auto">
        <Suspense fallback={<SnapshotSkeleton settings={screen.settings} />}>
          <ScreenSnapshot settings={screen.settings} state={state} editHref={editHref} />
        </Suspense>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-3 px-2 pt-2.5 pb-1",
          wide && "lg:gap-5 lg:px-4 lg:pt-3 lg:pb-2",
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3
              id={titleId}
              className={cn("flex min-w-0 items-center gap-1.5 font-medium", wide && "lg:text-lg")}
            >
              <Link
                href={editHref}
                data-screen-link
                className="truncate outline-none after:absolute after:inset-0 after:rounded-[inherit]"
              >
                {screen.name}
              </Link>
              {screen.hasPassword && (
                <LockIcon
                  role="img"
                  aria-label="Protected by a password"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              )}
            </h3>
            <ScreenAccounts accounts={screen.accounts} />
          </div>
          {tags.length > 0 && (
            <ul aria-label="Settings" className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <ScreenTagChip key={tag.kind} tag={tag} />
              ))}
            </ul>
          )}
        </div>

        {wide && <ShareDetails url={url} name={screen.name} />}

        {/* Hit areas grow to 40px tall without overlapping: buttons are 28px, 6px apart. */}
        <div className="pointer-events-none relative z-10 mt-auto flex items-center gap-1.5 pt-1 *:pointer-events-auto *:relative *:after:absolute *:after:-inset-x-[3px] *:after:-inset-y-1.5">
          <Button asChild variant="outline" size="sm">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${screen.name} in a new tab`}
            >
              Open
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
          {/* The wide card shows the link and its QR code instead. */}
          <CopyButton value={url} label="Copy link" className={cn(wide && "lg:hidden")} />
          <PhoneQrButton url={url} name={screen.name} className={cn(wide && "lg:hidden")} />
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link href={editHref} aria-label={`Edit ${screen.name}`}>
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function ScreenAccounts({ accounts }: { accounts: Screen["accounts"] }) {
  if (accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">No Stripe account yet</p>;
  }
  const testMode = accounts.some((account) => !account.livemode);
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      <span className="truncate">{accounts.map((account) => account.name).join(" · ")}</span>
      {testMode && <ModeBadge livemode={false} className="shrink-0" />}
    </p>
  );
}

const TAG_ICONS: Record<ScreenTag["kind"], LucideIcon> = {
  language: LanguagesIcon,
  sound: Volume2Icon,
  muted: VolumeOffIcon,
  voice: AudioLinesIcon,
};

function ScreenTagChip({ tag }: { tag: ScreenTag }) {
  const Icon = TAG_ICONS[tag.kind];
  return (
    <li className="inline-flex h-5 items-center gap-1 rounded-md bg-muted px-1.5 text-xs text-muted-foreground">
      <Icon aria-hidden="true" className="size-3" />
      {tag.label}
    </li>
  );
}

/** The link and the QR code of a single screen, with room to spare beside its preview. */
function ShareDetails({ url, name }: { url: string; name: string }) {
  return (
    <div className="relative z-10 hidden flex-col gap-4 border-t pt-5 lg:flex">
      <CopyField value={url} label={`link of ${name}`} />
      <div className="flex items-center gap-4">
        <QrCode
          value={url}
          label={`QR code of the link of ${name}`}
          className="size-20 shrink-0 rounded-md p-1.5 ring-1 ring-foreground/10"
        />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Open on your phone</p>
          <p className="text-sm text-pretty text-muted-foreground">
            Scan it with the SaaS Monitor app to follow this screen, with its widgets and
            notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
