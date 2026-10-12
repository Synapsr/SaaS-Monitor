import AppKit
import SwiftUI

/// Adds a screen from its link, as the iPhone app does: pasted (or found on the clipboard), its
/// password if it has one. The first time, offers to open the app at login.
struct AddScreenView: View {
  let library: ScreenLibrary
  let preferences: Preferences
  /// A screen to add again, e.g. one whose password changed.
  let link: ScreenLink?
  let onAdded: (SharedScreen) -> Void
  let onCancel: () -> Void

  @State private var text = ""
  @State private var password = ""
  @State private var asksPassword = false
  @State private var problem: String?
  @State private var adding = false
  @State private var opensAtLogin = true
  @FocusState private var focus: Field?

  private enum Field {
    case link, password
  }

  /// Before any screen, the app is set up: its login item comes with the first one.
  private var isFirst: Bool { library.screens.isEmpty }

  var body: some View {
    VStack(alignment: .leading, spacing: 18) {
      HStack(alignment: .top, spacing: 14) {
        PulseMark()
          .stroke(ScreenStyle.notch.glow, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
          .frame(width: 30, height: 22)
          .frame(width: 48, height: 48)
          .background(Color(hex: "#0a0a0a"), in: .rect(cornerRadius: 11))
        VStack(alignment: .leading, spacing: 4) {
          Text("Add a screen")
            .font(.title2.weight(.semibold))
          Text("Paste the link of a screen: on your SaaS Monitor dashboard, open the screen, then copy its link.")
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)
        }
      }

      VStack(alignment: .leading, spacing: 8) {
        TextField("Link", text: $text, prompt: Text(verbatim: "https://saas-monitor.com/d/…"))
          .textFieldStyle(.roundedBorder)
          .focused($focus, equals: .link)
          .onSubmit { add() }
          .onChange(of: text) {
            problem = nil
            asksPassword = false
          }
        if asksPassword {
          SecureField("Password", text: $password, prompt: Text("The screen’s password"))
            .textFieldStyle(.roundedBorder)
            .focused($focus, equals: .password)
            .onSubmit { add() }
        }
        if let problem {
          Label(problem, systemImage: "exclamationmark.circle.fill")
            .foregroundStyle(.red)
            .font(.callout)
            .fixedSize(horizontal: false, vertical: true)
        }
      }

      if isFirst {
        Toggle("Open SaaS Monitor at login", isOn: $opensAtLogin)
      }

      HStack {
        if link == nil {
          Button("Try the demo") { add(.demo) }
          .disabled(adding)
        }
        Spacer()
        if adding { ProgressView().controlSize(.small) }
        Button("Cancel", role: .cancel, action: onCancel)
          .keyboardShortcut(.cancelAction)
        Button("Add") { add() }
          .keyboardShortcut(.defaultAction)
          .disabled(adding || text.trimmingCharacters(in: .whitespaces).isEmpty)
      }
    }
    .padding(24)
    .frame(width: 480)
    .onAppear(perform: prefill)
  }

  /// The screen to add again, else a screen link copied a moment ago.
  private func prefill() {
    if let link {
      text = link.url?.absoluteString ?? ""
      asksPassword = true
      focus = .password
      return
    }
    if let copied = NSPasteboard.general.string(forType: .string), let link = ScreenLink(copied) {
      text = link.url?.absoluteString ?? copied
    }
    focus = .link
  }

  /// Adds `link`, else the one typed.
  private func add(_ link: ScreenLink? = nil) {
    guard !adding else { return }
    guard let link = link ?? ScreenLink(text) else {
      problem = "This isn’t the link of a screen. It looks like https://saas-monitor.com/d/…"
      return
    }
    adding = true
    problem = nil
    Task {
      defer { adding = false }
      do throws(ScreenAccessError) {
        let (state, proof) = try await ScreenAccess().open(link, password: asksPassword ? password : nil)
        if isFirst { preferences.opensAtLogin = opensAtLogin }
        let screen = SharedScreen(link, name: state.screen.name, accessProof: proof)
        library.add(screen)
        onAdded(screen)
      } catch {
        show(error, link: link)
      }
    }
  }

  private func show(_ error: ScreenAccessError, link: ScreenLink) {
    switch error {
    case .passwordNeeded:
      asksPassword = true
      problem = "This screen has a password."
      focus = .password
    case .wrongPassword:
      problem = "Wrong password."
      focus = .password
    case .tooManyAttempts:
      problem = "Too many attempts. Try again in a few minutes."
    case .gone:
      problem = "This link no longer works: the screen was deleted, or its link was changed."
    case .unavailable:
      problem = "Can’t reach \(link.instanceLabel). Check your connection, or the link."
    }
  }
}
