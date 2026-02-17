<script lang="ts">
  import { t } from "@/i18n";
  import { RefreshCcw } from "lucide-svelte";
  import Alert from "../../ui/Alert.svelte";
  import SettingContainer from "../../ui/SettingContainer.svelte";
  import ResetButton from "../../ui/ResetButton.svelte";
  import ProviderSelect from "../PostProcessingSettingsApi/ProviderSelect.svelte";
  import BaseUrlField from "../PostProcessingSettingsApi/BaseUrlField.svelte";
  import ApiKeyField from "../PostProcessingSettingsApi/ApiKeyField.svelte";
  import ModelSelect from "../PostProcessingSettingsApi/ModelSelect.svelte";
  import { getPostProcessProviderState } from "../PostProcessingSettingsApi/usePostProcessProviderState";
  import { settings, isUpdating as isUpdatingStore } from "@/stores/settingsStore";

  // Re-derive state whenever settings or isUpdating changes
  let providerState = $derived.by(() => {
    // Access reactive stores to trigger re-derivation
    $settings;
    $isUpdatingStore;
    return getPostProcessProviderState();
  });

  let appleIntelligenceUnavailable = $state(false);

  async function handleProviderSelect(providerId: string) {
    const result = await providerState.handleProviderSelect(providerId);
    appleIntelligenceUnavailable = result.appleIntelligenceUnavailable;
  }
</script>

<SettingContainer
  title={$t("settings.postProcessing.api.provider.title")}
  description={$t("settings.postProcessing.api.provider.description")}
  descriptionMode="tooltip"
  layout="horizontal"
  grouped={true}
>
  <div class="flex items-center gap-2">
    <ProviderSelect
      options={providerState.providerOptions}
      value={providerState.selectedProviderId}
      onChange={handleProviderSelect}
    />
  </div>
</SettingContainer>

{#if providerState.isAppleProvider}
  {#if appleIntelligenceUnavailable}
    <Alert variant="error" contained>
      {$t("settings.postProcessing.api.appleIntelligence.unavailable")}
    </Alert>
  {/if}
{:else}
  {#if providerState.selectedProvider?.id === "custom"}
    <SettingContainer
      title={$t("settings.postProcessing.api.baseUrl.title")}
      description={$t("settings.postProcessing.api.baseUrl.description")}
      descriptionMode="tooltip"
      layout="horizontal"
      grouped={true}
    >
      <div class="flex items-center gap-2">
        <BaseUrlField
          value={providerState.baseUrl}
          onBlur={providerState.handleBaseUrlChange}
          placeholder={$t("settings.postProcessing.api.baseUrl.placeholder")}
          disabled={providerState.isBaseUrlUpdating}
          class="min-w-[380px]"
        />
      </div>
    </SettingContainer>
  {/if}

  <SettingContainer
    title={$t("settings.postProcessing.api.apiKey.title")}
    description={$t("settings.postProcessing.api.apiKey.description")}
    descriptionMode="tooltip"
    layout="horizontal"
    grouped={true}
  >
    <div class="flex items-center gap-2">
      <ApiKeyField
        value={providerState.apiKey}
        onBlur={providerState.handleApiKeyChange}
        placeholder={$t("settings.postProcessing.api.apiKey.placeholder")}
        disabled={providerState.isApiKeyUpdating}
        class="min-w-[320px]"
      />
    </div>
  </SettingContainer>

  <SettingContainer
    title={$t("settings.postProcessing.api.model.title")}
    description={providerState.isCustomProvider
      ? $t("settings.postProcessing.api.model.descriptionCustom")
      : $t("settings.postProcessing.api.model.descriptionDefault")}
    descriptionMode="tooltip"
    layout="stacked"
    grouped={true}
  >
    <div class="flex items-center gap-2">
      <ModelSelect
        value={providerState.model}
        options={providerState.modelOptions}
        disabled={providerState.isModelUpdating}
        isLoading={providerState.isFetchingModels}
        placeholder={providerState.modelOptions.length > 0
          ? $t("settings.postProcessing.api.model.placeholderWithOptions")
          : $t("settings.postProcessing.api.model.placeholderNoOptions")}
        onSelect={providerState.handleModelSelect}
        onCreate={providerState.handleModelCreate}
        onBlur={() => {}}
        class="flex-1 min-w-[380px]"
      />
      <ResetButton
        onclick={providerState.handleRefreshModels}
        disabled={providerState.isFetchingModels}
        ariaLabel={$t("settings.postProcessing.api.model.refreshModels")}
        class="flex h-10 w-10 items-center justify-center"
      >
        <RefreshCcw
          class="h-4 w-4 {providerState.isFetchingModels ? 'animate-spin' : ''}"
        />
      </ResetButton>
    </div>
  </SettingContainer>
{/if}
