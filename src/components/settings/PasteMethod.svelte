<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import { getOsType } from "@/lib/utils/osType";
  import type { PasteMethod } from "@/bindings";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let osType = getOsType();

  let pasteMethodOptions = $derived.by(() => {
    const mod = osType === "macos" ? "Cmd" : "Ctrl";

    const options = [
      {
        value: "ctrl_v",
        label: $t("settings.advanced.pasteMethod.options.clipboard", { modifier: mod }),
      },
      {
        value: "direct",
        label: $t("settings.advanced.pasteMethod.options.direct"),
      },
      {
        value: "none",
        label: $t("settings.advanced.pasteMethod.options.none"),
      },
    ];

    if (osType === "windows" || osType === "linux") {
      options.push(
        {
          value: "ctrl_shift_v",
          label: $t("settings.advanced.pasteMethod.options.clipboardCtrlShiftV"),
        },
        {
          value: "shift_insert",
          label: $t("settings.advanced.pasteMethod.options.clipboardShiftInsert"),
        },
      );
    }

    return options;
  });

  let selectedMethod = $derived(
    ($settings?.paste_method || "ctrl_v") as PasteMethod
  );
</script>

<SettingContainer
  title={$t("settings.advanced.pasteMethod.title")}
  description={$t("settings.advanced.pasteMethod.description")}
  {descriptionMode}
  {grouped}
  tooltipPosition="bottom"
>
  <Dropdown
    options={pasteMethodOptions}
    selectedValue={selectedMethod}
    onSelect={(value) => updateSetting("paste_method", value as PasteMethod)}
    disabled={isUpdatingKey("paste_method")}
  />
</SettingContainer>
