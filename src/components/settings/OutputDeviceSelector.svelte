<script lang="ts">
  import { t } from "@/i18n";
  import {
    settings,
    updateSetting,
    resetSetting,
    isUpdatingKey,
    isLoading,
    outputDevices,
    refreshOutputDevices,
  } from "@/stores/settingsStore";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import ResetButton from "../ui/ResetButton.svelte";

  let { descriptionMode = "tooltip", grouped = false, disabled = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
    disabled?: boolean;
  } = $props();

  let selectedOutputDevice = $derived(
    $settings?.selected_output_device === "default"
      ? "Default"
      : $settings?.selected_output_device || "Default"
  );

  let outputDeviceOptions = $derived(
    $outputDevices.map((device) => ({
      value: device.name,
      label: device.name,
    }))
  );

  async function handleOutputDeviceSelect(deviceName: string) {
    await updateSetting("selected_output_device", deviceName);
  }

  async function handleReset() {
    await resetSetting("selected_output_device");
  }
</script>

<SettingContainer
  title={$t("settings.sound.outputDevice.title")}
  description={$t("settings.sound.outputDevice.description")}
  {descriptionMode}
  {grouped}
  {disabled}
>
  <div class="flex items-center space-x-1">
    <Dropdown
      options={outputDeviceOptions}
      selectedValue={selectedOutputDevice}
      onSelect={handleOutputDeviceSelect}
      placeholder={$isLoading || $outputDevices.length === 0
        ? $t("settings.sound.outputDevice.loading")
        : $t("settings.sound.outputDevice.placeholder")}
      disabled={disabled || isUpdatingKey("selected_output_device") || $isLoading || $outputDevices.length === 0}
      onRefresh={refreshOutputDevices}
    />
    <ResetButton
      onclick={handleReset}
      disabled={disabled || isUpdatingKey("selected_output_device") || $isLoading}
    />
  </div>
</SettingContainer>
