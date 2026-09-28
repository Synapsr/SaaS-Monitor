"use client";

import { useState, useTransition } from "react";
import { acceptInvitationAction } from "@/app/invite/[id]/actions";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useSignOut } from "@/hooks/use-sign-out";
import { withRedirect } from "@/lib/safe-redirect";

export function AcceptInvitationButton({ invitationId }: { invitationId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function accept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvitationAction(invitationId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full" onClick={accept} disabled={pending}>
        {pending && <Spinner />}
        Accept invitation
      </Button>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

/** Signed in with another address: sign out, then come back to the invitation. */
export function SwitchAccountButton({ invitationPath }: { invitationPath: string }) {
  const { signOut, signingOut } = useSignOut(withRedirect("/sign-in", invitationPath));
  return (
    <Button size="lg" className="w-full" onClick={signOut} disabled={signingOut}>
      {signingOut && <Spinner />}
      Sign out and switch account
    </Button>
  );
}
