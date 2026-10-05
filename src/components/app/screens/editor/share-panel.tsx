"use client";

import { ArrowUpRightIcon, ChevronRightIcon, PartyPopperIcon, RefreshCwIcon } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { regenerateScreenLinkAction, sendTestCelebrationAction } from "@/app/app/screens/actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { CopyField } from "@/components/app/copy-button";
import { QrCode } from "@/components/app/screens/qr-code";
import { TvSetupSteps } from "@/components/app/screens/tv-setup";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { ScreenPassword } from "./screen-password";

/** Everything needed to get the screen onto a TV, and to check it works there. */
export function SharePanel({
  screenId,
  url,
  hasPassword,
  onLinkRegenerated,
}: {
  screenId: string;
  url: string;
  hasPassword: boolean;
  onLinkRegenerated: (publicToken: string) => void;
}) {
  const id = useId();
  const [testing, startTest] = useTransition();
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  function sendTest() {
    startTest(async () => {
      const result = await sendTestCelebrationAction(screenId);
      if (result.ok) {
        toast.success("Test celebration sent", {
          description: "Open copies of this screen celebrate within a few seconds.",
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section
      aria-label="Share"
      className="flex flex-col gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-url`} className="text-sm font-medium">
          Screen link
        </label>
        <CopyField id={`${id}-url`} value={url} label="screen link" />
        <p className="text-xs text-pretty text-muted-foreground">
          {hasPassword
            ? "Anyone with this link and the password can watch the screen, no sign-in needed."
            : "Anyone with this link can watch the screen, no sign-in needed. Keep it for your TVs."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={url} target="_blank" rel="noreferrer">
              Open screen
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
          <Button variant="outline" onClick={sendTest} disabled={testing}>
            {testing ? <Spinner /> : <PartyPopperIcon data-icon="inline-start" />}
            Send a test celebration
          </Button>
        </div>
        <p className="text-sm text-pretty text-muted-foreground">
          Plays a fake sale, with its sound, voice and confetti, on every open copy of this screen.
          The easiest way to check the sound on your TV.
        </p>
      </div>

      <div className="flex items-center gap-4 border-t pt-4">
        <QrCode
          value={url}
          label="QR code of the screen link"
          className="size-24 shrink-0 rounded-md p-1.5 ring-1 ring-foreground/10"
        />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Open on your phone</p>
          <p className="text-sm text-pretty text-muted-foreground">
            Scan this code with the SaaS Monitor app to follow the screen on your phone, with its
            widgets and notifications.
          </p>
        </div>
      </div>

      <Collapsible className="border-t pt-4">
        <CollapsibleTrigger className="group/trigger flex w-full items-center gap-1.5 rounded-sm text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronRightIcon className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" />
          Set up a TV or Raspberry Pi
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="pt-4 pl-5.5">
            <TvSetupSteps url={url} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ScreenPassword screenId={screenId} hasPassword={hasPassword} />

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground">Link shared too widely?</p>
        <Button variant="ghost" size="sm" onClick={() => setConfirmingRegenerate(true)}>
          <RefreshCwIcon data-icon="inline-start" />
          Regenerate link
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingRegenerate}
        onOpenChange={setConfirmingRegenerate}
        title="Regenerate the link?"
        description={
          <p>
            The current link stops working right away. Every TV showing this screen needs the new
            link.
          </p>
        }
        confirmLabel="Regenerate link"
        destructive
        successMessage="New link ready. Update your TVs with it."
        onConfirm={async () => {
          const result = await regenerateScreenLinkAction(screenId);
          if (result.ok) onLinkRegenerated(result.publicToken);
          return result;
        }}
      />
    </section>
  );
}
