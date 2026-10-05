import { accessRequestSchema, unlockScreen } from "@/server/screen-access";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * The app's lock of a screen: the password typed on the phone, checked like on a wall display and
 * with the same limit on attempts. The proof it returns opens the screen from then on, sent as
 * `X-Screen-Access`; `null` when the screen no longer asks for a password.
 */
export async function POST(request: Request, context: RouteContext<"/api/screens/[token]/access">) {
  const { token } = await context.params;
  const parsed = accessRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Type the screen's password." },
      { status: 400, headers: NO_STORE },
    );
  }

  const result = await unlockScreen(token, parsed.data.password, request.headers);
  switch (result.outcome) {
    case "unlocked":
      return Response.json({ proof: result.cookie?.value ?? null }, { headers: NO_STORE });
    case "wrong-password":
      return Response.json({ error: result.outcome }, { status: 401, headers: NO_STORE });
    case "too-many-attempts":
      return Response.json({ error: result.outcome }, { status: 429, headers: NO_STORE });
    case "gone":
      return Response.json(
        { error: "This screen does not exist." },
        { status: 404, headers: NO_STORE },
      );
  }
}
