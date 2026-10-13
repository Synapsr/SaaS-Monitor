#if DEBUG
  import Foundation

  /// Holds the notch in one of its looks, with a sample screen, for development and screenshots:
  /// launch a debug build with `-NotchPreview compact|moment|milestone|loss|expanded`.
  @MainActor
  struct NotchPreview {
    let presentation: NotchPresentation
    let moment: Moment?

    init?(arguments: UserDefaults) {
      let sample = DisplayState.sample(name: "Acme")
      switch arguments.string(forKey: "NotchPreview") {
      case "compact":
        presentation = .compact
        moment = nil
      case "moment":
        presentation = .moment
        moment = sample.feed.first.map(Moment.payment)
      case "milestone":
        presentation = .moment
        moment = .milestone(amount: 15_000_00, metric: .mrr, isGoal: true)
      case "loss":
        presentation = .moment
        moment = sample.feed.first { $0.kind == .churn }.map(Moment.movement)
      case "expanded":
        presentation = .expanded
        moment = nil
      default:
        return nil
      }
    }

    func start(model: NotchModel, stage: MomentStage) {
      model.preview = presentation
      guard let moment else { return }
      let state = DisplayState.sample(name: "Acme")
      let screen = SharedScreen(ScreenLink.demo, name: "Acme", accessProof: nil)
      // Again and again, under new ids, so that it stays on stage.
      Task {
        var round = 0
        while true {
          stage.enqueue([moment.renamed(round)], state: state, screen: screen)
          round += 1
          try? await Task.sleep(for: .seconds(MomentStage.longest - 0.5))
        }
      }
    }
  }

  private extension Moment {
    func renamed(_ round: Int) -> Moment {
      switch self {
      case .milestone(let amount, let metric, let isGoal): .milestone(amount: amount + round, metric: metric, isGoal: isGoal)
      default: self.withId("\(id):\(round)")
      }
    }

    func withId(_ id: String) -> Moment {
      switch self {
      case .payment(let item): .payment(item.withId(id))
      case .movement(let item): .movement(item.withId(id))
      case .customer(let item): .customer(item.withId(id))
      default: self
      }
    }
  }

  private extension FeedItem {
    func withId(_ id: String) -> FeedItem {
      FeedItem(
        id: id, kind: kind, amount: amount, occurredAt: occurredAt, live: live, customerKey: customerKey,
        customerName: customerName, customerEmail: customerEmail, country: country, planName: planName,
        connect: connect, customerSubscribed: customerSubscribed, churn: churn, accountId: accountId,
        accountName: accountName)
    }
  }
#endif
