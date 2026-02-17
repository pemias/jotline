<script lang="ts">
  import { t } from "@/i18n";
  import SettingsGroup from "../../ui/SettingsGroup.svelte";
  import ShortcutInput from "../ShortcutInput.svelte";
  import PostProcessingSettingsApi from "./PostProcessingSettingsApi.svelte";
  import PostProcessingSettingsPrompts from "./PostProcessingSettingsPrompts.svelte";
</script>

<div class="max-w-3xl w-full mx-auto space-y-6">
  <SettingsGroup title={$t("settings.postProcessing.hotkey.title")}>
    <ShortcutInput
      shortcutId="transcribe_with_post_process"
      descriptionMode="tooltip"
      grouped={true}
    />
  </SettingsGroup>

  <SettingsGroup title={$t("settings.postProcessing.api.title")}>
    <PostProcessingSettingsApi />
  </SettingsGroup>

  <SettingsGroup title={$t("settings.postProcessing.prompts.title")}>
    <PostProcessingSettingsPrompts />
  </SettingsGroup>
</div>
