import type { Metadata } from "next";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { FinalCallToAction } from "@/components/marketing/final-call-to-action";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHeader } from "@/components/marketing/landing-header";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingSection } from "@/components/marketing/landing-section";
import { SelfHost } from "@/components/marketing/self-host";
import { SetupSteps } from "@/components/marketing/setup-steps";
import { SoundBoard } from "@/components/marketing/sound-board";
import { siteConfig } from "@/lib/site";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} · ${siteConfig.tagline}` },
};

export default function LandingPage() {
  return (
    <div className="landing dark min-h-svh">
      <LandingHeader />
      <main>
        <LandingHero />

        <LandingSection
          id="features"
          title="Built to keep you going"
          description="Building a SaaS is a long game. Seeing it grow, sale after sale, is what keeps founders shipping."
        >
          <FeatureGrid />
        </LandingSection>

        <LandingSection
          id="sounds"
          title="Hear what a sale sounds like"
          description="Three sound packs, synthesized right in the browser: nothing to install. Pick one per screen, or keep the meeting room silent."
        >
          <SoundBoard />
        </LandingSection>

        <LandingSection id="how-it-works" title="On the wall in two minutes">
          <SetupSteps />
        </LandingSection>

        <SelfHost />
        <FinalCallToAction />
      </main>
      <LandingFooter />
    </div>
  );
}
