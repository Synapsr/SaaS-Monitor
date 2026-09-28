import { LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, AuthHeader } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { invitationIdFromPath } from "@/lib/invitations";
import { safeRedirectPath, withRedirect } from "@/lib/safe-redirect";
import { getInvitationPreview } from "@/server/members";
import { getSession } from "@/server/session";
import { enabledSocialProviders } from "@/server/social-providers";

export const metadata: Metadata = { title: "Create your account" };

/** Signing up from an invitation link: the invitation decides which email address to use. */
async function pendingInvitation(next: string) {
  const id = invitationIdFromPath(next);
  if (!id) return null;
  const invitation = await getInvitationPreview(id);
  return invitation?.status === "pending" ? invitation : null;
}

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const next = safeRedirectPath((await searchParams).next);
  if (await getSession()) redirect(next);

  const invitation = await pendingInvitation(next);
  const { DISABLE_SIGNUPS: signupsDisabled } = env();
  const signInHref = withRedirect("/sign-in", next);

  // Invited people can always sign up: the server lets pending invitations through.
  if (signupsDisabled && !invitation) {
    return (
      <AuthCard>
        <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-muted">
          <LockIcon className="size-5 text-muted-foreground" />
        </div>
        <AuthHeader
          title="Sign-ups are invite-only"
          description="This server only accepts invited people. Ask a workspace owner for an invitation link: opening it lets you create your account."
        />
        <Button asChild size="lg" className="w-full">
          <Link href={signInHref}>I already have an account</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <>
      <AuthCard>
        {invitation ? (
          <AuthHeader
            title={`Join ${invitation.workspaceName}`}
            description={`${invitation.inviterName} invited you. Create your account to see the workspace's screens.`}
          />
        ) : (
          <AuthHeader
            title="Create your account"
            description="Your MRR on the wall in about two minutes."
          />
        )}
        <SignUpForm
          next={next}
          providers={enabledSocialProviders()}
          invitedEmail={invitation?.email ?? null}
          signupsDisabled={signupsDisabled}
        />
      </AuthCard>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={signInHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
