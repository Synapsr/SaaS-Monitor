import { describe, expect, it } from "vitest";
import { canManageMembers, parseRole } from "./roles";

describe("workspace roles", () => {
  it("keeps the highest of several roles", () => {
    expect(parseRole("member, admin")).toBe("admin");
    expect(parseRole("admin,owner")).toBe("owner");
    expect(parseRole("member")).toBe("member");
  });

  it("treats unknown or missing roles as members", () => {
    expect(parseRole("viewer")).toBe("member");
    expect(parseRole(null)).toBe("member");
  });

  it("lets owners and admins manage people", () => {
    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("admin")).toBe(true);
    expect(canManageMembers("member")).toBe(false);
  });
});
