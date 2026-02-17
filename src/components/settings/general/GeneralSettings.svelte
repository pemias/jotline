<script lang="ts">
  import { t } from "@/i18n";
  import { settings } from "@/stores/settingsStore";
  import MicrophoneSelector from "../MicrophoneSelector.svelte";
  import ShortcutInput from "../ShortcutInput.svelte";
  import SettingsGroup from "../../ui/SettingsGroup.svelte";
  import OutputDeviceSelector from "../OutputDeviceSelector.svelte";
  import PushToTalk from "../PushToTalk.svelte";
  import AudioFeedback from "../AudioFeedback.svelte";
  import VolumeSlider from "../VolumeSlider.svelte";
  import MuteWhileRecording from "../MuteWhileRecording.svelte";
  import ModelSettingsCard from "./ModelSettingsCard.svelte";

  let audioFeedbackEnabled = $derived($settings?.audio_feedback ?? false);
</script>

<div class="max-w-3xl w-full mx-auto space-y-6">
  <SettingsGroup title={$t("settings.general.title")}>
    <ShortcutInput shortcutId="transcribe" grouped={true} />
    <PushToTalk descriptionMode="tooltip" grouped={true} />
  </SettingsGroup>
  <ModelSettingsCard />
  <SettingsGroup title={$t("settings.sound.title")}>
    <MicrophoneSelector descriptionMode="tooltip" grouped={true} />
    <MuteWhileRecording descriptionMode="tooltip" grouped={true} />
    <AudioFeedback descriptionMode="tooltip" grouped={true} />
    <OutputDeviceSelector
      descriptionMode="tooltip"
      grouped={true}
      disabled={!audioFeedbackEnabled}
    />
    <VolumeSlider disabled={!audioFeedbackEnabled} />
  </SettingsGroup>
</div>
