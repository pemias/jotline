<script lang="ts">
  import { t } from "@/i18n";
  import { currentModel, models } from "@/stores/modelStore";
  import type { ModelInfo } from "@/bindings";
  import SettingsGroup from "../../ui/SettingsGroup.svelte";
  import LanguageSelector from "../LanguageSelector.svelte";
  import TranslateToEnglish from "../TranslateToEnglish.svelte";

  let currentModelInfo = $derived(
    $models.find((m: ModelInfo) => m.id === $currentModel)
  );

  let supportsLanguageSelection = $derived(
    currentModelInfo?.engine_type === "Whisper" ||
    currentModelInfo?.engine_type === "SenseVoice"
  );

  let supportsTranslation = $derived(
    currentModelInfo?.supports_translation ?? false
  );

  let hasAnySettings = $derived(
    supportsLanguageSelection || supportsTranslation
  );
</script>

{#if $currentModel && currentModelInfo && hasAnySettings}
  <SettingsGroup
    title={$t("settings.modelSettings.title", {
      model: currentModelInfo.name,
    })}
  >
    {#if supportsLanguageSelection}
      <LanguageSelector
        descriptionMode="tooltip"
        grouped={true}
        supportedLanguages={currentModelInfo.supported_languages}
      />
    {/if}
    {#if supportsTranslation}
      <TranslateToEnglish descriptionMode="tooltip" grouped={true} />
    {/if}
  </SettingsGroup>
{/if}
