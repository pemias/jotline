<script lang="ts">
  import { t } from "@/i18n";
  import Slider from "../../ui/Slider.svelte";
  import { settings, updateSetting } from "@/stores/settingsStore";

  let {
    descriptionMode = "tooltip",
    grouped = false,
  }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();

  function handleThresholdChange(value: number) {
    updateSetting("word_correction_threshold", value);
  }
</script>

<Slider
  value={$settings?.word_correction_threshold ?? 0.18}
  onChange={handleThresholdChange}
  min={0.0}
  max={1.0}
  label={$t("settings.debug.wordCorrectionThreshold.title")}
  description={$t("settings.debug.wordCorrectionThreshold.description")}
  {descriptionMode}
  {grouped}
/>
