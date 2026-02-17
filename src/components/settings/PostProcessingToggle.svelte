<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let enabled = $derived($settings?.post_process_enabled || false);
  let updating = $derived(isUpdatingKey("post_process_enabled"));
</script>

<ToggleSwitch
  checked={enabled}
  onChange={(enabled) => updateSetting("post_process_enabled", enabled)}
  isUpdating={updating}
  label={$t("settings.debug.postProcessingToggle.label")}
  description={$t("settings.debug.postProcessingToggle.description")}
  {descriptionMode}
  {grouped}
/>
