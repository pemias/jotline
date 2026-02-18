<script lang="ts">
  import { t } from "@/i18n";
  import { type } from "@tauri-apps/plugin-os";
  import WordCorrectionThreshold from "./WordCorrectionThreshold.svelte";
  import LogLevelSelector from "./LogLevelSelector.svelte";
  import PasteDelay from "./PasteDelay.svelte";
  import DebugPaths from "./DebugPaths.svelte";
  import SettingsGroup from "../../ui/SettingsGroup.svelte";
  import AlwaysOnMicrophone from "../AlwaysOnMicrophone.svelte";
  import SoundPicker from "../SoundPicker.svelte";
  import ClamshellMicrophoneSelector from "../ClamshellMicrophoneSelector.svelte";
  import ShortcutInput from "../ShortcutInput.svelte";
  import UpdateChecksToggle from "../UpdateChecksToggle.svelte";
  import { settings } from "@/stores/settingsStore";

  let pushToTalk = $derived($settings?.push_to_talk);
  const isLinux = type() === "linux";
</script>

<div class="max-w-3xl w-full mx-auto space-y-6">
  <SettingsGroup title={$t("settings.debug.title")}>
    <LogLevelSelector grouped={true} />
    <UpdateChecksToggle descriptionMode="tooltip" grouped={true} />
    <SoundPicker
      label={$t("settings.debug.soundTheme.label")}
      description={$t("settings.debug.soundTheme.description")}
    />
    <WordCorrectionThreshold descriptionMode="tooltip" grouped={true} />
    <PasteDelay descriptionMode="tooltip" grouped={true} />
    <DebugPaths descriptionMode="tooltip" grouped={true} />
    <AlwaysOnMicrophone descriptionMode="tooltip" grouped={true} />
    <ClamshellMicrophoneSelector descriptionMode="tooltip" grouped={true} />
    {#if !isLinux}
      <ShortcutInput
        shortcutId="cancel"
        grouped={true}
        disabled={pushToTalk}
      />
    {/if}
  </SettingsGroup>
</div>
