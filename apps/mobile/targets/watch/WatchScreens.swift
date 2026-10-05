import Observation

/// The screens of the iPhone app, kept on the watch for its complications and for when the iPhone
/// is away.
@MainActor
@Observable
final class WatchScreens {
  private(set) var screens = ScreenStore.screens()
  @ObservationIgnored private var link: PhoneLink?

  init() {
    let link = PhoneLink { [weak self] screens in
      Task { @MainActor in self?.screens = screens }
    }
    link.activate()
    self.link = link
  }

  func screen(key: String) -> SharedScreen? {
    screens.first { $0.key == key }
  }
}
