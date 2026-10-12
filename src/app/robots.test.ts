import { describe, expect, it } from "vitest";
import robots from "./robots";

/**
 * Whether a crawler may fetch `path`, the way Googlebot and Twitterbot read robots.txt: the
 * longest matching rule wins, and `allow` wins a tie.
 */
function allowed(path: string): boolean {
  const rules = [robots().rules].flat();
  const matches = rules.flatMap((rule) => [
    ...[rule.allow ?? []].flat().map((prefix) => ({ prefix, allow: true })),
    ...[rule.disallow ?? []].flat().map((prefix) => ({ prefix, allow: false })),
  ]);
  const best = matches
    .filter(({ prefix }) => path.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length || Number(b.allow) - Number(a.allow))[0];
  return best?.allow ?? true;
}

describe("robots.txt", () => {
  it("lets link previews fetch the demo and its card", () => {
    expect(allowed("/d/demo")).toBe(true);
    expect(allowed("/d/demo?theme=light")).toBe(true);
    expect(allowed("/d/demo/opengraph-image")).toBe(true);
  });

  it("keeps screens, the dashboard, the API and invitations out", () => {
    expect(allowed("/d/XapH5XoXZZHz99D5uxBvy8EOU_66Z1bS")).toBe(false);
    expect(allowed("/app/screens")).toBe(false);
    expect(allowed("/api/screens/token/state")).toBe(false);
    expect(allowed("/invite/abc")).toBe(false);
    expect(allowed("/")).toBe(true);
  });
});
