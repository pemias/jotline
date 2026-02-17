<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let updateChecksEnabled = $derived($settings?.update_checks_enabled ?? true);
  let updating = $derived(isUpdatingKey("update_checks_enabled"));
</script>

<ToggleSwitch
  checked={updateChecksEnabled}
  onChange={(enabled) => updateSetting("update_checks_enabled", enabled)}
  isUpdating={updating}
  label={$t("settings.debug.updateChecks.label")}
  description={$t("settings.debug.updateChecks.description")}
  {descriptionMode}
  {grouped}
/>
