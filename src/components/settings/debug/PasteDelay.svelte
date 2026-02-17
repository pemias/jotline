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

  function handleDelayChange(value: number) {
    updateSetting("paste_delay_ms", value);
  }
</script>

<Slider
  value={$settings?.paste_delay_ms ?? 60}
  onChange={handleDelayChange}
  min={10}
  max={200}
  step={10}
  label={$t("settings.debug.pasteDelay.title")}
  description={$t("settings.debug.pasteDelay.description")}
  {descriptionMode}
  {grouped}
  formatValue={(v) => `${v}ms`}
/>
