import {
  deviceRegistrationSchema,
  deviceRemovalSchema,
  registerDevice,
  unregisterDevice,
} from "@/server/push/devices";

const NO_STORE = { "Cache-Control": "no-store" };

const FAILURES = {
  gone: [404, "This screen does not exist."],
  locked: [401, "This screen asks for its password."],
  "too-many-registrations": [429, "Too many registrations. Try again later."],
} as const;

/**
 * Called by the SaaS Monitor app at every launch: the phone gets the notifications of the screen
 * (`settings.events`, column "Phone"), until it says otherwise or the screen's link changes.
 */
export async function PUT(request: Request, context: RouteContext<"/api/screens/[token]/devices">) {
  const { token } = await context.params;
  const parsed = deviceRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid device." }, { status: 400, headers: NO_STORE });
  }

  const result = await registerDevice(token, parsed.data, request.headers);
  if (result === "registered") return Response.json({ ok: true }, { headers: NO_STORE });
  const [status, error] = FAILURES[result];
  return Response.json({ error }, { status, headers: NO_STORE });
}

/** The phone stops following the screen: the app removed it, or notifications were turned off. */
export async function DELETE(
  request: Request,
  context: RouteContext<"/api/screens/[token]/devices">,
) {
  const { token } = await context.params;
  const parsed = deviceRemovalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid device." }, { status: 400, headers: NO_STORE });
  }

  if ((await unregisterDevice(token, parsed.data.installationId)) === "gone") {
    const [status, error] = FAILURES.gone;
    return Response.json({ error }, { status, headers: NO_STORE });
  }
  return new Response(null, { status: 204, headers: NO_STORE });
}
