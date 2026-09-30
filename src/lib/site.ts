const repositoryUrl = "https://github.com/Synapsr/SaaS-Monitor";
const hostedUrl = "https://saas-monitor.com";

export const siteConfig = {
  name: "SaaS Monitor",
  tagline: "Your MRR, live on the wall.",
  description:
    "Open-source, real-time Stripe dashboard for SaaS founders. Put your MRR on a wall screen and hear every sale.",
  repositoryUrl,
  /** The instance run by the project, free during the public beta. */
  hostedUrl,
  docsUrl: `${repositoryUrl}/tree/main/docs`,
  selfHostingUrl: `${repositoryUrl}/blob/main/docs/self-hosting.md`,
} as const;

/** Whether an instance at `appUrl` is the project's own, rather than a self-hosted one. */
export function isHostedInstance(appUrl: string): boolean {
  return new URL(appUrl).host === new URL(hostedUrl).host;
}
