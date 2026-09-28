import type { Metadata } from "next";
import { AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { PendingInvitation } from "@/components/auth/pending-invitation";
import { UnavailableInvitation } from "@/components/auth/unavailable-invitation";
import { getInvitationPreview } from "@/server/members";
import { getSession } from "@/server/session";

export const metadata: Metadata = {
  title: "Invitation",
  // The URL is a secret: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default async function InvitationPage({ params }: PageProps<"/invite/[id]">) {
  const { id } = await params;
  const [invitation, session] = await Promise.all([getInvitationPreview(id), getSession()]);

  return (
    <AuthShell>
      <AuthCard>
        {invitation?.status === "pending" ? (
          <PendingInvitation invitation={invitation} signedInEmail={session?.user.email ?? null} />
        ) : (
          <UnavailableInvitation invitation={invitation} signedIn={Boolean(session)} />
        )}
      </AuthCard>
    </AuthShell>
  );
}
