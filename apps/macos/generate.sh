#!/bin/sh
# Generates the Mac app's Xcode project from project.yml, versioned from the apps' version.json
# (../mobile/version.json) like the other apps. Run it again after adding, moving or removing a
# Swift file.
set -e
cd "$(dirname "$0")"
APP_VERSION=$(node -p "require('../mobile/version.json').version")
BUILD_NUMBER=$(node -p "require('../mobile/version.json').macos.buildNumber")
export APP_VERSION BUILD_NUMBER
exec xcodegen generate --quiet
