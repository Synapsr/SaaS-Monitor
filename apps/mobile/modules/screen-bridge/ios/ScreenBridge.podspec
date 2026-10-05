Pod::Spec.new do |s|
  s.name           = 'ScreenBridge'
  s.version        = '1.0.0'
  s.summary        = 'Hands the screens of SaaS Monitor to its widgets and its Apple Watch app.'
  s.description    = 'Writes the screens to the App Group the widgets read, reloads WidgetKit timelines and sends them to the paired Apple Watch.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  # WidgetKit and WatchConnectivity: iOS only.
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '6.0'

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WidgetKit', 'WatchConnectivity'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
