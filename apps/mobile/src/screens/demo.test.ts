import { demoLink, HOSTED_DEMO, isDemoScreen } from "@/screens/demo";
import { parseScreenLink } from "@/screens/link";

describe("demoLink", () => {
  it("is the hosted instance's demo screen", () => {
    expect(demoLink(undefined)).toEqual({ baseUrl: "https://saas-monitor.com", token: "demo" });
  });

  it("may come from another instance, to try the web locally", () => {
    expect(demoLink("http://localhost:3600/d/demo")).toEqual({
      baseUrl: "http://localhost:3600",
      token: "demo",
    });
  });

  it("stays the hosted one when the override is no demo link", () => {
    expect(demoLink("")).toEqual(HOSTED_DEMO);
    expect(demoLink("http://localhost:3600/d/Zk3n0_2bQ-xY7pLmR4sT9vWcA1dE6fGh")).toEqual(HOSTED_DEMO);
    expect(demoLink("not a link")).toEqual(HOSTED_DEMO);
  });
});

describe("isDemoScreen", () => {
  it("recognizes the demo screen of any instance, as a screen like the others", () => {
    expect(isDemoScreen(parseScreenLink("https://saas-monitor.com/d/demo?theme=light")!)).toBe(true);
    expect(isDemoScreen(parseScreenLink("http://192.168.1.20:3000/d/demo")!)).toBe(true);
  });

  it("leaves real screens alone", () => {
    expect(isDemoScreen({ token: "Zk3n0_2bQ-xY7pLmR4sT9vWcA1dE6fGh" })).toBe(false);
    expect(isDemoScreen({ token: "Demo" })).toBe(false);
  });
});
