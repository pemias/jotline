<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import Dropdown from "../ui/Dropdown.svelte";
  import Input from "../ui/Input.svelte";
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

    if (osType === "linux") {
      options.push({
        value: "external_script",
        label: $t("settings.advanced.pasteMethod.options.externalScript"),
      });
    }

    return options;
  });

  let selectedMethod = $derived(
    ($settings?.paste_method || "ctrl_v") as PasteMethod
  );

  let externalScriptPath = $derived(
    ($settings?.external_script_path || "") as string
  );
</script>

<SettingContainer
  title={$t("settings.advanced.pasteMethod.title")}
  description={$t("settings.advanced.pasteMethod.description")}
  {descriptionMode}
  {grouped}
  tooltipPosition="bottom"
>
  <div class="flex flex-col gap-2">
    <Dropdown
      options={pasteMethodOptions}
      selectedValue={selectedMethod}
      onSelect={(value) => updateSetting("paste_method", value as PasteMethod)}
      disabled={isUpdatingKey("paste_method")}
    />
    {#if selectedMethod === "external_script"}
      <Input
        type="text"
        value={externalScriptPath}
        oninput={(e) => updateSetting("external_script_path", (e.target as HTMLInputElement).value)}
        placeholder={$t("settings.advanced.pasteMethod.externalScriptPlaceholder")}
        disabled={isUpdatingKey("external_script_path")}
      />
    {/if}
  </div>
</SettingContainer>
