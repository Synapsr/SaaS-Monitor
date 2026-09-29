import { ArrowUpRightIcon, CircleAlertIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/app/copy-button";
import { Button } from "@/components/ui/button";
import type { Screen } from "@/server/screens";
import { ScreenThumbnail } from "./screen-thumbnail";

export function ScreenCard({ screen, url }: { screen: Screen; url: string }) {
  const editHref = `/app/screens/${screen.id}`;
  return (
    <article className="group/screen flex flex-col rounded-xl bg-card p-2 ring-1 ring-foreground/10 transition-shadow hover:ring-foreground/20">
      <Link href={editHref} tabIndex={-1} aria-hidden="true" className="overflow-hidden rounded-sm">
        <ScreenThumbnail
          accent={screen.settings.accent}
          theme={screen.settings.theme}
          className="rounded-sm transition-transform duration-300 group-hover/screen:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 px-2 pt-3 pb-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="flex items-center gap-1.5 truncate font-medium">
            {screen.hasPassword && (
              <LockIcon aria-label="Protected by a password" className="size-3.5 shrink-0" />
            )}
            <Link
              href={editHref}
              className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {screen.name}
            </Link>
          </h3>
          {screen.accounts.length > 0 ? (
            <p className="truncate text-sm text-muted-foreground">
              {screen.accounts.map((account) => account.name).join(", ")}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
              <CircleAlertIcon className="size-3.5" />
              No Stripe account selected
            </p>
          )}
        </div>
        <div className="mt-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noreferrer">
              Open
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
          <CopyButton value={url} label="Copy link" />
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link href={editHref}>Edit</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
