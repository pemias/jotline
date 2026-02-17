import { createSubscriber } from "svelte/reactivity";
import { writable, get } from "svelte/store";
import type { AppSettings as Settings, AudioDevice } from "@/bindings";
import { commands } from "@/bindings";

// Note: Default settings are now fetched from Rust via commands.getDefaultSettings()
// This ensures platform-specific defaults (like overlay_position, shortcuts, paste_method) work correctly

const DEFAULT_AUDIO_DEVICE: AudioDevice = {
  index: "default",
  name: "Default",
  is_default: true,
};

const settingUpdaters: {
  [K in keyof Settings]?: (value: Settings[K]) => Promise<unknown>;
} = {
  always_on_microphone: (value) =>
    commands.updateMicrophoneMode(value as boolean),
  audio_feedback: (value) =>
    commands.changeAudioFeedbackSetting(value as boolean),
  audio_feedback_volume: (value) =>
    commands.changeAudioFeedbackVolumeSetting(value as number),
  sound_theme: (value) => commands.changeSoundThemeSetting(value as string),
  start_hidden: (value) => commands.changeStartHiddenSetting(value as boolean),
  autostart_enabled: (value) =>
    commands.changeAutostartSetting(value as boolean),
  update_checks_enabled: (value) =>
    commands.changeUpdateChecksSetting(value as boolean),
  push_to_talk: (value) => commands.changePttSetting(value as boolean),
  selected_microphone: (value) =>
    commands.setSelectedMicrophone(
      (value as string) === "Default" || value === null
        ? "default"
        : (value as string),
    ),
  clamshell_microphone: (value) =>
    commands.setClamshellMicrophone(
      (value as string) === "Default" ? "default" : (value as string),
    ),
  selected_output_device: (value) =>
    commands.setSelectedOutputDevice(
      (value as string) === "Default" || value === null
        ? "default"
        : (value as string),
    ),
  recording_retention_period: (value) =>
    commands.updateRecordingRetentionPeriod(value as string),
  translate_to_english: (value) =>
    commands.changeTranslateToEnglishSetting(value as boolean),
  selected_language: (value) =>
    commands.changeSelectedLanguageSetting(value as string),
  overlay_position: (value) =>
    commands.changeOverlayPositionSetting(value as string),
  debug_mode: (value) => commands.changeDebugModeSetting(value as boolean),
  custom_words: (value) => commands.updateCustomWords(value as string[]),
  word_correction_threshold: (value) =>
    commands.changeWordCorrectionThresholdSetting(value as number),
  paste_method: (value) => commands.changePasteMethodSetting(value as string),
  typing_tool: (value) => commands.changeTypingToolSetting(value as string),
  clipboard_handling: (value) =>
    commands.changeClipboardHandlingSetting(value as string),
  auto_submit: (value) => commands.changeAutoSubmitSetting(value as boolean),
  auto_submit_key: (value) =>
    commands.changeAutoSubmitKeySetting(value as string),
  history_limit: (value) => commands.updateHistoryLimit(value as number),
  post_process_enabled: (value) =>
    commands.changePostProcessEnabledSetting(value as boolean),
  post_process_selected_prompt_id: (value) =>
    commands.setPostProcessSelectedPrompt(value as string),
  mute_while_recording: (value) =>
    commands.changeMuteWhileRecordingSetting(value as boolean),
  append_trailing_space: (value) =>
    commands.changeAppendTrailingSpaceSetting(value as boolean),
  log_level: (value) => commands.setLogLevel(value as any),
  app_language: (value) => commands.changeAppLanguageSetting(value as string),
  experimental_enabled: (value) =>
    commands.changeExperimentalEnabledSetting(value as boolean),
  show_tray_icon: (value) =>
    commands.changeShowTrayIconSetting(value as boolean),
};

// --- Writable stores ---

export const settings = writable<Settings | null>(null);
export const defaultSettings = writable<Settings | null>(null);
export const isLoading = writable<boolean>(true);
export const isUpdating = writable<Record<string, boolean>>({});
export const audioDevices = writable<AudioDevice[]>([]);
export const outputDevices = writable<AudioDevice[]>([]);
export const customSounds = writable<{ start: boolean; stop: boolean }>({
  start: false,
  stop: false,
});
export const postProcessModelOptions = writable<Record<string, string[]>>({});
const subscribeToUpdatingChanges = createSubscriber((update) =>
  isUpdating.subscribe(() => {
    update();
  }),
);

// --- Internal helpers ---

function setUpdating(key: string, updating: boolean): void {
  isUpdating.update((state) => ({ ...state, [key]: updating }));
}

