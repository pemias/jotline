<script lang="ts">
  import { t } from "@/i18n";
  import SettingContainer from "../../ui/SettingContainer.svelte";
  import Dropdown, { type DropdownOption } from "../../ui/Dropdown.svelte";
  import { settings, isUpdatingKey, refreshSettings } from "@/stores/settingsStore";
  import { commands } from "@/bindings";
  import { toast } from "svelte-sonner";

  const KEYBOARD_IMPLEMENTATION_OPTIONS: DropdownOption[] = [
    { value: "tauri", label: "Tauri Global Shortcut" },
    { value: "handy_keys", label: "Handy Keys" },
  ];

  let {
    descriptionMode = "tooltip",
    grouped = false,
  }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();

  let currentImplementation = $derived(
    $settings?.keyboard_implementation ?? "tauri"
  );

  async function handleSelect(value: string) {
    if (value === currentImplementation) return;

    try {
      const result = await commands.changeKeyboardImplementationSetting(value);

      if (result.status === "error") {
        console.error(
          "Failed to update keyboard implementation:",
          result.error,
        );
        toast.error(String(result.error));
        return;
      }

      if (result.data.reset_bindings.length > 0) {
        toast.warning($t("settings.debug.keyboardImplementation.bindingsReset"));
      }

      await refreshSettings();
    } catch (error) {
      console.error("Failed to update keyboard implementation:", error);
      toast.error(String(error));
    }
  }
</script>

<SettingContainer
  title={$t("settings.debug.keyboardImplementation.title")}
  description={$t("settings.debug.keyboardImplementation.description")}
  {descriptionMode}
  {grouped}
  layout="horizontal"
>
  <Dropdown
    options={KEYBOARD_IMPLEMENTATION_OPTIONS}
    selectedValue={currentImplementation}
    onSelect={handleSelect}
    disabled={isUpdatingKey("keyboard_implementation")}
  />
</SettingContainer>
