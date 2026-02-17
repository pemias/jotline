<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import type { RecordingRetentionPeriod } from "@/bindings";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let selectedRetentionPeriod = $derived($settings?.recording_retention_period || "never");
  let historyLimit = $derived($settings?.history_limit || 5);

  let retentionOptions = $derived([
    { value: "never", label: $t("settings.debug.recordingRetention.never") },
    {
      value: "preserve_limit",
      label: $t("settings.debug.recordingRetention.preserveLimit", {
        count: Number(historyLimit),
      }),
    },
    { value: "days3", label: $t("settings.debug.recordingRetention.days3") },
    { value: "weeks2", label: $t("settings.debug.recordingRetention.weeks2") },
    { value: "months3", label: $t("settings.debug.recordingRetention.months3") },
  ]);

  async function handleRetentionPeriodSelect(period: string) {
    await updateSetting("recording_retention_period", period as RecordingRetentionPeriod);
  }
</script>

<SettingContainer
  title={$t("settings.debug.recordingRetention.title")}
  description={$t("settings.debug.recordingRetention.description")}
  {descriptionMode}
  {grouped}
>
  <Dropdown
    options={retentionOptions}
    selectedValue={selectedRetentionPeriod}
    onSelect={handleRetentionPeriodSelect}
    placeholder={$t("settings.debug.recordingRetention.placeholder")}
    disabled={isUpdatingKey("recording_retention_period")}
  />
</SettingContainer>
