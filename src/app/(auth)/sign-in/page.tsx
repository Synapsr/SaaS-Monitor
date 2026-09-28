import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { socialErrorMessage } from "@/components/auth/auth-errors";
import { AuthCard, AuthHeader } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { safeRedirectPath, withRedirect } from "@/lib/safe-redirect";
import { siteConfig } from "@/lib/site";
import { getSession } from "@/server/session";
import { enabledSocialProviders } from "@/server/social-providers";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next: nextParam, error } = await searchParams;
  const next = safeRedirectPath(nextParam);
  if (await getSession()) redirect(next);

  return (
    <>
      <AuthCard>
        <AuthHeader
          title="Welcome back"
          description="Sign in to your screens and Stripe accounts."
        />
        <SignInForm
          next={next}
          providers={enabledSocialProviders()}
          initialError={typeof error === "string" ? socialErrorMessage(error) : null}
        />
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
