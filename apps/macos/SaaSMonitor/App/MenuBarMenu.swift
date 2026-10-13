import SwiftUI

/// The menu of the pulse in the menu bar: which screen the notch shows, and the app's few commands.
struct MenuBarMenu: View {
  let app: AppDelegate

  var body: some View {
    @Bindable var preferences = app.preferences
    let library = app.library

    if library.screens.isEmpty {
      Text("No screen yet")
    } else {
      ForEach(library.screens) { screen in
        Toggle(
          screen.name,
          isOn: Binding(get: { library.selected?.key == screen.key }, set: { _ in library.select(screen.key) }))
      }
    }
    Divider()
    Button("Add a screen…") { app.windows.showAddScreen() }
      .keyboardShortcut("n")
    Toggle("Play sounds and voices", isOn: $preferences.playsSounds)
    Button("Settings…") { app.windows.showSettings() }
      .keyboardShortcut(",")
    Divider()
    Button("Quit SaaS Monitor") { NSApp.terminate(nil) }
      .keyboardShortcut("q")
  }
}
