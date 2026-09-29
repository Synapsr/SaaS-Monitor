import { announcementRequestSchema } from "@/lib/voice/request";
import { screenAnnouncement } from "@/server/voice/announcements";

const NO_STORE = { "Cache-Control": "no-store" };

const FAILURES = {
  gone: [404, "This screen does not exist."],
  locked: [401, "This screen asks for its password."],
  unavailable: [409, "This screen says recorded phrases."],
  "unknown-moment": [404, "This moment is not on the screen."],
  "too-many": [429, "Too many announcements. The screen says recorded phrases for now."],
  failed: [502, "The voice could not be synthesized."],
} as const;

/**
 * Asked by a display when a moment starts, on a screen that says its own phrases: the audio of
 * what its voice says. On any failure, the display says the recorded phrase instead.
 */
export async function POST(
  request: Request,
  context: RouteContext<"/api/screens/[token]/announcement">,
) {
  const { token } = await context.params;
  const parsed = announcementRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid announcement." }, { status: 400, headers: NO_STORE });
  }

  const result = await screenAnnouncement(token, parsed.data, request.headers);
  if (result.outcome === "speech") {
    const { audio, contentType } = result.speech;
    return new Response(audio, { headers: { ...NO_STORE, "Content-Type": contentType } });
  }
  const [status, error] = FAILURES[result.outcome];
  return Response.json({ error }, { status, headers: NO_STORE });
}
