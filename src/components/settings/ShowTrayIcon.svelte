<script lang="ts">
  import { t } from "@/i18n";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";

  let {
    descriptionMode = "tooltip",
    grouped = false,
  }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let showTrayIcon = $derived($settings?.show_tray_icon ?? true);
</script>

<ToggleSwitch
  checked={showTrayIcon}
  onChange={(enabled) => updateSetting("show_tray_icon", enabled)}
  isUpdating={isUpdatingKey("show_tray_icon")}
  label={$t("settings.advanced.showTrayIcon.label")}
  description={$t("settings.advanced.showTrayIcon.description")}
  {descriptionMode}
  {grouped}
  tooltipPosition="bottom"
/>
