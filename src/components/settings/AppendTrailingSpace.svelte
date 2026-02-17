<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let enabled = $derived($settings?.append_trailing_space ?? false);
  let updating = $derived(isUpdatingKey("append_trailing_space"));
</script>

<ToggleSwitch
  checked={enabled}
  onChange={(enabled) => updateSetting("append_trailing_space", enabled)}
  isUpdating={updating}
  label={$t("settings.debug.appendTrailingSpace.label")}
  description={$t("settings.debug.appendTrailingSpace.description")}
  {descriptionMode}
  {grouped}
/>
