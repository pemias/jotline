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

  let pttEnabled = $derived($settings?.push_to_talk || false);
</script>

<ToggleSwitch
  checked={pttEnabled}
  onChange={(enabled) => updateSetting("push_to_talk", enabled)}
  isUpdating={isUpdatingKey("push_to_talk")}
  label={$t("settings.general.pushToTalk.label")}
  description={$t("settings.general.pushToTalk.description")}
  {descriptionMode}
  {grouped}
/>
