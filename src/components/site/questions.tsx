import { Faq } from "@/components/site/faq";
import { RichText } from "@/components/site/rich-text";
import { Container, SectionHeading } from "@/components/site/section";
import { siteConfig } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";

/**
 * What founders ask before connecting Stripe, beside who makes the product: the heading and the
 * maker stay in view while the answers scroll.
 */
export function Questions({
  text,
  links,
}: {
  text: SiteText["faq"];
  links: Record<string, string>;
}) {
  return (
    <section aria-labelledby="faq-title" id="faq" className="pt-24 sm:pt-36">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="flex flex-col gap-10 lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="faq-title" eyebrow={text.eyebrow} title={text.title} />
          <aside className="reveal rounded-3xl bg-(--surface) p-6 text-sm leading-relaxed text-pretty text-(--ink-2) shadow-(--edge)">
            <h3 className="font-medium text-(--ink)">{text.maker.title}</h3>
            <p className="mt-2">
              <RichText text={text.maker.text(siteConfig.maker.builder)} links={links} />
            </p>
            <p className="mt-2">
              <RichText text={text.maker.also} links={links} />
            </p>
          </aside>
        </div>
        <Faq items={text.items} links={links} className="reveal" />
      </Container>
    </section>
  );
}
