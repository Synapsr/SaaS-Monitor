import { instanceLabel, parseScreenLink, screenUrl } from "@/screens/link";

const TOKEN = "Zk3n0_2bQ-xY7pLmR4sT9vWcA1dE6fGh";

describe("parseScreenLink", () => {
  it("reads a link of the hosted instance", () => {
    expect(parseScreenLink(`https://saas-monitor.com/d/${TOKEN}`)).toEqual({
      baseUrl: "https://saas-monitor.com",
      token: TOKEN,
    });
  });

  it("keeps the sub-path of an instance", () => {
    expect(parseScreenLink(`https://acme.dev/tools/monitor/d/${TOKEN}/`)).toEqual({
      baseUrl: "https://acme.dev/tools/monitor",
      token: TOKEN,
    });
  });

  it("reads a local instance with its port", () => {
    expect(parseScreenLink(`http://192.168.1.20:3000/d/${TOKEN}`)).toEqual({
      baseUrl: "http://192.168.1.20:3000",
      token: TOKEN,
    });
  });

  it("keeps plain HTTP on a local network", () => {
    for (const origin of [
      "http://localhost:3000",
      "http://raspberrypi:3000",
      "http://monitor.local",
      "http://10.0.2.2:3300",
      "http://[fe80::1]:3000",
    ]) {
      expect(parseScreenLink(`${origin}/d/${TOKEN}`)?.baseUrl).toBe(origin);
    }
  });

  it("reaches an instance on the internet over HTTPS, whatever its link says", () => {
    expect(parseScreenLink(`http://saas-monitor.com/d/${TOKEN}`)?.baseUrl).toBe(
      "https://saas-monitor.com",
    );
    expect(parseScreenLink(`http://monitor.acme.dev:8080/tools/d/${TOKEN}`)?.baseUrl).toBe(
      "https://monitor.acme.dev:8080/tools",
    );
  });

  it("leaves out the query, the fragment and the user info", () => {
    expect(parseScreenLink(`https://me@Saas-Monitor.com/d/${TOKEN}?preview=1#top`)).toEqual({
      baseUrl: "https://saas-monitor.com",
      token: TOKEN,
    });
  });

  it("finds a link inside a sentence, or without its scheme", () => {
    expect(parseScreenLink(`Open https://saas-monitor.com/d/${TOKEN} on your phone`)?.token).toBe(
      TOKEN,
    );
    expect(parseScreenLink(`  saas-monitor.com/d/${TOKEN}\n`)?.baseUrl).toBe(
      "https://saas-monitor.com",
    );
  });

  it("takes the last `d` segment, as a sub-path may hold one", () => {
    expect(parseScreenLink(`https://acme.dev/d/x/d/${TOKEN}`)).toEqual({
      baseUrl: "https://acme.dev/d/x",
      token: TOKEN,
    });
  });

  it("recognizes the demo screen", () => {
    expect(parseScreenLink("https://saas-monitor.com/d/demo?theme=light")?.token).toBe("demo");
  });

  it("refuses anything else", () => {
    for (const input of [
      "",
      "hello",
      "https://saas-monitor.com",
      "https://saas-monitor.com/app/screens",
      `https://saas-monitor.com/d/${TOKEN}/edit`,
      `ftp://saas-monitor.com/d/${TOKEN}`,
      "https://saas-monitor.com/d/not a token",
      "https://saas-monitor.com/d/%E0%A4%A",
      `https://exa mple.com/d/${TOKEN}`,
    ]) {
      expect(parseScreenLink(input)).toBeNull();
    }
  });
});

describe("screenUrl", () => {
  it("writes the link back", () => {
    const link = { baseUrl: "https://acme.dev/monitor", token: TOKEN };
    expect(screenUrl(link)).toBe(`https://acme.dev/monitor/d/${TOKEN}`);
    expect(parseScreenLink(screenUrl(link))).toEqual(link);
  });
});

describe("instanceLabel", () => {
  it("drops https, keeps another scheme", () => {
    expect(instanceLabel("https://acme.dev/monitor")).toBe("acme.dev/monitor");
    expect(instanceLabel("http://pi.local:3000")).toBe("http://pi.local:3000");
  });
});
