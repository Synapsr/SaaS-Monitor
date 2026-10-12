import {
  CpuIcon,
  LaptopIcon,
  LockKeyholeIcon,
  PartyPopperIcon,
  PlayIcon,
  QrCodeIcon,
  SmartphoneIcon,
  TabletIcon,
  TvIcon,
} from "lucide-react";
import Link from "next/link";
import {
  Callout,
  Checklist,
  DocsSection,
  Figure,
  InfoCards,
  Paragraph,
} from "@/components/docs/docs-blocks";
import { DocsShell } from "@/components/docs/docs-shell";
import type { DocsPageProps } from "@/components/docs/page-props";
import { buttonClass } from "@/components/site/button-styles";
import { GITHUB_DOCS } from "@/lib/site/docs/pages";
import { docsJsonLd } from "@/lib/site/docs/structured-data";
import { demoPath, demoPoster } from "@/lib/site/paths";

const PAGE = "wall-display";

/** Putting a screen on a TV: devices, its link, what it shows and how it runs on its own. */
export function WallDisplayDoc({ language, text, site, links }: DocsPageProps) {
  const page = text.wallDisplay;
  const { devices } = page;

  return (
    <DocsShell
      language={language}
      page={PAGE}
      text={text}
      site={site}
      title={page.title}
      lead={page.lead}
      toc={[
        { id: "devices", title: devices.title },
        { id: "link", title: page.link.title },
        { id: "what-it-shows", title: page.shows.title },
        { id: "moments", title: page.moments.title },
        { id: "unattended", title: page.unattended.title },
        { id: "sound", title: page.sound.title },
      ]}
      github={[GITHUB_DOCS.wallRaspberryPi, GITHUB_DOCS.wallDevices, GITHUB_DOCS.wallMoments]}
      jsonLd={docsJsonLd({
        language,
        page: PAGE,
        title: page.title,
        description: page.meta.description,
        names: { docs: text.common.docs, page: text.common.pages[PAGE] },
        image: demoPoster(language),
      })}
    >
      <DocsSection id="devices" title={devices.title}>
        <Paragraph text={devices.lead} links={links} />
        <InfoCards
          links={links}
          cards={[
            {
              icon: CpuIcon,
              ...devices.raspberryPi,
              badge: devices.recommended,
              wide: true,
            },
            { icon: TvIcon, ...devices.smartTv },
            { icon: LaptopIcon, ...devices.computer },
            { icon: TabletIcon, ...devices.tablet },
            { icon: SmartphoneIcon, ...devices.phone },
          ]}
        />
        <Paragraph
          text={devices.raspberryPiNote}
          links={links}
          className="text-base text-(--ink-3)"
        />
      </DocsSection>

      <DocsSection id="link" title={page.link.title}>
        <Paragraph text={page.link.text} links={links} />
        <InfoCards
          links={links}
          cards={[
            { icon: LockKeyholeIcon, ...page.link.password },
            { icon: QrCodeIcon, ...page.link.phone },
          ]}
        />
      </DocsSection>

      <DocsSection id="what-it-shows" title={page.shows.title}>
        <Figure
          image={{ src: demoPoster(language), width: 1920, height: 1080 }}
          alt={site.demo.posterAlt}
          caption={site.demo.caption}
        />
        <Checklist items={page.shows.items} links={links} />
        <div>
          <Link
            href={demoPath(language)}
            prefetch={false}
            className={buttonClass({ variant: "secondary", size: "md" })}
          >
            <PlayIcon aria-hidden className="fill-current" />
            {site.demo.open}
          </Link>
        </div>
      </DocsSection>

      <DocsSection id="moments" title={page.moments.title}>
        <Figure
          image={{ src: "/images/docs/moment.webp", width: 1920, height: 1080 }}
          alt={page.moments.imageAlt}
        />
        <Paragraph text={page.moments.text} links={links} />
        <Paragraph text={page.moments.detail} links={links} />
        <Callout
          icon={PartyPopperIcon}
          title={page.moments.tip.title}
          text={page.moments.tip.text}
          links={links}
        />
      </DocsSection>

      <DocsSection id="unattended" title={page.unattended.title}>
        <Checklist items={page.unattended.items} links={links} />
      </DocsSection>

      <DocsSection id="sound" title={page.sound.title}>
        <Paragraph text={page.sound.text} links={links} />
      </DocsSection>
    </DocsShell>
  );
}
