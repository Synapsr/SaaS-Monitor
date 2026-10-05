import { describe, expect, it } from "vitest";
import type { Device } from "./devices";
import {
  deliveries,
  MAX_PUSHES_PER_PHONE,
  momentData,
  type Notice,
  type ScreenNotices,
} from "./messages";

const notice = (key: string, overrides: Partial<Notice> = {}): Notice => ({
  key,
  screen: "0123456789abcdef",
  events: ["payment"],
  title: "Payment received",
  body: key,
  ...overrides,
});

const device = (overrides: Partial<Device> = {}): Device => ({
  installationId: crypto.randomUUID(),
  platform: "ios",
  pushToken: "ExponentPushToken[phone]",
  deviceToken: null,
  apnsEnvironment: null,
  enabled: true,
  mutedEvents: [],
  ...overrides,
});

function screen(overrides: Partial<ScreenNotices> = {}): ScreenNotices {
  return {
    devices: [device()],
    moments: [notice("payment:1")],
    summary: notice("summary", { title: "Catching up", events: ["payment", "customer"] }),
    milestones: [],
    ...overrides,
  };
}

const bodies = (screens: ScreenNotices[]) =>
  deliveries(screens).map(({ notice: { body } }) => body);

describe("deliveries", () => {
  it("address each notice to each phone of the screen", () => {
    const phones = [device({ pushToken: "ExponentPushToken[a]" }), device({ deviceToken: "ab" })];
    const sent = deliveries([screen({ devices: phones })]);

    expect(sent.map(({ device: { pushToken, deviceToken } }) => pushToken ?? deviceToken)).toEqual([
      "ExponentPushToken[a]",
      "ExponentPushToken[phone]",
    ]);
    expect(momentData(sent[0].notice)).toEqual({
      type: "moment",
      screen: "0123456789abcdef",
      event: "payment",
    });
  });

  it("tell a phone following two screens of the same account once", () => {
    const sent = deliveries([
      screen({ moments: [notice("payment:1"), notice("movement:1")] }),
      screen({ moments: [notice("payment:1", { screen: "fedcba9876543210" })] }),
    ]);

    expect(sent.map(({ notice: { body } }) => body)).toEqual(["payment:1", "movement:1"]);
    expect(sent[0].notice.screen).toBe("0123456789abcdef");
  });

  it("know a phone by its native token, whichever installation registered it", () => {
    const native = { deviceToken: "a1b2c3", pushToken: null };
    const sent = deliveries([
      screen({ devices: [device(native)] }),
      // The app was reinstalled: a new installation, the same phone.
      screen({ devices: [device({ ...native, pushToken: "ExponentPushToken[new]" })] }),
    ]);
    expect(sent).toHaveLength(1);
  });

  it("send nothing to a phone that turned the screen off", () => {
    expect(bodies([screen({ devices: [device({ enabled: false })] })])).toEqual([]);
  });

  it("leave out the events a phone muted, on top of the screen's choices", () => {
    const moments = [
      notice("payment:1"),
      notice("customer:1", { events: ["customer"] }),
      notice("movement:1", { events: ["subscription"] }),
    ];
    const muted = device({ mutedEvents: ["customer", "subscription"] });

    expect(bodies([screen({ moments, devices: [muted] })])).toEqual(["payment:1"]);
  });

  it("sum up a burst in a single notification per phone, milestones apart", () => {
    const burst = Array.from({ length: MAX_PUSHES_PER_PHONE + 1 }, (_, index) =>
      notice(`payment:${index}`),
    );
    const milestone = notice("milestone", { events: ["milestone"], title: "🎉 New milestone" });
    const sent = deliveries([screen({ moments: burst, milestones: [milestone] })]);

    expect(sent.map(({ notice: { title } }) => title)).toEqual(["Catching up", "🎉 New milestone"]);
  });

  it("sum up a burst for the phones that want one of its events", () => {
    const summary = notice("summary", { title: "Catching up", events: ["payment", "customer"] });
    const phones = [
      device({ pushToken: "ExponentPushToken[all]" }),
      device({ pushToken: "ExponentPushToken[payments]", mutedEvents: ["customer"] }),
      device({ pushToken: "ExponentPushToken[none]", mutedEvents: ["customer", "payment"] }),
    ];

    const sent = deliveries([screen({ moments: [summary], summary, devices: phones })]);

    expect(sent.map(({ device: { pushToken } }) => pushToken)).toEqual([
      "ExponentPushToken[all]",
      "ExponentPushToken[payments]",
    ]);
  });

  it("tell a phone that muted most of a burst what it wants, one by one", () => {
    const moments = [
      notice("payment:1"),
      ...Array.from({ length: MAX_PUSHES_PER_PHONE }, (_, index) =>
        notice(`customer:${index}`, { events: ["customer"] }),
      ),
    ];
    const muted = device({ mutedEvents: ["customer"] });
    expect(bodies([screen({ moments, devices: [muted] })])).toEqual(["payment:1"]);
  });

  it("let a few moments through, one by one", () => {
    const few = Array.from({ length: MAX_PUSHES_PER_PHONE }, (_, index) =>
      notice(`payment:${index}`),
    );
    expect(deliveries([screen({ moments: few })])).toHaveLength(MAX_PUSHES_PER_PHONE);
  });
});
