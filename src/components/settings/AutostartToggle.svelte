<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let autostartEnabled = $derived($settings?.autostart_enabled ?? false);
  let updating = $derived(isUpdatingKey("autostart_enabled"));
</script>

<ToggleSwitch
  checked={autostartEnabled}
  onChange={(enabled) => updateSetting("autostart_enabled", enabled)}
  isUpdating={updating}
  label={$t("settings.advanced.autostart.label")}
  description={$t("settings.advanced.autostart.description")}
  {descriptionMode}
  {grouped}
/>
