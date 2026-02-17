<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting } from "@/stores/settingsStore";
  import { commands, type ModelUnloadTimeout } from "@/bindings";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";

  let { descriptionMode = "inline", grouped = false }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();

  let timeoutOptions = $derived([
    { value: "never", label: $t("settings.advanced.modelUnload.options.never") },
    { value: "immediately", label: $t("settings.advanced.modelUnload.options.immediately") },
    { value: "min2", label: $t("settings.advanced.modelUnload.options.min2") },
    { value: "min5", label: $t("settings.advanced.modelUnload.options.min5") },
    { value: "min10", label: $t("settings.advanced.modelUnload.options.min10") },
    { value: "min15", label: $t("settings.advanced.modelUnload.options.min15") },
    { value: "hour1", label: $t("settings.advanced.modelUnload.options.hour1") },
  ]);

  let debugTimeoutOptions = $derived([
    ...timeoutOptions,
    { value: "sec5", label: $t("settings.advanced.modelUnload.options.sec5") },
  ]);

  let currentValue = $derived($settings?.model_unload_timeout ?? "never");
  let options = $derived($settings?.debug_mode === true ? debugTimeoutOptions : timeoutOptions);

  async function handleChange(value: string) {
    const newTimeout = value as ModelUnloadTimeout;
    try {
      await commands.setModelUnloadTimeout(newTimeout);
      updateSetting("model_unload_timeout", newTimeout);
    } catch (error) {
      console.error("Failed to update model unload timeout:", error);
    }
  }
</script>

<SettingContainer
  title={$t("settings.advanced.modelUnload.title")}
  description={$t("settings.advanced.modelUnload.description")}
  {descriptionMode}
  {grouped}
>
  <Dropdown
    {options}
    selectedValue={currentValue}
    onSelect={handleChange}
    disabled={false}
  />
</SettingContainer>
