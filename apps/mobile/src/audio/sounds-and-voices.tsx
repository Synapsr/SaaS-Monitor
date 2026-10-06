import {
  audioPreferencesStore,
  DEFAULT_AUDIO_PREFERENCES,
  PLAYS_NOTIFICATION_AUDIO,
  useAudioPreferences,
} from "@/audio/preferences";
import { SettingsGroup, SwitchRow } from "@/ui/settings-group";

const FOOTER = PLAYS_NOTIFICATION_AUDIO
  ? "For every screen on this device. The ring/silent switch keeps them quiet, like other sounds."
  : "For every screen on this device.";

/**
 * "Sounds and voices": this device's switches, the same in the app's settings and in each screen's,
 * where people look for them.
 */
export function SoundsAndVoices() {
  const audio = useAudioPreferences() ?? DEFAULT_AUDIO_PREFERENCES;
  return (
    <SettingsGroup title="Sounds and voices" footer={FOOTER}>
      <SwitchRow
        label="Play sounds and voices"
        detail="While a screen is open in the app, each moment plays as on its wall display, with the screen’s sound and voice settings."
        value={audio.play}
        onValueChange={(play) => audioPreferencesStore.update({ play })}
      />
      {PLAYS_NOTIFICATION_AUDIO && (
        <SwitchRow
          label="Also in notifications"
          detail="Phone locked, in another app or in CarPlay: notifications play them instead of the usual sound."
          value={audio.whenLocked}
          disabled={!audio.play}
          onValueChange={(whenLocked) => audioPreferencesStore.update({ whenLocked })}
        />
      )}
    </SettingsGroup>
  );
}
