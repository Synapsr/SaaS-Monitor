"use client";

import { ArrowUpRightIcon } from "lucide-react";
import { useState } from "react";
import { CopyField } from "@/components/app/copy-button";
import { WallShareCard } from "@/components/app/wall-share-card";
import { Button } from "@/components/ui/button";

/**
 * The screen's link, to open on the TV. Once the screen was opened from here, the founder is
 * probably looking at it working: the moment the share card asks for a photo or a star.
 */
export function ScreenLinkStep({ url }: { url: string }) {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-pretty text-muted-foreground">
          Open this link on the TV. It is private: anyone who has it can see the screen.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <CopyField value={url} label="Screen link" className="sm:flex-1" />
          <Button asChild size="lg">
            <a href={url} target="_blank" rel="noreferrer" onClick={() => setOpened(true)}>
              Open screen
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>
      {opened && <WallShareCard />}
    </>
  );
}
