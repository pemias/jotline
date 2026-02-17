<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let muteEnabled = $derived($settings?.mute_while_recording ?? false);
  let updating = $derived(isUpdatingKey("mute_while_recording"));
</script>

<ToggleSwitch
  checked={muteEnabled}
  onChange={(enabled) => updateSetting("mute_while_recording", enabled)}
  isUpdating={updating}
  label={$t("settings.debug.muteWhileRecording.label")}
  description={$t("settings.debug.muteWhileRecording.description")}
  {descriptionMode}
  {grouped}
/>
