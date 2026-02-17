<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let enabled = $derived($settings?.experimental_enabled || false);
  let updating = $derived(isUpdatingKey("experimental_enabled"));
</script>

<ToggleSwitch
  checked={enabled}
  onChange={(enabled) => updateSetting("experimental_enabled", enabled)}
  isUpdating={updating}
  label={$t("settings.advanced.experimentalToggle.label")}
  description={$t("settings.advanced.experimentalToggle.description")}
  {descriptionMode}
  {grouped}
/>
