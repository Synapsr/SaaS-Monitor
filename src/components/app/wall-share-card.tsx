"use client";

import { ArrowUpRightIcon, CameraIcon, StarIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { LinkedInIcon, XLogoIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { useStoredFlag } from "@/hooks/use-stored-flag";
import { communityLinks, shareIntentUrl } from "@/lib/community";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const DONE_KEY = "saas-monitor:wall-share-card";

/**
 * Asks for a photo, a share or a star right after the screen worked, when founders are most
 * likely to want to. Asked once per browser: closing the card, or following one of its links,
 * keeps it away for good.
 */
export function WallShareCard({ className }: { className?: string }) {
  const id = useId();
  const [done, markDone] = useStoredFlag(DONE_KEY);
  // Following a link marks the card done but keeps it open: sharing and starring go together.
  const [keptOpen, setKeptOpen] = useState(false);
  if (done && !keptOpen) return null;

  function followLink() {
    setKeptOpen(true);
    markDone();
  }

  function dismiss() {
    setKeptOpen(false);
    markDone();
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        "relative flex animate-in gap-3 rounded-lg bg-muted/50 p-4 ring-1 ring-foreground/5 duration-300 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none dark:bg-input/20",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-foreground/10 max-sm:hidden"
      >
        <CameraIcon className="size-4 text-muted-foreground" />
      </span>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-0.5 pt-1 pr-6">
          <p id={`${id}-title`} className="text-sm font-medium">
            It’s on the wall?
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            Snap a photo and share it, or leave a star so the next founder finds {siteConfig.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExternalButton href={communityLinks.star} onFollow={followLink}>
            <StarIcon data-icon="inline-start" />
            Star on GitHub
          </ExternalButton>
          <ExternalButton href={shareIntentUrl("x")} onFollow={followLink}>
            <XLogoIcon data-icon="inline-start" className="size-3.5" />
            Share on X
          </ExternalButton>
          <ExternalButton href={shareIntentUrl("linkedin")} onFollow={followLink}>
            <LinkedInIcon data-icon="inline-start" className="size-3.5" />
            Share on LinkedIn
          </ExternalButton>
        </div>
        {/* Its own line keeps it aligned with the text, wherever the buttons wrap. */}
        <ExternalButton
          href={communityLinks.showYourWall}
          onFollow={followLink}
          variant="link"
          className="h-auto self-start p-0"
        >
          Show us your wall
          <ArrowUpRightIcon />
        </ExternalButton>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute top-2 right-2 text-muted-foreground"
        aria-label="Dismiss"
        onClick={dismiss}
      >
        <XIcon />
      </Button>
    </section>
  );
}

function ExternalButton({
  href,
  onFollow,
  variant = "outline",
  className,
  children,
}: {
  href: string;
  onFollow: () => void;
  variant?: "outline" | "link";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button asChild size="sm" variant={variant} className={className}>
      <a href={href} target="_blank" rel="noreferrer" onClick={onFollow}>
        {children}
      </a>
    </Button>
  );
}
