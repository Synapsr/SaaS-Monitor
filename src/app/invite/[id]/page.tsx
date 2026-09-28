import { CircleSlashIcon, HourglassIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthHeader, AuthShell } from "@/components/auth/auth-shell";
import { AcceptInvitationButton, SwitchAccountButton } from "@/components/auth/invitation-actions";
import { WorkspaceAvatar } from "@/components/app/workspace-avatar";
import { Button } from "@/components/ui/button";
import { INVITATION_TTL_DAYS, invitationPath } from "@/lib/invitations";
import { ROLE_DETAILS } from "@/lib/roles";
import { withRedirect } from "@/lib/safe-redirect";
import { getInvitationPreview, type InvitationPreview } from "@/server/members";
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
        {!invitation ? (
          <Unavailable
            icon={<CircleSlashIcon />}
            title="This invitation doesn’t exist"
            description="The link may be incomplete. Ask the person who invited you to copy it again."
            signedIn={Boolean(session)}
          />
        ) : invitation.status === "expired" ? (
          <Unavailable
            icon={<HourglassIcon />}
            title="This invitation has expired"
            description={`Invitations are valid for ${INVITATION_TTL_DAYS} days. Ask ${invitation.inviterName} for a new link.`}
            signedIn={Boolean(session)}
          />
        ) : invitation.status === "revoked" ? (
          <Unavailable
            icon={<CircleSlashIcon />}
            title="This invitation is no longer valid"
            description={`It was revoked. Ask ${invitation.inviterName} for a new link if you still need access.`}
            signedIn={Boolean(session)}
          />
        ) : invitation.status === "accepted" ? (
          <Unavailable
            icon={<UsersIcon />}
            title="Invitation already accepted"
            description={`It has been used to join ${invitation.workspaceName}. Sign in with ${invitation.email} to open it.`}
            signedIn={Boolean(session)}
          />
        ) : (
          <PendingInvitation invitation={invitation} signedInEmail={session?.user.email ?? null} />
        )}
      </AuthCard>
    </AuthShell>
  );
}

function PendingInvitation({
  invitation,
  signedInEmail,
}: {
  invitation: InvitationPreview;
  signedInEmail: string | null;
}) {
  const path = invitationPath(invitation.id);
  const header = (
    <>
      <WorkspaceAvatar
        name={invitation.workspaceName}
        className="mb-5 size-10 rounded-xl text-base"
      />
      <AuthHeader
        title={`Join ${invitation.workspaceName}`}
        description={
          <>
            <span className="font-medium text-foreground">{invitation.inviterName}</span> invited
            you to their workspace on SaaS Monitor, where their MRR goes on the wall.
          </>
        }
      />
      <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-muted/60 px-3 py-2.5 text-sm dark:bg-input/20">
        <dt className="text-muted-foreground">Role</dt>
        <dd>
          {ROLE_DETAILS[invitation.role].label}{" "}
          <span className="text-muted-foreground">
            · {ROLE_DETAILS[invitation.role].description}
          </span>
        </dd>
        <dt className="text-muted-foreground">For</dt>
        <dd className="truncate font-medium">{invitation.email}</dd>
      </dl>
    </>
  );

  if (!signedInEmail) {
    return (
      <>
        {header}
        <div className="flex flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link href={withRedirect("/sign-up", path)}>Create my account</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href={withRedirect("/sign-in", path)}>I already have an account</Link>
          </Button>
        </div>
      </>
    );
  }

  if (signedInEmail.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <>
        {header}
        <p className="mb-5 text-sm text-pretty text-muted-foreground">
          You’re signed in as <span className="font-medium text-foreground">{signedInEmail}</span>.
          Switch to the invited account to accept it.
        </p>
        <SwitchAccountButton invitationPath={path} />
      </>
    );
  }

  return (
    <>
      {header}
      <AcceptInvitationButton invitationId={invitation.id} />
      <Button asChild variant="ghost" className="mt-2 w-full">
        <Link href="/app">Not now</Link>
      </Button>
    </>
  );
}

function Unavailable({
  icon,
  title,
  description,
  signedIn,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  signedIn: boolean;
}) {
  return (
    <>
      <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground [&_svg]:size-5">
        {icon}
      </div>
      <AuthHeader title={title} description={description} />
      <Button asChild size="lg" variant="outline" className="w-full">
        <Link href={signedIn ? "/app" : "/sign-in"}>
          {signedIn ? "Go to my dashboard" : "Sign in"}
        </Link>
      </Button>
    </>
  );
}
