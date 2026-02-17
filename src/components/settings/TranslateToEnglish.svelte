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

  let translateToEnglish = $derived($settings?.translate_to_english || false);
</script>

<ToggleSwitch
  checked={translateToEnglish}
  onChange={(enabled) => updateSetting("translate_to_english", enabled)}
  isUpdating={isUpdatingKey("translate_to_english")}
  label={$t("settings.advanced.translateToEnglish.label")}
  description={$t("settings.advanced.translateToEnglish.description")}
  {descriptionMode}
  {grouped}
/>
