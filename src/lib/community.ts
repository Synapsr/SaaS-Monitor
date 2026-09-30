import { siteConfig } from "@/lib/site";

/**
 * The hosted product. Shares point there whichever instance they are sent from: a self-hosted
 * dashboard's own address is private, the project's home is not.
 */
const HOMEPAGE_URL = "https://saas-monitor.com";

export type ShareChannel = "x" | "linkedin";

/** What a founder posts about their wall, before the link. Their words once the composer opens. */
export const WALL_SHARE_TEXT =
  "Our MRR is now live on the office TV, with a cash register for every sale 🔔 Built with SaaS Monitor, open source:";

/** The homepage, tagged with the channel so visits from shares can be told apart. */
export function sharedHomepageUrl(channel: ShareChannel): string {
  return `${HOMEPAGE_URL}/?ref=share-${channel}`;
}

/**
 * Opens the channel's post composer, pre-filled. X takes the link on its own (its documented web
 * intent). LinkedIn's documented share link takes only a URL, so this uses its feed composer,
 * which takes text and turns the link inside it into a preview card; on phones it may open the
 * plain feed instead.
 */
export function shareIntentUrl(channel: ShareChannel, text: string = WALL_SHARE_TEXT): string {
  const link = sharedHomepageUrl(channel);
  switch (channel) {
    case "x":
      return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    case "linkedin":
      return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${text} ${link}`)}`;
  }
}

/** Where the dashboard sends people who want to help, ask or follow along. */
export const communityLinks = {
  star: siteConfig.repositoryUrl,
  docs: siteConfig.docsUrl,
  changelog: "/changelog",
  /** Blank issues are off: the chooser lists the bug report and feature request forms. */
  feedback: `${siteConfig.repositoryUrl}/issues/new/choose`,
  /** "Show and tell" is one of the categories GitHub creates with Discussions. */
  showYourWall: `${siteConfig.repositoryUrl}/discussions/new?category=show-and-tell`,
} as const;
