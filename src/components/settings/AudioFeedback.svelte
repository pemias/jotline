<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import ToggleSwitch from "../ui/ToggleSwitch.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let audioFeedbackEnabled = $derived($settings?.audio_feedback || false);
  let updating = $derived(isUpdatingKey("audio_feedback"));
</script>

<div class="flex flex-col">
  <ToggleSwitch
    checked={audioFeedbackEnabled}
    onChange={(enabled) => updateSetting("audio_feedback", enabled)}
    isUpdating={updating}
    label={$t("settings.sound.audioFeedback.label")}
    description={$t("settings.sound.audioFeedback.description")}
    {descriptionMode}
    {grouped}
  />
</div>
