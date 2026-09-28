import Link from "next/link";
import { WorkspaceAvatar } from "@/components/app/workspace-avatar";
import { AuthHeader } from "@/components/auth/auth-shell";
import { AcceptInvitationButton, SwitchAccountButton } from "@/components/auth/invitation-actions";
import { Button } from "@/components/ui/button";
import { invitationPath } from "@/lib/invitations";
import { ROLE_DETAILS } from "@/lib/roles";
import { withRedirect } from "@/lib/safe-redirect";
import { siteConfig } from "@/lib/site";
import type { InvitationPreview } from "@/server/members";

/**
 * An invitation that can be accepted: by creating an account or signing in, by switching to the
 * invited account, or right away when it is the one signed in.
 */
export function PendingInvitation({
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
            you to their workspace on {siteConfig.name}, where their MRR goes on the wall.
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
