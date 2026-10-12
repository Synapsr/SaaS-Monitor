import {
  CalendarRangeIcon,
  CheckIcon,
  GlobeIcon,
  GoalIcon,
  LayersIcon,
  MinusIcon,
  RotateCwIcon,
  TrendingUpIcon,
} from "lucide-react";
import { DocsSection, Figure, InfoCards, Paragraph } from "@/components/docs/docs-blocks";
import { DocsShell } from "@/components/docs/docs-shell";
import type { DocsPageProps } from "@/components/docs/page-props";
import { PRESET_ACCENTS } from "@/lib/display/accents";
import { CHANNELS, SCREEN_EVENTS } from "@/lib/display/events";
import { ACCENTS, defaultScreenSettings, SOUND_PACKS } from "@/lib/screens/settings";
import { GITHUB_DOCS } from "@/lib/site/docs/pages";
import { docsJsonLd } from "@/lib/site/docs/structured-data";
import { formatMoney } from "@/lib/money";
import { INTL_LOCALES, LANGUAGE_NAMES, LANGUAGE_TAGS, SITE_LANGUAGES } from "@/lib/site/languages";
import { cn } from "@/lib/utils";

const PAGE = "customize";

/** What a screen can be set to: its numbers, look, language, sounds, events and accounts. */
export function CustomizeDoc({ language, text, site, links }: DocsPageProps) {
  const page = text.customize;
  const { numbers, events } = page;

  return (
    <DocsShell
      language={language}
      page={PAGE}
      text={text}
      site={site}
      title={page.title}
      lead={page.lead}
      toc={[
        { id: "numbers", title: numbers.title },
        { id: "look", title: page.look.title },
        { id: "language", title: page.language.title },
        { id: "sound", title: page.sound.title },
        { id: "events", title: events.title },
        { id: "accounts", title: page.accounts.title },
        { id: "names", title: page.names.title },
      ]}
      github={[
        GITHUB_DOCS.wallEvents,
        GITHUB_DOCS.wallVoice,
        GITHUB_DOCS.wallAccounts,
        GITHUB_DOCS.wallLook,
      ]}
      jsonLd={docsJsonLd({
        language,
        page: PAGE,
        title: page.title,
        description: page.meta.description,
        names: { docs: text.common.docs, page: text.common.pages[PAGE] },
        image: "/images/docs/editor.webp",
      })}
    >
      <Figure
        image={{ src: "/images/docs/editor.webp", width: 1440, height: 960 }}
        alt={page.editorAlt}
      />

      <DocsSection id="numbers" title={numbers.title}>
        <InfoCards
          links={links}
          cards={[
            { icon: TrendingUpIcon, ...numbers.metric },
            { icon: GoalIcon, ...numbers.goal },
            { icon: CalendarRangeIcon, ...numbers.chart },
            { icon: GlobeIcon, ...numbers.currency },
          ]}
        />
      </DocsSection>

      <DocsSection id="look" title={page.look.title}>
        <Paragraph text={page.look.text} links={links} />
        {/* The preset accents as screens draw them on the dark theme, then a color of one's own. */}
        <div aria-hidden className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-(--surface-raised) p-1.5 shadow-(--edge)">
            {ACCENTS.map((accent) => (
              <span
                key={accent}
                className="size-6 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.15)]"
                style={{ backgroundColor: PRESET_ACCENTS[accent].dark.glow }}
              />
            ))}
          </span>
          <span className="flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-sm text-(--ink-2) shadow-(--edge)">
            <span className="size-6 rounded-full bg-[conic-gradient(#ff6b35,#facc15,#34d399,#38bdf8,#a78bfa,#f472b6,#ff6b35)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.15)]" />
            {page.look.custom}
          </span>
        </div>
        <Figure
          image={{ src: "/images/docs/light.webp", width: 1920, height: 1080 }}
          alt={page.look.imageAlt}
        />
      </DocsSection>

      <DocsSection id="language" title={page.language.title}>
        <Paragraph text={page.language.text} links={links} />
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SITE_LANGUAGES.map((other) => (
            <li
              key={other}
              lang={LANGUAGE_TAGS[other]}
              className="flex flex-col gap-0.5 rounded-xl bg-(--surface) px-3.5 py-2.5 shadow-(--edge)"
            >
              <span className="text-sm text-(--ink-2)">{LANGUAGE_NAMES[other]}</span>
              <span className="font-medium text-(--ink) tabular-nums">
                {formatMoney(1_248_000, "eur", { locale: INTL_LOCALES[other] })}
              </span>
            </li>
          ))}
        </ul>
      </DocsSection>

      <DocsSection id="sound" title={page.sound.title}>
        <Paragraph text={page.sound.packs} links={links} />
        <ul className="grid gap-2 sm:grid-cols-3">
          {SOUND_PACKS.map((pack) => (
            <li key={pack} className="rounded-xl bg-(--surface) px-4 py-3 shadow-(--edge)">
              <p className="font-medium text-(--ink)">{site.sounds.packs[pack].name}</p>
              <p className="mt-0.5 text-sm text-pretty text-(--ink-3)">
                {site.sounds.packs[pack].description}
              </p>
            </li>
          ))}
        </ul>
        <Paragraph text={page.sound.voice} links={links} />
        <Paragraph text={page.sound.own} links={links} />
      </DocsSection>

      <DocsSection id="events" title={events.title}>
        <Paragraph text={events.text} links={links} />
        <EventsTable text={events} />
      </DocsSection>

      <DocsSection id="accounts" title={page.accounts.title}>
        <Paragraph text={page.accounts.text} links={links} />
        <InfoCards
          links={links}
          cards={[
            { icon: LayersIcon, ...page.accounts.added },
            { icon: RotateCwIcon, ...page.accounts.rotation },
          ]}
        />
        <Figure
          image={{ src: "/images/docs/accounts.webp", width: 1920, height: 1080 }}
          alt={page.accounts.imageAlt}
        />
        <Paragraph text={page.accounts.more} links={links} />
      </DocsSection>

      <DocsSection id="names" title={page.names.title}>
        <Paragraph text={page.names.text} links={links} />
      </DocsSection>
    </DocsShell>
  );
}

