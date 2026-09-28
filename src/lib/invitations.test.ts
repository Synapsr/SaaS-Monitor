import { describe, expect, it } from "vitest";
import { invitationIdFromPath, invitationPath } from "./invitations";

describe("invitation links", () => {
  it("reads the invitation a path opens", () => {
    expect(invitationIdFromPath(invitationPath("inv_4f2a"))).toBe("inv_4f2a");
    expect(invitationIdFromPath(invitationPath("a/b c"))).toBe("a/b c");
  });

  it("ignores other paths and malformed escapes", () => {
    expect(invitationIdFromPath("/app")).toBeNull();
    expect(invitationIdFromPath("/invite/")).toBeNull();
    expect(invitationIdFromPath("/invite/inv_4f2a/accept")).toBeNull();
    expect(invitationIdFromPath("/invite/%E0%A4%A")).toBeNull();
  });
});
