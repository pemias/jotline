<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import type { ClipboardHandling } from "@/bindings";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let clipboardHandlingOptions = $derived([
    {
      value: "dont_modify",
      label: $t("settings.advanced.clipboardHandling.options.dontModify"),
    },
    {
      value: "copy_to_clipboard",
      label: $t("settings.advanced.clipboardHandling.options.copyToClipboard"),
    },
  ]);

  let selectedHandling = $derived(
    ($settings?.clipboard_handling || "dont_modify") as ClipboardHandling
  );
</script>

<SettingContainer
  title={$t("settings.advanced.clipboardHandling.title")}
  description={$t("settings.advanced.clipboardHandling.description")}
  {descriptionMode}
  {grouped}
>
  <Dropdown
    options={clipboardHandlingOptions}
    selectedValue={selectedHandling}
    onSelect={(value) => updateSetting("clipboard_handling", value as ClipboardHandling)}
    disabled={isUpdatingKey("clipboard_handling")}
  />
</SettingContainer>
