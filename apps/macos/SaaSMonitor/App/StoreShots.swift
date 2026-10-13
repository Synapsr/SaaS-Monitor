#if DEBUG
  import AppKit
  import SwiftUI

  /// The notch's looks with a sample screen, as still pictures for the Mac App Store: launch a
  /// debug build with `-RenderStoreShots YES`. Transparent PNGs at 4x, in the app's temporary
  /// folder (sandboxed, it writes nowhere else), whose path it prints.
  @MainActor
  enum StoreShots {
    static func render() {
      let state = DisplayState.sample(name: "Acme")
      let screen = SharedScreen(
        key: "store-shots", name: "Acme", baseUrl: "https://saas-monitor.com", token: "demo", accessProof: nil)
      let library = ScreenLibrary(previewing: [screen])
      let monitor = ScreenMonitor(library: library)
      monitor.show(state, of: screen)
      let stage = MomentStage()
      // A 14-inch MacBook Pro's notch.
      let layout = NotchLayout(notch: CGSize(width: 190, height: 32), hasNotch: true)
      let model = NotchModel(
        layout: layout, library: library, monitor: monitor, stage: stage, preferences: Preferences())

      let payment = state.feed.first { $0.kind == .payment }
      let subscriber = state.feed.first { $0.kind == .new }
      let looks: [(name: String, presentation: NotchPresentation, moment: Moment?)] = [
        ("compact", .compact, nil),
        ("payment", .moment, payment.map(Moment.payment)),
        ("subscriber", .moment, subscriber.map(Moment.movement)),
        ("goal", .moment, .milestone(amount: 15_000_00, metric: .mrr, isGoal: true)),
        ("expanded", .expanded, nil),
      ]

      let folder = URL.temporaryDirectory.appending(path: "StoreShots", directoryHint: .isDirectory)
      try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
      for look in looks {
        stage.hold(
          look.moment.map { moment in
            StagedMoment(
              card: MomentCard(moment, state: state), screen: screen, audio: nil, celebration: Celebration(moment),
              seconds: MomentStage.longest)
          })
        model.preview = look.presentation
        let view = NotchView(model: model)
          .frame(width: layout.canvas.width, height: layout.canvas.height)
          .environment(\.isStillRender, true)
        let renderer = ImageRenderer(content: view)
        renderer.scale = 4
        renderer.isOpaque = false
        guard let image = renderer.cgImage,
          let png = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])
        else { continue }
        try? png.write(to: folder.appending(path: "\(look.name).png"))
      }
      print("Store shots: \(folder.path)")
    }
  }
#endif
