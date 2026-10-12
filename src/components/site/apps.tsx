import { BellRingIcon, LayoutGridIcon, Share2Icon, WatchIcon } from "lucide-react";
import Image from "next/image";
import { Container, SectionHeading } from "@/components/site/section";
import { StoreBadges } from "@/components/site/store-badges";
import { apps } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";

const FEATURE_ICONS = [BellRingIcon, LayoutGridIcon, WatchIcon, Share2Icon];

/** The store pictures, cropped to their device (`public/images/apps`). */
const IMAGES = {
  iphone: { src: "/images/apps/iphone-live.webp", width: 660, height: 1284 },
  android: { src: "/images/apps/android-share.webp", width: 560, height: 904 },
  watch: { src: "/images/apps/watch-mrr.webp", width: 422, height: 514 },
};

/** Fades a phone out at the bottom, where the store picture cuts it. */
const FADE_OUT = "[mask-image:linear-gradient(to_bottom,black_55%,transparent_94%)]";

/**
 * The SaaS Monitor app: real pictures of it, layered like devices on a desk, its stores, then what
 * it does on a phone, a watch and their home screens.
 */
export function Apps({ text }: { text: SiteText["apps"] }) {
  const pending = !apps.appStore.live && !apps.googlePlay.live;
  return (
    <section aria-labelledby="apps-title" id="apps" className="pt-16 sm:pt-24">
      <Container>
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className="lg:pb-16">
            <SectionHeading
              id="apps-title"
              eyebrow={text.eyebrow}
              title={text.title}
              lead={text.lead}
            />
            <p className="reveal mt-5 text-sm text-(--ink-3)">{text.platforms}</p>
            <StoreBadges text={text.stores} className="reveal mt-9" />
            {pending && (
              <p className="reveal mt-4 max-w-md text-sm text-pretty text-(--ink-3)">
                {text.pending}
              </p>
            )}
          </div>
          <Devices text={text.images} />
        </div>

        <ul className="mt-4 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:mt-0 lg:grid-cols-4">
          {text.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
            return (
              <li key={feature.title} className="reveal flex flex-col gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-(--glow)/10 text-(--glow) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--glow)_25%,transparent)]">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <h3 className="font-medium text-balance">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-(--ink-2)">
                    {feature.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

function Devices({ text }: { text: SiteText["apps"]["images"] }) {
  return (
    <div className="reveal relative mx-auto h-[30rem] w-full max-w-[34rem] sm:h-[38rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_55%_40%,var(--glow-wash),transparent_75%)]"
      />
      {/* Side by side, the Android phone lower, so that the image it shares stays in view. */}
      <Image
        {...IMAGES.iphone}
        alt={text.iphone}
        sizes="(min-width: 640px) 290px, 54vw"
        className={`absolute top-0 left-[3%] w-[54%] max-w-72 drop-shadow-[0_40px_60px_rgb(0_0_0/0.9)] ${FADE_OUT}`}
      />
      <Image
        {...IMAGES.android}
        alt={text.android}
        sizes="(min-width: 640px) 240px, 42vw"
        className={`absolute top-[16%] right-0 w-[42%] max-w-60 drop-shadow-[0_40px_60px_rgb(0_0_0/0.9)] ${FADE_OUT}`}
      />
      <div className="absolute bottom-[20%] left-0 w-[30%] max-w-40 rounded-[2.125rem] bg-linear-to-b from-(--bezel-top) to-(--bezel-bottom) p-2 shadow-(--shadow-device)">
        <Image
          {...IMAGES.watch}
          alt={text.watch}
          sizes="(min-width: 640px) 144px, 30vw"
          className="w-full rounded-[1.625rem] outline-1 -outline-offset-1 outline-(--image-outline)"
        />
      </div>
    </div>
  );
}
