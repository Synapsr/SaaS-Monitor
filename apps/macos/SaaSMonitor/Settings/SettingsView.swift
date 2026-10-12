import AppKit
import SwiftUI

/// The screens of the app, and how the notch behaves on this Mac.
struct SettingsView: View {
  let library: ScreenLibrary
  let preferences: Preferences
  let onAdd: () -> Void
  let onRemove: (SharedScreen) -> Void

  private static let version =
    Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? ""

  var body: some View {
    @Bindable var preferences = preferences
    Form {
      Section {
        if library.screens.isEmpty {
          Text("No screen yet.")
            .foregroundStyle(.secondary)
        }
        ForEach(library.screens) { screen in
          HStack {
            VStack(alignment: .leading, spacing: 2) {
              Text(screen.name)
              Text(screen.link.instanceLabel)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer()
            if library.selected?.key == screen.key {
              Text("In the notch")
                .font(.caption)
                .foregroundStyle(.secondary)
            } else {
              Button("Show") { library.select(screen.key) }
            }
            Button(role: .destructive) {
              onRemove(screen)
            } label: {
              Image(systemName: "minus.circle")
            }
            .buttonStyle(.borderless)
            .help("Remove \(screen.name)")
          }
        }
        Button("Add a screen…", action: onAdd)
      } header: {
        Text("Screens")
      } footer: {
        Text("Moments of every screen show in the notch. What each screen shows and plays is set on the dashboard.")
          .foregroundStyle(.secondary)
      }

      Section("Notch") {
        Toggle("Show the number beside the notch", isOn: $preferences.showsFigures)
        Toggle("Show over apps in full screen", isOn: $preferences.showsOverFullScreen)
        Toggle("Play sounds and voices", isOn: $preferences.playsSounds)
      }

      Section {
        Toggle("Open at login", isOn: $preferences.opensAtLogin)
      }

      // A full menu bar hides the app's icon behind the notch: quitting stays at hand here.
      Section {
        HStack {
          Text("SaaS Monitor \(Self.version)")
            .foregroundStyle(.secondary)
          Spacer()
          Button("Quit SaaS Monitor") { NSApp.terminate(nil) }
        }
      }
    }
    .formStyle(.grouped)
    .frame(width: 480)
    .fixedSize(horizontal: false, vertical: true)
  }
}
