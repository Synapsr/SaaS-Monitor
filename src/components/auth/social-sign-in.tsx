"use client";

import { useState } from "react";
import { toast } from "sonner";
import { GitHubIcon, GoogleIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { withRedirect } from "@/lib/safe-redirect";
import type { SocialProvider } from "@/lib/social-providers";
import { authErrorMessage } from "./auth-errors";

const PROVIDER_BUTTONS: Record<SocialProvider, { label: string; Icon: typeof GitHubIcon }> = {
  github: { label: "GitHub", Icon: GitHubIcon },
  google: { label: "Google", Icon: GoogleIcon },
};

export function SocialSignIn({ providers, next }: { providers: SocialProvider[]; next: string }) {
  const [pending, setPending] = useState<SocialProvider | null>(null);

  async function signIn(provider: SocialProvider) {
    setPending(provider);
    // On success the browser leaves for the provider, so there is nothing else to do here.
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: next,
      errorCallbackURL: withRedirect("/sign-in", next),
    });
    if (error) {
      setPending(null);
      toast.error(authErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-2">
      {providers.map((provider) => {
        const { label, Icon } = PROVIDER_BUTTONS[provider];
        return (
          <Button
            key={provider}
            type="button"
            variant="outline"
            size="lg"
            disabled={pending !== null}
            onClick={() => signIn(provider)}
          >
            {pending === provider ? <Spinner /> : <Icon className="size-4" />}
            Continue with {label}
          </Button>
        );
      })}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      or
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  );
}
