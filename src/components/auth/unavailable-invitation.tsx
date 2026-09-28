import { CircleSlashIcon, HourglassIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { INVITATION_TTL_DAYS } from "@/lib/invitations";
import type { InvitationPreview } from "@/server/members";

/** Why an invitation link no longer works: unknown, expired, revoked or already accepted. */
export function UnavailableInvitation({
  invitation,
  signedIn,
}: {
  invitation: InvitationPreview | null;
  signedIn: boolean;
}) {
  const { icon, title, description } = explain(invitation);
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

function explain(invitation: InvitationPreview | null) {
  switch (invitation?.status) {
    case "expired":
      return {
        icon: <HourglassIcon />,
        title: "This invitation has expired",
        description: `Invitations are valid for ${INVITATION_TTL_DAYS} days. Ask ${invitation.inviterName} for a new link.`,
      };
    case "revoked":
      return {
        icon: <CircleSlashIcon />,
        title: "This invitation is no longer valid",
        description: `It was revoked. Ask ${invitation.inviterName} for a new link if you still need access.`,
      };
    case "accepted":
      return {
        icon: <UsersIcon />,
        title: "Invitation already accepted",
        description: `It has been used to join ${invitation.workspaceName}. Sign in with ${invitation.email} to open it.`,
      };
    default:
      return {
        icon: <CircleSlashIcon />,
        title: "This invitation doesn’t exist",
        description: "The link may be incomplete. Ask the person who invited you to copy it again.",
      };
  }
}
