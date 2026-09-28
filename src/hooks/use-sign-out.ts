import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";

/** Signs out, then opens `next`, rendered again from the server without the session. */
export function useSignOut(next = "/sign-in"): { signOut: () => void; signingOut: boolean } {
  const router = useRouter();
  const [signingOut, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.replace(next);
      router.refresh();
    });
  }

  return { signOut, signingOut };
}
