<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let alwaysOnMode = $derived($settings?.always_on_microphone || false);
  let updating = $derived(isUpdatingKey("always_on_microphone"));
</script>

<ToggleSwitch
  checked={alwaysOnMode}
  onChange={(enabled) => updateSetting("always_on_microphone", enabled)}
  isUpdating={updating}
  label={$t("settings.debug.alwaysOnMicrophone.label")}
  description={$t("settings.debug.alwaysOnMicrophone.description")}
  {descriptionMode}
  {grouped}
/>
