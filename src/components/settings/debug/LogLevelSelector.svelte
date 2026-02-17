<script lang="ts">
  import { t } from "@/i18n";
  import SettingContainer from "../../ui/SettingContainer.svelte";
  import Dropdown, { type DropdownOption } from "../../ui/Dropdown.svelte";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import type { LogLevel } from "@/bindings";

  const LOG_LEVEL_OPTIONS: DropdownOption[] = [
    { value: "error", label: "Error" },
    { value: "warn", label: "Warn" },
    { value: "info", label: "Info" },
    { value: "debug", label: "Debug" },
    { value: "trace", label: "Trace" },
  ];

  let {
    descriptionMode = "tooltip",
    grouped = false,
  }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();

  let currentLevel = $derived($settings?.log_level ?? "debug");

  async function handleSelect(value: string) {
    if (value === currentLevel) return;

    try {
      await updateSetting("log_level", value as LogLevel);
    } catch (error) {
      console.error("Failed to update log level:", error);
    }
  }
</script>

<SettingContainer
  title={$t("settings.debug.logLevel.title")}
  description={$t("settings.debug.logLevel.description")}
  {descriptionMode}
  {grouped}
  layout="horizontal"
>
  <Dropdown
    options={LOG_LEVEL_OPTIONS}
    selectedValue={currentLevel}
    onSelect={handleSelect}
    disabled={!$settings || isUpdatingKey("log_level")}
  />
</SettingContainer>
