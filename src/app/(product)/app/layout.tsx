import { AppHeader } from "@/components/app/app-header";
import { StarPrompt } from "@/components/app/star-prompt";
import { requireWorkspace } from "@/server/session";
import { asksForStar } from "@/server/star-prompt";
import { listUserWorkspaces } from "@/server/workspace-admin";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { user, workspace } = await requireWorkspace();
  const [workspaces, askForStar] = await Promise.all([
    listUserWorkspaces(user.id),
    asksForStar(workspace.id),
  ]);

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader user={user} workspace={workspace} workspaces={workspaces} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-20 sm:px-6 lg:pt-10">
        {children}
      </main>
      {askForStar && <StarPrompt />}
    </div>
  );
}
