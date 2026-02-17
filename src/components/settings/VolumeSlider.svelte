<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting } from "@/stores/settingsStore";
  import Slider from "../ui/Slider.svelte";

  let { disabled = false }: {
    disabled?: boolean;
  } = $props();

  let audioFeedbackVolume = $derived($settings?.audio_feedback_volume ?? 0.5);
</script>

<Slider
  value={audioFeedbackVolume}
  onChange={(value) => updateSetting("audio_feedback_volume", value)}
  min={0}
  max={1}
  step={0.1}
  label={$t("settings.sound.volume.title")}
  description={$t("settings.sound.volume.description")}
  descriptionMode="tooltip"
  grouped
  formatValue={(value) => `${Math.round(value * 100)}%`}
  {disabled}
/>
