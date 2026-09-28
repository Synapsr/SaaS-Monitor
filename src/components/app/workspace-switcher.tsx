"use client";

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { switchWorkspaceAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

interface WorkspaceOption {
  id: string;
  name: string;
}

/** Only rendered for people who belong to several workspaces. */
export function WorkspaceSwitcher({
  current,
  workspaces,
}: {
  current: WorkspaceOption;
  workspaces: WorkspaceOption[];
}) {
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  function select(workspaceId: string) {
    if (workspaceId === current.id) return;
    startTransition(async () => {
      const result = await switchWorkspaceAction(workspaceId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="max-w-56 min-w-0 gap-1.5 px-2 font-medium">
            <WorkspaceInitial name={current.name} />
            <span className="truncate">{current.name}</span>
            {pending ? (
              <Spinner className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem key={workspace.id} onSelect={() => select(workspace.id)}>
                <WorkspaceInitial name={workspace.name} />
                <span className="truncate">{workspace.name}</span>
                {workspace.id === current.id && <CheckIcon className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <PlusIcon />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateWorkspaceDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function WorkspaceInitial({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground text-[0.65rem] font-semibold text-background uppercase"
    >
      {name.trim().charAt(0) || "W"}
    </span>
  );
}
