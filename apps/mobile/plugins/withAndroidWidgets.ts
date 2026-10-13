import { AndroidConfig, type ConfigPlugin, withAndroidManifest } from "expo/config-plugins";

/**
 * Declares the Android home screen widgets in the app's manifest. Their code, layouts and
 * provider infos live in the `screen-bridge` module (`modules/screen-bridge/android`); this wires
 * them into the app, with the URL scheme they open screens with (`{scheme}://screen/{key}`).
 */

const WIDGET_PACKAGE = "com.saasmonitor.screenbridge.widget";
/** Read by `WidgetLinks.kt`. */
const URL_SCHEME_META_DATA = "com.saasmonitor.screenbridge.URL_SCHEME";

const WIDGETS = [
  {
    receiver: "MrrWidgetReceiver",
    label: "@string/sm_widget_mrr_name",
    info: "@xml/sm_widget_mrr_info",
  },
  {
    receiver: "OverviewWidgetReceiver",
    label: "@string/sm_widget_overview_name",
    info: "@xml/sm_widget_overview_info",
  },
] as const;

const CONFIGURE_ACTIVITY = `${WIDGET_PACKAGE}.ConfigureWidgetActivity`;

type ManifestApplication = AndroidConfig.Manifest.ManifestApplication;
type ManifestReceiver = NonNullable<ManifestApplication["receiver"]>[number];
/** Expo's type of a receiver lacks its label and meta-data, which the manifest takes. */
type Receiver = ManifestReceiver & {
  $: ManifestReceiver["$"] & { "android:label"?: string };
  "meta-data"?: AndroidConfig.Manifest.ManifestMetaData[];
};

function widgetReceiver(widget: (typeof WIDGETS)[number]): Receiver {
  return {
    $: {
      "android:name": `${WIDGET_PACKAGE}.${widget.receiver}`,
      "android:exported": "true",
      "android:label": widget.label,
    },
    "intent-filter": [
      { action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }] },
    ],
    "meta-data": [
      { $: { "android:name": "android.appwidget.provider", "android:resource": widget.info } },
    ],
  };
}

const configureActivity: AndroidConfig.Manifest.ManifestActivity = {
  $: {
    "android:name": CONFIGURE_ACTIVITY,
    "android:exported": "true",
    "android:theme": "@style/SmWidgetConfigureTheme",
    // Its own task: finishing it returns to the launcher, never into the app.
    "android:taskAffinity": "",
    "android:excludeFromRecents": "true",
  },
  "intent-filter": [
    { action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_CONFIGURE" } }] },
  ],
};

const isOurs = (item: { $: { "android:name": string } }) =>
  item.$["android:name"].startsWith(`${WIDGET_PACKAGE}.`);

const withAndroidWidgets: ConfigPlugin = (config) =>
  withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const scheme = Array.isArray(config.scheme) ? config.scheme[0] : config.scheme;
    if (!scheme)
      throw new Error(
        "withAndroidWidgets: set `scheme` in the app config, widgets open screens with it.",
      );

    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      application,
      URL_SCHEME_META_DATA,
      scheme,
    );
    // Replaced rather than appended, so that running prebuild twice declares each widget once.
    application.receiver = [
      ...(application.receiver ?? []).filter((item) => !isOurs(item)),
      ...WIDGETS.map(widgetReceiver),
    ];
    application.activity = [
      ...(application.activity ?? []).filter((item) => !isOurs(item)),
      configureActivity,
    ];
    return config;
  });

export default withAndroidWidgets;
