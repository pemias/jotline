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

  let startHidden = $derived($settings?.start_hidden ?? false);
</script>

<ToggleSwitch
  checked={startHidden}
  onChange={(enabled) => updateSetting("start_hidden", enabled)}
  isUpdating={isUpdatingKey("start_hidden")}
  label={$t("settings.advanced.startHidden.label")}
  description={$t("settings.advanced.startHidden.description")}
  {descriptionMode}
  {grouped}
  tooltipPosition="bottom"
/>
