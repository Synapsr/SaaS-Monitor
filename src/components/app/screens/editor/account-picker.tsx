"use client";

import { CircleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { ModeBadge } from "@/components/app/accounts/account-status";
import { Checkbox } from "@/components/ui/checkbox";
import type { AccountOption } from "@/server/screens";

/** Which Stripe accounts the screen adds up. */
export function AccountPicker({
  accounts,
  selected,
  onChange,
}: {
  accounts: AccountOption[];
  selected: string[];
  onChange: (accountIds: string[]) => void;
}) {
  const id = useId();

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No Stripe account yet.{" "}
        <Link
          href="/app/accounts/new"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Connect one
        </Link>{" "}
        to fill the screen.
      </p>
    );
  }

  const chosen = accounts.filter((account) => selected.includes(account.id));
  const mixesModes = new Set(chosen.map((account) => account.livemode)).size > 1;

  function toggle(accountId: string, checked: boolean) {
    // Keep the order of the list, whatever the order of the clicks.
    onChange(
      accounts
        .map((account) => account.id)
        .filter((candidate) => (candidate === accountId ? checked : selected.includes(candidate))),
    );
  }

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-2">
      <p id={`${id}-label`} className="text-sm font-medium">
        Stripe accounts
      </p>
      <ul className="flex flex-col divide-y rounded-lg ring-1 ring-border">
        {accounts.map((account) => (
          <li key={account.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50">
              <Checkbox
                checked={selected.includes(account.id)}
                onCheckedChange={(checked) => toggle(account.id, checked === true)}
              />
              <span className="min-w-0 flex-1 truncate">{account.name}</span>
              <ModeBadge livemode={account.livemode} />
            </label>
          </li>
        ))}
      </ul>
      {chosen.length === 0 && (
        <p className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
          <CircleAlertIcon className="size-4 shrink-0" />
          Pick at least one account, or the screen stays empty.
        </p>
      )}
      {mixesModes && (
        <p className="text-sm text-pretty text-muted-foreground">
          Test mode data is added to your live numbers on this screen.
        </p>
      )}
    </div>
  );
}
