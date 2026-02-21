<script lang="ts">
  import { t } from "@/i18n";
  import { settings } from "@/stores/settingsStore";
  import ShowOverlay from "../ShowOverlay.svelte";
  import ModelUnloadTimeoutSetting from "../ModelUnloadTimeout.svelte";
  import CustomWords from "../CustomWords.svelte";
  import SettingsGroup from "../../ui/SettingsGroup.svelte";
  import StartHidden from "../StartHidden.svelte";
  import AutostartToggle from "../AutostartToggle.svelte";
  import ShowTrayIcon from "../ShowTrayIcon.svelte";
  import PasteMethodSetting from "../PasteMethod.svelte";
  import TypingToolSetting from "../TypingTool.svelte";
  import ClipboardHandlingSetting from "../ClipboardHandling.svelte";
  import AutoSubmit from "../AutoSubmit.svelte";
  import PostProcessingToggle from "../PostProcessingToggle.svelte";
  import AppendTrailingSpace from "../AppendTrailingSpace.svelte";
  import ExperimentalToggle from "../ExperimentalToggle.svelte";
  import KeyboardImplementationSelector from "../debug/KeyboardImplementationSelector.svelte";

  let experimentalEnabled = $derived($settings?.experimental_enabled || false);
</script>

<div class="max-w-3xl w-full mx-auto space-y-6">
  <SettingsGroup title={$t("settings.advanced.groups.app")}>
    <StartHidden descriptionMode="tooltip" grouped={true} />
    <AutostartToggle descriptionMode="tooltip" grouped={true} />
    <ShowTrayIcon descriptionMode="tooltip" grouped={true} />
    <ShowOverlay descriptionMode="tooltip" grouped={true} />
    <ModelUnloadTimeoutSetting descriptionMode="tooltip" grouped={true} />
    <ExperimentalToggle descriptionMode="tooltip" grouped={true} />
  </SettingsGroup>

  <SettingsGroup title={$t("settings.advanced.groups.output")}>
    <PasteMethodSetting descriptionMode="tooltip" grouped={true} />
    <TypingToolSetting descriptionMode="tooltip" grouped={true} />
    <ClipboardHandlingSetting descriptionMode="tooltip" grouped={true} />
    <AutoSubmit descriptionMode="tooltip" grouped={true} />
  </SettingsGroup>

  <SettingsGroup title={$t("settings.advanced.groups.transcription")}>
    <CustomWords descriptionMode="tooltip" grouped={true} />
    <AppendTrailingSpace descriptionMode="tooltip" grouped={true} />
  </SettingsGroup>

  {#if experimentalEnabled}
    <SettingsGroup title={$t("settings.advanced.groups.experimental")}>
      <PostProcessingToggle descriptionMode="tooltip" grouped={true} />
      <KeyboardImplementationSelector descriptionMode="tooltip" grouped={true} />
    </SettingsGroup>
  {/if}
</div>
