import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

const url = (path: string) => `http://localhost:3000/api/auth${path}`;

describe("auth endpoints", () => {
  it.each([
    "/organization/list-invitations",
    "/organization/accept-invitation",
    "/organization/update",
    "/update-user",
    "/change-password",
    "/sign-in/email/../../organization/list-members",
  ])("keeps %s closed to the browser", async (path) => {
    const response = await POST(new Request(url(path), { method: "POST" }));
    expect(response.status).toBe(404);
  });

  it("serves the endpoints the browser uses", async () => {
    const response = await GET(new Request(url("/get-session")));
    expect(response.status).toBe(200);
  });
});
