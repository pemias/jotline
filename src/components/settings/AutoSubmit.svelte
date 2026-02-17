<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import { getOsType } from "@/lib/utils/osType";
  import type { AutoSubmitKey } from "@/bindings";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  type AutoSubmitOptionValue = AutoSubmitKey | "off";

  let osType = getOsType();

  let enabled = $derived($settings?.auto_submit ?? false);
  let selectedKey = $derived(($settings?.auto_submit_key || "enter") as AutoSubmitKey);
  let selectedValue: AutoSubmitOptionValue = $derived(enabled ? selectedKey : "off");

  let submitWithMetaLabel = $derived(
    osType === "macos"
      ? $t("settings.advanced.autoSubmit.options.cmdEnter")
      : $t("settings.advanced.autoSubmit.options.superEnter")
  );

  let autoSubmitOptions = $derived([
    {
      value: "off",
      label: $t("settings.advanced.autoSubmit.options.off"),
    },
    {
      value: "enter",
      label: $t("settings.advanced.autoSubmit.options.enter"),
    },
    {
      value: "ctrl_enter",
      label: $t("settings.advanced.autoSubmit.options.ctrlEnter"),
    },
    {
      value: "cmd_enter",
      label: submitWithMetaLabel,
    },
  ]);

  async function handleAutoSubmitSelect(value: string) {
    const selected = value as AutoSubmitOptionValue;

    if (selected === "off") {
      await updateSetting("auto_submit", false);
      return;
    }

    await updateSetting("auto_submit_key", selected as AutoSubmitKey);
    if (!enabled) {
      await updateSetting("auto_submit", true);
    }
  }
</script>

<SettingContainer
  title={$t("settings.advanced.autoSubmit.title")}
  description={$t("settings.advanced.autoSubmit.description")}
  {descriptionMode}
  {grouped}
>
  <Dropdown
    options={autoSubmitOptions}
    selectedValue={selectedValue}
    onSelect={handleAutoSubmitSelect}
    disabled={isUpdatingKey("auto_submit") || isUpdatingKey("auto_submit_key")}
  />
</SettingContainer>
