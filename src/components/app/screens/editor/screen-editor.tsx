"use client";

import { useId, useState } from "react";
import { saveScreenAction } from "@/app/app/screens/actions";
import { BackLink } from "@/components/app/back-link";
import { ScreenPreview } from "@/components/app/screens/screen-preview";
import { screenUrl } from "@/components/app/screens/screen-url";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAutoSave } from "@/hooks/use-auto-save";
import { NAME_MAX_LENGTH } from "@/lib/names";
import type { ScreenSettings } from "@/lib/screens/settings";
import type { AccountOption, Screen } from "@/server/screens";
import { AccountPicker } from "./account-picker";
import { CurrencySelect } from "./currency-select";
import { DeleteScreen } from "./delete-screen";
import { GoalSettings } from "./goal-settings";
import { LanguageSelect } from "./language-select";
import { LookSettings } from "./look-settings";
import { MetricSettings } from "./metric-settings";
import { RotationSettings } from "./rotation-settings";
import { SaveStatus } from "./save-status";
import { SettingsSection } from "./settings-section";
import { SharePanel } from "./share-panel";
import { SoundSettings } from "./sound-settings";
import { TimeZonePicker } from "./time-zone-picker";
import { VoiceSettings } from "./voice-settings";

interface Draft {
  name: string;
  accountIds: string[];
  settings: ScreenSettings;
}

/**
 * Every change is shown in the live preview at once and saved a moment later: there is no save
 * button to forget.
 */
export function ScreenEditor({
  screen,
  accounts,
  appUrl,
  canPersonalizeVoice,
}: {
  screen: Screen;
  accounts: AccountOption[];
  appUrl: string;
  /** The server has a Gradium API key: voices can say the screen's own phrases. */
  canPersonalizeVoice: boolean;
}) {
  const id = useId();
  // Initialized once: server re-renders after each save must not overwrite what is being typed.
  const [draft, setDraft] = useState<Draft>(() => ({
    name: screen.name,
    accountIds: screen.accounts.map((account) => account.id),
    settings: screen.settings,
  }));
  const [publicToken, setPublicToken] = useState(screen.publicToken);

  const nameMissing = draft.name.trim() === "";
  const { status, retry } = useAutoSave(draft, (value) => saveScreenAction(screen.id, value), {
    enabled: !nameMissing,
  });

  const setSettings = (patch: Partial<ScreenSettings>) =>
    setDraft((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  const url = screenUrl(appUrl, publicToken);
  const accountCurrencies = accounts.flatMap((account) => account.currency ?? []);
  const selectedAccounts = accounts.filter((account) => draft.accountIds.includes(account.id));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <BackLink href="/app/screens">Screens</BackLink>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">
            {draft.name.trim() || "Untitled screen"}
          </h1>
          <SaveStatus
            status={nameMissing ? "failed" : status}
            onRetry={nameMissing ? undefined : retry}
          />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        {/* First in the page on small screens; pinned on the right on large ones. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:self-start">
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60 motion-reduce:hidden" />
                <span className="relative size-2 rounded-full bg-emerald-500" />
              </span>
              Live preview
            </p>
            <ScreenPreview
              token={publicToken}
              name={draft.name}
              settings={draft.settings}
              className="shadow-lg shadow-black/5"
            />
          </div>
          <SharePanel
            screenId={screen.id}
            url={url}
            hasPassword={screen.hasPassword}
            onLinkRegenerated={setPublicToken}
          />
        </aside>

        <div className="flex flex-col gap-8 lg:col-start-1 lg:row-start-1">
          <SettingsSection title="Screen">
            <Field data-invalid={nameMissing || undefined}>
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input
                id={`${id}-name`}
                value={draft.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setDraft((current) => ({ ...current, name }));
                }}
                maxLength={NAME_MAX_LENGTH}
                autoComplete="off"
                className="h-9"
                aria-invalid={nameMissing}
                aria-describedby={nameMissing ? `${id}-name-error` : undefined}
              />
              {nameMissing && (
                <FieldError id={`${id}-name-error`}>Give the screen a name to save it.</FieldError>
              )}
            </Field>
            <AccountPicker
              accounts={accounts}
              selected={draft.accountIds}
              onChange={(accountIds) => setDraft((current) => ({ ...current, accountIds }))}
            />
          </SettingsSection>

          {draft.accountIds.length > 1 && (
            <SettingsSection title="Several accounts">
              <RotationSettings
                rotation={draft.settings.rotation}
                onChange={(patch) =>
                  setDraft((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      rotation: { ...current.settings.rotation, ...patch },
                    },
                  }))
                }
              />
            </SettingsSection>
          )}

          <SettingsSection title="Language and region">
            <Field>
              <FieldLabel htmlFor={`${id}-language`}>Language</FieldLabel>
              <LanguageSelect
                id={`${id}-language`}
                value={draft.settings.language}
                onChange={(language) => setSettings({ language })}
              />
              <FieldDescription>The screen’s words, numbers and dates.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-currency`}>Currency</FieldLabel>
              <CurrencySelect
                id={`${id}-currency`}
                value={draft.settings.currency}
                extraCurrencies={accountCurrencies}
                onChange={(currency) => setSettings({ currency })}
              />
              <FieldDescription>Every amount is converted to it.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-time-zone`}>Time zone</FieldLabel>
              <TimeZonePicker
                id={`${id}-time-zone`}
                value={draft.settings.timeZone}
                onChange={(timeZone) => setSettings({ timeZone })}
              />
              <FieldDescription>When “today” and “this month” start.</FieldDescription>
            </Field>
          </SettingsSection>

          <SettingsSection title="Main metric">
            <MetricSettings
              metric={draft.settings.metric}
              onChange={(metric) => setSettings({ metric })}
            />
          </SettingsSection>

          <SettingsSection title="Goal">
            <GoalSettings
              goal={draft.settings.goal}
              metric={draft.settings.metric}
              currency={draft.settings.currency}
              onChange={(goal) => setSettings({ goal })}
            />
          </SettingsSection>

          <SettingsSection title="Sound">
            <SoundSettings
              sound={draft.settings.sound}
              metric={draft.settings.metric}
              onChange={(patch) =>
                setDraft((current) => ({
                  ...current,
                  settings: { ...current.settings, sound: { ...current.settings.sound, ...patch } },
                }))
              }
            />
          </SettingsSection>

          <SettingsSection title="Voice">
            <VoiceSettings
              voice={draft.settings.voice}
              language={draft.settings.language}
              metric={draft.settings.metric}
              showCustomerNames={draft.settings.showCustomerNames}
              currency={draft.settings.currency}
              product={selectedAccounts[0]?.name ?? (draft.name.trim() || "Acme")}
              severalProducts={selectedAccounts.length > 1}
              canPersonalize={canPersonalizeVoice}
              onChange={(patch) =>
                setDraft((current) => ({
                  ...current,
                  settings: { ...current.settings, voice: { ...current.settings.voice, ...patch } },
                }))
              }
            />
          </SettingsSection>

          <SettingsSection title="Look">
            <LookSettings
              settings={draft.settings}
              metric={draft.settings.metric}
              onChange={setSettings}
            />
          </SettingsSection>

          <SettingsSection title="Delete screen">
            <DeleteScreen screenId={screen.id} name={draft.name.trim() || "this screen"} />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
