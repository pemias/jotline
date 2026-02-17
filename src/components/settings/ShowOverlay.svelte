<script lang="ts">
  import { t } from "@/i18n";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import type { OverlayPosition } from "@/bindings";

  let {
    descriptionMode = "tooltip",
    grouped = false,
  }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let overlayOptions = $derived([
    { value: "none", label: $t("settings.advanced.overlay.options.none") },
    { value: "bottom", label: $t("settings.advanced.overlay.options.bottom") },
    { value: "top", label: $t("settings.advanced.overlay.options.top") },
  ]);

  let selectedPosition = $derived(
    ($settings?.overlay_position || "bottom") as OverlayPosition
  );
</script>

<SettingContainer
  title={$t("settings.advanced.overlay.title")}
  description={$t("settings.advanced.overlay.description")}
  {descriptionMode}
  {grouped}
>
  <Dropdown
    options={overlayOptions}
    selectedValue={selectedPosition}
    onSelect={(value) => updateSetting("overlay_position", value as OverlayPosition)}
    disabled={isUpdatingKey("overlay_position")}
  />
</SettingContainer>
