import Testing

@testable import SaaSMonitor

/// The same links as the iPhone app's (`src/screens/link.test.ts`).
struct ScreenLinkTests {
  @Test func readsALink() throws {
    let link = try #require(ScreenLink("https://saas-monitor.com/d/abc123_-XYZ"))
    #expect(link.baseUrl == "https://saas-monitor.com")
    #expect(link.token == "abc123_-XYZ")
    #expect(link.url?.absoluteString == "https://saas-monitor.com/d/abc123_-XYZ")
  }

  @Test func readsALinkInASentenceWithItsQuery() throws {
    let link = try #require(ScreenLink("Open https://Saas-Monitor.com/d/demo?lang=fr on your phone"))
    #expect(link == .demo)
  }

  @Test func addsTheScheme() {
    #expect(ScreenLink("saas-monitor.com/d/demo") == .demo)
  }

  @Test func keepsASubPath() {
    #expect(ScreenLink("https://acme.dev/monitor/d/token1234")?.baseUrl == "https://acme.dev/monitor")
  }

  @Test func keepsPlainHttpOnTheLocalNetworkOnly() {
    #expect(ScreenLink("http://192.168.1.20:3000/d/token1234")?.baseUrl == "http://192.168.1.20:3000")
    #expect(ScreenLink("http://localhost:3000/d/token1234")?.baseUrl == "http://localhost:3000")
    #expect(ScreenLink("http://studio.local/d/token1234")?.baseUrl == "http://studio.local")
    #expect(ScreenLink("http://acme.dev/d/token1234")?.baseUrl == "https://acme.dev")
  }

  @Test(arguments: [
    "", "hello", "https://saas-monitor.com", "https://saas-monitor.com/d/", "https://saas-monitor.com/d/ab",
    "https://saas-monitor.com/d/token1234/extra", "https://saas-monitor.com/x/token1234", "ftp://x.dev/d/token1234",
  ])
  func refusesWhatIsNotAScreenLink(_ input: String) {
    #expect(ScreenLink(input) == nil)
  }

  @Test func namesAScreenWithoutItsToken() {
    // The first 16 hex characters of `sha256("demo")`.
    #expect(ScreenLink.demo.key == "2a97516c354b6884")
  }

  @Test func labelsItsInstance() {
    #expect(ScreenLink("https://acme.dev/monitor/d/token1234")?.instanceLabel == "acme.dev/monitor")
    #expect(ScreenLink("http://localhost:3000/d/token1234")?.instanceLabel == "http://localhost:3000")
  }
}
