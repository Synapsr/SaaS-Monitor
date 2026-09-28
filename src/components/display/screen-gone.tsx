import { Link2Off } from "lucide-react";
import { ScreenMessage } from "@/components/display/screen-message";
import { LogoPulse } from "@/components/logo";
import { siteConfig } from "@/lib/site";

/** For a link that no longer opens a screen: deleted, or its link regenerated. */
export function ScreenGone() {
  return (
    <div className="display fixed inset-0 flex flex-col overflow-hidden px-13 pt-10 pb-12">
      <p className="flex items-center gap-4 text-2xl font-medium tracking-tight">
        <LogoPulse className="h-6 text-(--glow)" />
        {siteConfig.name}
      </p>
      <ScreenMessage icon={<Link2Off />} title="This screen link no longer works" tone="neutral">
        <p>
          The screen may have been deleted, or its link regenerated. Open it again from your{" "}
          {siteConfig.name} dashboard to get its current link.
        </p>
      </ScreenMessage>
    </div>
  );
}
