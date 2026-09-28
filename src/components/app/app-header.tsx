import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { siteConfig } from "@/lib/site";
import type { WorkspaceContext } from "@/server/session";
import type { UserWorkspace } from "@/server/workspace-admin";
import { AppNav } from "./app-nav";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function AppHeader({
  user,
  workspace,
  workspaces,
}: {
  user: WorkspaceContext["user"];
  workspace: WorkspaceContext["workspace"];
  workspaces: UserWorkspace[];
}) {
  const hasSeveralWorkspaces = workspaces.length > 1;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/app"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <LogoMark />
          <span
            className={
              hasSeveralWorkspaces
                ? "hidden font-semibold tracking-tight sm:inline"
                : "font-semibold tracking-tight"
            }
          >
            {siteConfig.name}
          </span>
        </Link>
        {hasSeveralWorkspaces && (
          <>
            <span aria-hidden="true" className="text-lg text-border select-none">
              /
            </span>
            <WorkspaceSwitcher current={workspace} workspaces={workspaces} />
          </>
        )}
        <div className="ml-auto">
          <UserMenu user={user} showCreateWorkspace={!hasSeveralWorkspaces} />
        </div>
      </div>
      <AppNav />
    </header>
  );
}
