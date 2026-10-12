import Link from "next/link";
import { SOCIAL_PROVIDER_NAMES, type SocialProvider } from "@/lib/social-providers";

const linkClass = "text-foreground underline underline-offset-4 hover:decoration-foreground/40";

/**
 * Creating an account on the hosted service accepts its terms: say so wherever one can be created.
 * On the sign-in page, only `providers` (GitHub, Google) create accounts, for people new to it.
 */
export function TermsConsent({ providers }: { providers?: SocialProvider[] }) {
  const names = providers?.map((provider) => SOCIAL_PROVIDER_NAMES[provider]);
  const lead = names
    ? `By creating an account with ${new Intl.ListFormat("en", { type: "disjunction" }).format(names)}`
    : "By signing up";
  return (
    <p className="mt-5 text-center text-xs leading-5 text-pretty text-muted-foreground">
      {lead}, you agree to the{" "}
      <Link href="/terms" className={linkClass}>
        terms of service
      </Link>
      . The{" "}
      <Link href="/privacy" className={linkClass}>
        privacy policy
      </Link>{" "}
      explains how we handle your data.
    </p>
  );
}
