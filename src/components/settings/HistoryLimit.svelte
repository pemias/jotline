<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import Input from "../ui/Input.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";

  let { descriptionMode = "inline", grouped = false }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();

  let historyLimit = $derived($settings?.history_limit ?? 5);

  function handleChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value) && value >= 0) {
      updateSetting("history_limit", value);
    }
  }
</script>

<SettingContainer
  title={$t("settings.debug.historyLimit.title")}
  description={$t("settings.debug.historyLimit.description")}
  {descriptionMode}
  {grouped}
  layout="horizontal"
>
  <div class="flex items-center space-x-2">
    <Input
      type="number"
      min="0"
      max="1000"
      value={historyLimit}
      onchange={handleChange}
      disabled={isUpdatingKey("history_limit")}
      class="w-20"
    />
    <span class="text-sm text-text">
      {$t("settings.debug.historyLimit.entries")}
    </span>
  </div>
</SettingContainer>
