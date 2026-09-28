"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { reimportAccountAction } from "@/app/app/accounts/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Retry for a failed import: nothing is lost, the import simply starts over. */
export function ReimportButton({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      className="self-start"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await reimportAccountAction(accountId);
          if (result.ok) toast.success("Import started.");
          else toast.error(result.error);
        })
      }
    >
      {pending ? <Spinner /> : <RotateCcwIcon data-icon="inline-start" />}
      Re-import
    </Button>
  );
}
