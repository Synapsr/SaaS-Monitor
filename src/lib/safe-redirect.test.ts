import { describe, expect, it } from "vitest";
import { safeRedirectPath, withRedirect } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps local paths with their query and hash", () => {
    expect(safeRedirectPath("/app/screens")).toBe("/app/screens");
    expect(safeRedirectPath("/invite/abc?from=link#join")).toBe("/invite/abc?from=link#join");
  });

  it.each([
    "https://evil.example/app",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "javascript:alert(1)",
    "app/screens",
    "",
  ])("refuses %j", (value) => {
    expect(safeRedirectPath(value)).toBe("/app");
  });

  it("falls back for missing or repeated parameters", () => {
    expect(safeRedirectPath(undefined)).toBe("/app");
    expect(safeRedirectPath(["/app", "/evil"])).toBe("/app");
    expect(safeRedirectPath(null, "/sign-in")).toBe("/sign-in");
  });
});

describe("withRedirect", () => {
  it("only adds the destination when it is not the default one", () => {
    expect(withRedirect("/sign-up", "/app")).toBe("/sign-up");
    expect(withRedirect("/sign-up", "/invite/abc")).toBe("/sign-up?next=%2Finvite%2Fabc");
  });
});