// --- Getters ---

export function getSetting<K extends keyof Settings>(
  key: K,
): Settings[K] | undefined {
  return get(settings)?.[key];
}

export function isUpdatingKey(key: string): boolean {
  // Register a reactive dependency when called inside template/effect contexts.
  subscribeToUpdatingChanges();
  return get(isUpdating)[key] || false;
}

// --- Actions ---

export async function refreshSettings(): Promise<void> {
  try {
    const result = await commands.getAppSettings();
    if (result.status === "ok") {
      const s = result.data;
      const normalizedSettings: Settings = {
        ...s,
        always_on_microphone: s.always_on_microphone ?? false,
        selected_microphone: s.selected_microphone ?? "Default",
        clamshell_microphone: s.clamshell_microphone ?? "Default",
        selected_output_device: s.selected_output_device ?? "Default",
      };
      settings.set(normalizedSettings);
      isLoading.set(false);
    } else {
      console.error("Failed to load settings:", result.error);
      isLoading.set(false);
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
    isLoading.set(false);
  }
}

export async function refreshAudioDevices(): Promise<void> {
  try {
    const result = await commands.getAvailableMicrophones();
    if (result.status === "ok") {
      const devicesWithDefault = [
        DEFAULT_AUDIO_DEVICE,
        ...result.data.filter(
          (d) => d.name !== "Default" && d.name !== "default",
        ),
      ];
      audioDevices.set(devicesWithDefault);
    } else {
      audioDevices.set([DEFAULT_AUDIO_DEVICE]);
    }
  } catch (error) {
    console.error("Failed to load audio devices:", error);
    audioDevices.set([DEFAULT_AUDIO_DEVICE]);
  }
}

export async function refreshOutputDevices(): Promise<void> {
  try {
    const result = await commands.getAvailableOutputDevices();
    if (result.status === "ok") {
      const devicesWithDefault = [
        DEFAULT_AUDIO_DEVICE,
        ...result.data.filter(
          (d) => d.name !== "Default" && d.name !== "default",
        ),
      ];
      outputDevices.set(devicesWithDefault);
    } else {
      outputDevices.set([DEFAULT_AUDIO_DEVICE]);
    }
  } catch (error) {
    console.error("Failed to load output devices:", error);
    outputDevices.set([DEFAULT_AUDIO_DEVICE]);
  }
}

export async function playTestSound(
  soundType: "start" | "stop",
): Promise<void> {
  try {
    await commands.playTestSound(soundType);
  } catch (error) {
    console.error(`Failed to play test sound (${soundType}):`, error);
  }
}

export async function checkCustomSounds(): Promise<void> {
  try {
    const sounds = await commands.checkCustomSounds();
    customSounds.set(sounds);
  } catch (error) {
    console.error("Failed to check custom sounds:", error);
  }
}

export async function updateSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  const currentSettings = get(settings);
  const updateKey = String(key);
  const originalValue = currentSettings?.[key];

  setUpdating(updateKey, true);

  try {
    // Optimistic update
    settings.update((s) => (s ? { ...s, [key]: value } : null));

    const updater = settingUpdaters[key];
    if (updater) {
      await updater(value);
    } else if (key !== "bindings" && key !== "selected_model") {
      console.warn(`No handler for setting: ${String(key)}`);
    }
  } catch (error) {
    console.error(`Failed to update setting ${String(key)}:`, error);
    if (currentSettings) {
      settings.set({ ...currentSettings, [key]: originalValue });
    }
  } finally {
    setUpdating(updateKey, false);
  }
}

export async function resetSetting(key: keyof Settings): Promise<void> {
  const defaults = get(defaultSettings);
  if (defaults) {
    const defaultValue = defaults[key];
    if (defaultValue !== undefined) {
      await updateSetting(key, defaultValue as any);
    }
  }
}

export async function updateBinding(
  id: string,
  binding: string,
): Promise<void> {
  const currentSettings = get(settings);
  const updateKey = `binding_${id}`;
  const originalBinding = currentSettings?.bindings?.[id]?.current_binding;

  setUpdating(updateKey, true);

  try {
    // Optimistic update
    settings.update((s) =>
      s
        ? {
            ...s,
            bindings: {
              ...s.bindings,
              [id]: {
                ...s.bindings[id]!,
                current_binding: binding,
              },
            },
          }
        : null,
    );

    const result = await commands.changeBinding(id, binding);

    if (result.status === "error") {
      throw new Error(result.error);
    }

    if (!result.data.success) {
      throw new Error(result.data.error || "Failed to update binding");
    }
  } catch (error) {
    console.error(`Failed to update binding ${id}:`, error);

    // Rollback on error
    if (originalBinding && get(settings)) {
      settings.update((s) =>
        s
          ? {
              ...s,
              bindings: {
                ...s.bindings,
                [id]: {
                  ...s.bindings[id]!,
                  current_binding: originalBinding,
                },
              },
            }
          : null,
      );
    }

    throw error;
  } finally {
    setUpdating(updateKey, false);
  }
}

