import { Link2OffIcon } from "lucide-react";
import { ScreenMessage } from "@/components/display/screen-message";
import { LogoPulse } from "@/components/logo";
import { displayLocale } from "@/lib/display/i18n";
import { siteConfig } from "@/lib/site";
import type { Language, Theme } from "@/lib/screens/settings";

/**
 * For a link that no longer opens a screen: deleted, or its link regenerated. A screen that was
 * open keeps its language and theme; a link opened afresh can't know them.
 */
export function ScreenGone({
  language = "en",
  theme = "dark",
}: {
  language?: Language;
  theme?: Theme;
}) {
  const { text } = displayLocale(language);
  return (
    <div
      data-theme={theme}
      className="display fixed inset-0 flex flex-col overflow-hidden px-13 pt-10 pb-12"
    >
      <p className="flex items-center gap-4 text-2xl font-medium tracking-tight">
        <LogoPulse className="h-6 text-(--glow)" />
        {siteConfig.name}
      </p>
      <ScreenMessage icon={<Link2OffIcon />} title={text.status.gone} tone="neutral">
        <p>{text.status.goneDetails(siteConfig.name)}</p>
      </ScreenMessage>
    </div>
  );
}
