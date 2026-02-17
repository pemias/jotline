<script lang="ts">
  import { t } from "@/i18n";
  import {
    settings,
    updateSetting,
    resetSetting,
    isUpdatingKey,
    isLoading,
    audioDevices,
    refreshAudioDevices,
  } from "@/stores/settingsStore";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import ResetButton from "../ui/ResetButton.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let selectedMicrophone = $derived(
    $settings?.selected_microphone === "default"
      ? "Default"
      : $settings?.selected_microphone || "Default"
  );

  let microphoneOptions = $derived(
    $audioDevices.map((device) => ({
      value: device.name,
      label: device.name,
    }))
  );

  async function handleMicrophoneSelect(deviceName: string) {
    await updateSetting("selected_microphone", deviceName);
  }

  async function handleReset() {
    await resetSetting("selected_microphone");
  }
</script>

<SettingContainer
  title={$t("settings.sound.microphone.title")}
  description={$t("settings.sound.microphone.description")}
  {descriptionMode}
  {grouped}
>
  <div class="flex items-center space-x-1">
    <Dropdown
      options={microphoneOptions}
      selectedValue={selectedMicrophone}
      onSelect={handleMicrophoneSelect}
      placeholder={$isLoading || $audioDevices.length === 0
        ? $t("settings.sound.microphone.loading")
        : $t("settings.sound.microphone.placeholder")}
      disabled={isUpdatingKey("selected_microphone") || $isLoading || $audioDevices.length === 0}
      onRefresh={refreshAudioDevices}
    />
    <ResetButton
      onclick={handleReset}
      disabled={isUpdatingKey("selected_microphone") || $isLoading}
    />
  </div>
</SettingContainer>
