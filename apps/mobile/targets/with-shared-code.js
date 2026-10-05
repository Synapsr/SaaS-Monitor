// Links `targets/shared` into the Apple targets that use it, and builds them in Swift 6.
//
// `@bacons/apple-targets` gives each target its own folder, and its `_shared` folders also compile
// into the iPhone app, which needs none of this code. Here the widget, the watch app and the watch
// widgets share models, networking and views, and nothing else does.
//
// Register this plugin *before* `@bacons/apple-targets`: Expo runs the mods of a file in reverse
// order, so it then edits the project once the targets exist.

const { withXcodeProjectBeta } = require("@bacons/apple-targets/build/with-bacons-xcode");
const { PBXFileSystemSynchronizedRootGroup, PBXGroup, PBXNativeTarget } = require("@bacons/xcode");

/** Folders of `targets/shared`, and the target folders compiling them. */
const SHARED_FOLDERS = {
  Core: ["widget", "watch", "watch-widget"],
  Widgets: ["widget", "watch-widget"],
};

/** The group `@bacons/apple-targets` puts the targets' folders in. */
const TARGETS_GROUP = "expo:targets";

/** Language mode of the targets of `targets/`: strict concurrency checking. */
const SWIFT_VERSION = "6.0";

function findOrCreateGroup(project, parent, path) {
  const existing = parent.props.children.find(
    (child) => PBXGroup.is(child) && child.props.path === path,
  );
  if (existing) return existing;
  const group = PBXGroup.create(project, { path, sourceTree: "<group>", children: [] });
  parent.props.children.push(group);
  return group;
}

function findOrCreateSyncedFolder(project, parent, path) {
  const existing = parent.props.children.find(
    (child) => PBXFileSystemSynchronizedRootGroup.is(child) && child.props.path === path,
  );
  if (existing) return existing;
  const folder = PBXFileSystemSynchronizedRootGroup.create(project, {
    path,
    exceptions: [],
    explicitFileTypes: {},
    explicitFolders: [],
    sourceTree: "<group>",
  });
  parent.props.children.push(folder);
  return folder;
}

/** The target whose sources are the folder `targets/<folder>`. */
function targetOfFolder(project, folder) {
  return project.rootObject.props.targets.find(
    (target) =>
      PBXNativeTarget.is(target) &&
      (target.props.fileSystemSynchronizedGroups ?? []).some(
        (group) => group.props.path === folder,
      ),
  );
}

module.exports = function withSharedCode(config) {
  return withXcodeProjectBeta(config, (config) => {
    const project = config.modResults;
    const targetsGroup = project.rootObject.props.mainGroup
      .getChildGroups()
      .find((group) => group.getDisplayName() === TARGETS_GROUP);
    // No target yet: nothing to share code with.
    if (!targetsGroup) return config;

    const sharedGroup = findOrCreateGroup(project, targetsGroup, "shared");
    // A target folder without `expo-target.config.js` has no target: nothing to link it to.
    const targets = new Map(
      [...new Set(Object.values(SHARED_FOLDERS).flat())]
        .map((folder) => [folder, targetOfFolder(project, folder)])
        .filter(([, target]) => target),
    );

    for (const [folder, users] of Object.entries(SHARED_FOLDERS)) {
      const syncedFolder = findOrCreateSyncedFolder(project, sharedGroup, folder);
      for (const user of users) {
        const target = targets.get(user);
        if (!target) continue;
        target.props.fileSystemSynchronizedGroups ??= [];
        if (!target.props.fileSystemSynchronizedGroups.includes(syncedFolder)) {
          target.props.fileSystemSynchronizedGroups.push(syncedFolder);
        }
      }
    }

    for (const target of targets.values()) {
      for (const configuration of target.props.buildConfigurationList.props.buildConfigurations) {
        configuration.props.buildSettings.SWIFT_VERSION = SWIFT_VERSION;
      }
    }
    return config;
  });
};