/** Each event and where it shows and plays, as a new screen has it (`defaultScreenSettings`). */
function EventsTable({ text }: { text: DocsPageProps["text"]["customize"]["events"] }) {
  const defaults = defaultScreenSettings.events;
  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-2xl shadow-(--edge)">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead className="bg-(--surface)">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium text-(--ink-3)">
                {text.event}
              </th>
              {CHANNELS.map((channel) => (
                <th
                  key={channel}
                  scope="col"
                  className="w-[3.25rem] px-0.5 py-3 text-center text-xs font-medium text-(--ink-3)"
                >
                  {text.columns[channel]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--hairline)">
            {SCREEN_EVENTS.map((event) => (
              <tr key={event}>
                <th scope="row" className="px-4 py-2.5 font-normal text-pretty text-(--ink)">
                  {text.names[event]}
                </th>
                {CHANNELS.map((channel) => {
                  const on = defaults[event][channel];
                  return (
                    <td key={channel} className="px-1 py-2.5 text-center">
                      <span
                        className={cn(
                          "mx-auto flex size-5 items-center justify-center rounded-full",
                          on ? "bg-(--glow)/12 text-(--glow)" : "text-(--ink-3)/50",
                        )}
                      >
                        {on ? (
                          <CheckIcon aria-hidden className="size-3.5" strokeWidth={2.5} />
                        ) : (
                          <MinusIcon aria-hidden className="size-3.5" />
                        )}
                        <span className="sr-only">{on ? text.on : text.off}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="text-sm text-pretty text-(--ink-3)">{text.caption}</figcaption>
    </figure>
  );
}
