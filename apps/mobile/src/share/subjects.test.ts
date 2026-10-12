import {
  itemMoment,
  momentSubject,
  namesCustomers,
  shareChoices,
  shareDay,
  sharedFeed,
  shareFileName,
  shareSource,
  subjectKey,
  subjectLabel,
} from "@/share/subjects";
import { displayState, feedItem } from "@/test/display";

describe("shareChoices", () => {
  it("offers the parts of the screen, the pressed one among them", () => {
    expect(shareChoices({ kind: "hero" }).map(subjectKey)).toEqual(["screen", "hero", "goal", "chart", "tiles", "feed"]);
  });

  it("puts a tile or an event first, before the parts", () => {
    const item = feedItem({ id: "payment:7" });
    expect(shareChoices({ kind: "tile", tile: "today" }).map(subjectKey)[0]).toBe("tile:today");
    expect(shareChoices({ kind: "item", item }).map(subjectKey)).toEqual([
      "item:payment:7",
      "screen",
      "hero",
      "goal",
      "chart",
      "tiles",
      "feed",
    ]);
  });
});

describe("subjectLabel", () => {
  it("names parts in the screen's metric", () => {
    expect(subjectLabel({ kind: "hero" }, "ARR")).toBe("ARR");
    expect(subjectLabel({ kind: "tile", tile: "net" }, "MRR")).toBe("Net new MRR");
    expect(subjectLabel({ kind: "tile", tile: "today" }, "MRR")).toBe("Revenue today");
  });

  it("names an event by its kind", () => {
    expect(subjectLabel({ kind: "item", item: feedItem() }, "MRR")).toBe("Payment");
    expect(subjectLabel({ kind: "item", item: feedItem({ kind: "new", id: "movement:1" }) }, "MRR")).toBe("New subscription");
  });
});

describe("shareFileName", () => {
  it("names the screen, the part and the day", () => {
    expect(shareFileName("Office", { kind: "hero" }, "MRR", "2026-10-12")).toBe("Office – MRR – 2026-10-12.png");
    expect(shareFileName("Office", { kind: "screen" }, "MRR", "2026-10-12")).toBe("Office – 2026-10-12.png");
  });

  it("leaves out what file systems refuse", () => {
    expect(shareFileName('Acme / EU: "Pro"', { kind: "goal" }, "MRR", "2026-10-12")).toBe("Acme EU Pro – Goal – 2026-10-12.png");
    expect(shareFileName("  ", { kind: "screen" }, "MRR", "2026-10-12")).toBe("SaaS Monitor – 2026-10-12.png");
  });
});

describe("shareDay", () => {
  it("is the screen's day", () => {
    const at = Date.parse("2026-10-12T23:30:00Z");
    expect(shareDay(at, "Europe/Paris")).toBe("2026-10-13");
    expect(shareDay(at, "America/New_York")).toBe("2026-10-12");
  });
});

describe("customer names", () => {
  const named = feedItem({ id: "payment:1", customerName: "Jane Doe" });
  const masked = feedItem({ id: "payment:2", customerEmail: "j•••@gmail.com" });
  const unnamed = feedItem({ id: "payment:3" });
  const state = displayState({ feed: [unnamed, named, masked], warnings: [{ kind: "unconverted-currency", currency: "jpy" }] });

  it("only matter to images that list events", () => {
    expect(namesCustomers({ kind: "feed" }, state.feed)).toBe(true);
    expect(namesCustomers({ kind: "screen" }, state.feed)).toBe(true);
    expect(namesCustomers({ kind: "hero" }, state.feed)).toBe(false);
    expect(namesCustomers({ kind: "item", item: unnamed }, state.feed)).toBe(false);
    expect(namesCustomers({ kind: "item", item: masked }, state.feed)).toBe(true);
  });

  it("are left out unless asked for, and warnings always", () => {
    const hidden = shareSource(state, { kind: "item", item: named }, { customerNames: false });
    expect(hidden.state.feed.map((item) => item.customerName ?? item.customerEmail)).toEqual([null, null, null]);
    expect(hidden.subject).toMatchObject({ item: { customerName: null } });
    expect(hidden.state.warnings).toEqual([]);

    const shown = shareSource(state, { kind: "item", item: named }, { customerNames: true });
    expect(shown.state.feed).toBe(state.feed);
    expect(shown.subject).toMatchObject({ item: { customerName: "Jane Doe" } });
    expect(shown.state.warnings).toEqual([]);
  });

  it("only list the latest events", () => {
    const feed = Array.from({ length: 10 }, (_, index) => feedItem({ id: `payment:${index}` }));
    expect(sharedFeed({ kind: "screen" }, feed)).toHaveLength(4);
    expect(sharedFeed({ kind: "feed" }, feed)).toHaveLength(6);
    expect(sharedFeed({ kind: "chart" }, feed)).toEqual([]);
  });
});

describe("moments", () => {
  it("are shared as their event or their milestone", () => {
    const payment = feedItem();
    expect(momentSubject({ id: "m", kind: "payment", payment })).toEqual({ kind: "item", item: payment });
    expect(momentSubject({ id: "m", kind: "milestone", amount: 1_000_000, metric: "mrr", isGoal: false, accountId: null })).toEqual({
      kind: "milestone",
      amount: 1_000_000,
      metric: "mrr",
      isGoal: false,
      accountId: null,
    });
    expect(momentSubject({ id: "m", kind: "test" })).toBeNull();
  });

  it("are drawn back from an event", () => {
    const movement = feedItem({ id: "movement:3", kind: "churn", amount: -4_900 });
    expect(itemMoment(movement)).toEqual({ id: "movement:3", kind: "movement", movement });
    expect(itemMoment(feedItem({ id: "customer:1", kind: "customer" }))).toMatchObject({ kind: "customer" });
  });
});
