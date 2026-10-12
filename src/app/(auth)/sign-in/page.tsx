import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { socialErrorMessage } from "@/components/auth/auth-errors";
import { AuthCard, AuthHeader } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { TermsConsent } from "@/components/auth/terms-consent";
import { env } from "@/env";
import { safeRedirectPath, withRedirect } from "@/lib/safe-redirect";
import { isHostedInstance, siteConfig } from "@/lib/site";
import { getSession } from "@/server/session";
import { enabledSocialProviders } from "@/server/social-providers";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next: nextParam, error } = await searchParams;
  const next = safeRedirectPath(nextParam);
  if (await getSession()) redirect(next);

  const providers = enabledSocialProviders();
  // "Continue with GitHub" creates the account of someone new: the hosted terms apply to it.
  const consent = providers.length > 0 && isHostedInstance(env().APP_URL);

  return (
    <>
      <AuthCard>
        <AuthHeader
          title="Welcome back"
          description="Sign in to your screens and Stripe accounts."
        />
        <SignInForm
          next={next}
          providers={providers}
          initialError={typeof error === "string" ? socialErrorMessage(error) : null}
        />
        {consent && <TermsConsent providers={providers} />}
      </AuthCard>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to {siteConfig.name}?{" "}
        <Link
          href={withRedirect("/sign-up", next)}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