export async function resetBinding(id: string): Promise<void> {
  const updateKey = `binding_${id}`;

  setUpdating(updateKey, true);

  try {
    await commands.resetBinding(id);
    await refreshSettings();
  } catch (error) {
    console.error(`Failed to reset binding ${id}:`, error);
  } finally {
    setUpdating(updateKey, false);
  }
}

export async function setPostProcessProvider(
  providerId: string,
): Promise<void> {
  const currentSettings = get(settings);
  const updateKey = "post_process_provider_id";
  const previousId = currentSettings?.post_process_provider_id ?? null;

  setUpdating(updateKey, true);

  if (currentSettings) {
    settings.update((s) =>
      s ? { ...s, post_process_provider_id: providerId } : null,
    );
  }

  try {
    await commands.setPostProcessProvider(providerId);
    await refreshSettings();
  } catch (error) {
    console.error("Failed to set post-process provider:", error);
    if (previousId !== null) {
      settings.update((s) =>
        s ? { ...s, post_process_provider_id: previousId } : null,
      );
    }
  } finally {
    setUpdating(updateKey, false);
  }
}

export async function updatePostProcessSetting(
  settingType: "base_url" | "api_key" | "model",
  providerId: string,
  value: string,
): Promise<void> {
  const updateKey = `post_process_${settingType}:${providerId}`;

  setUpdating(updateKey, true);

  try {
    if (settingType === "base_url") {
      await commands.changePostProcessBaseUrlSetting(providerId, value);
    } else if (settingType === "api_key") {
      await commands.changePostProcessApiKeySetting(providerId, value);
    } else if (settingType === "model") {
      await commands.changePostProcessModelSetting(providerId, value);
    }
    await refreshSettings();
  } catch (error) {
    console.error(
      `Failed to update post-process ${settingType.replace("_", " ")}:`,
      error,
    );
  } finally {
    setUpdating(updateKey, false);
  }
}

export async function updatePostProcessBaseUrl(
  providerId: string,
  baseUrl: string,
): Promise<void> {
  return updatePostProcessSetting("base_url", providerId, baseUrl);
}

export async function updatePostProcessApiKey(
  providerId: string,
  apiKey: string,
): Promise<void> {
  // Clear cached models when API key changes - user should click refresh after
  postProcessModelOptions.update((opts) => ({
    ...opts,
    [providerId]: [],
  }));
  return updatePostProcessSetting("api_key", providerId, apiKey);
}

export async function updatePostProcessModel(
  providerId: string,
  model: string,
): Promise<void> {
  return updatePostProcessSetting("model", providerId, model);
}

export async function fetchPostProcessModels(
  providerId: string,
): Promise<string[]> {
  const updateKey = `post_process_models_fetch:${providerId}`;

  setUpdating(updateKey, true);

  try {
    const result = await commands.fetchPostProcessModels(providerId);
    if (result.status === "ok") {
      setPostProcessModelOptions(providerId, result.data);
      return result.data;
    } else {
      console.error("Failed to fetch models:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return [];
  } finally {
    setUpdating(updateKey, false);
  }
}

export function setPostProcessModelOptions(
  providerId: string,
  models: string[],
): void {
  postProcessModelOptions.update((opts) => ({
    ...opts,
    [providerId]: models,
  }));
}

export async function loadDefaultSettings(): Promise<void> {
  try {
    const result = await commands.getDefaultSettings();
    if (result.status === "ok") {
      defaultSettings.set(result.data);
    } else {
      console.error("Failed to load default settings:", result.error);
    }
  } catch (error) {
    console.error("Failed to load default settings:", error);
  }
}

export async function initialize(): Promise<void> {
  // Note: Audio devices are NOT refreshed here. The frontend
  // is responsible for calling refreshAudioDevices/refreshOutputDevices
  // after onboarding completes. This avoids triggering permission dialogs
  // on macOS before the user is ready.
  await Promise.all([
    loadDefaultSettings(),
    refreshSettings(),
    checkCustomSounds(),
  ]);
}
