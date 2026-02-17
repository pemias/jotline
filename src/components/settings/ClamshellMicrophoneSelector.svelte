<script lang="ts">
  import { t } from "@/i18n";
  import { commands } from "@/bindings";
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

  let isLaptop = $state(false);

  $effect(() => {
    checkIsLaptop();
  });

  async function checkIsLaptop() {
    try {
      const result = await commands.isLaptop();
      if (result.status === "ok") {
        isLaptop = result.data;
      } else {
        isLaptop = false;
      }
    } catch (error) {
      console.error("Failed to check if device is laptop:", error);
      isLaptop = false;
    }
  }

  let selectedClamshellMicrophone = $derived(
    $settings?.clamshell_microphone === "default"
      ? "Default"
      : $settings?.clamshell_microphone || "Default"
  );

  let microphoneOptions = $derived(
    $audioDevices.map((device) => ({
      value: device.name,
      label: device.name,
    }))
  );

  async function handleClamshellMicrophoneSelect(deviceName: string) {
    await updateSetting("clamshell_microphone", deviceName);
  }

  async function handleReset() {
    await resetSetting("clamshell_microphone");
  }
</script>

{#if isLaptop}
  <SettingContainer
    title={$t("settings.debug.clamshellMicrophone.title")}
    description={$t("settings.debug.clamshellMicrophone.description")}
    {descriptionMode}
    {grouped}
  >
    <div class="flex items-center space-x-1">
      <Dropdown
        options={microphoneOptions}
        selectedValue={selectedClamshellMicrophone}
        onSelect={handleClamshellMicrophoneSelect}
        placeholder={$isLoading || $audioDevices.length === 0
          ? $t("common.loading")
          : $t("settings.sound.microphone.placeholder")}
        disabled={isUpdatingKey("clamshell_microphone") || $isLoading || $audioDevices.length === 0}
        onRefresh={refreshAudioDevices}
      />
      <ResetButton
        onclick={handleReset}
        disabled={isUpdatingKey("clamshell_microphone") || $isLoading}
      />
    </div>
  </SettingContainer>
{/if}
