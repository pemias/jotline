import { get } from "svelte/store";
import {
  settings,
  isUpdatingKey,
  setPostProcessProvider,
  updatePostProcessBaseUrl,
  updatePostProcessApiKey,
  updatePostProcessModel,
  fetchPostProcessModels,
  postProcessModelOptions,
} from "@/stores/settingsStore";
import { commands, type PostProcessProvider } from "@/bindings";
import type { ModelOption } from "./types";
import type { DropdownOption } from "../../ui/Dropdown.svelte";

export type PostProcessProviderState = {
  providerOptions: DropdownOption[];
  selectedProviderId: string;
  selectedProvider: PostProcessProvider | undefined;
  isCustomProvider: boolean;
  isAppleProvider: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  modelOptions: ModelOption[];
  isBaseUrlUpdating: boolean;
  isApiKeyUpdating: boolean;
  isModelUpdating: boolean;
  isFetchingModels: boolean;
  handleProviderSelect: (providerId: string) => Promise<{
    appleIntelligenceUnavailable: boolean;
  }>;
  handleBaseUrlChange: (value: string) => void;
  handleApiKeyChange: (value: string) => void;
  handleModelChange: (value: string) => void;
  handleModelSelect: (value: string) => void;
  handleModelCreate: (value: string) => void;
  handleRefreshModels: () => void;
};

const APPLE_PROVIDER_ID = "apple_intelligence";

/**
 * Get the current post-process provider state by reading from the settings store.
 * This is a plain function, not a React hook. Call it to get a snapshot of the current state.
 */
export function getPostProcessProviderState(): PostProcessProviderState {
  const currentSettings = get(settings);
  const currentModelOptions = get(postProcessModelOptions);

  const providers = currentSettings?.post_process_providers || [];

  const selectedProviderId =
    currentSettings?.post_process_provider_id || providers[0]?.id || "openai";

  const selectedProvider =
    providers.find((provider) => provider.id === selectedProviderId) ||
    providers[0];

  const isAppleProvider = selectedProvider?.id === APPLE_PROVIDER_ID;

  const baseUrl = selectedProvider?.base_url ?? "";
  const apiKey =
    currentSettings?.post_process_api_keys?.[selectedProviderId] ?? "";
  const model =
    currentSettings?.post_process_models?.[selectedProviderId] ?? "";

  const providerOptions: DropdownOption[] = providers.map((provider) => ({
    value: provider.id,
    label: provider.label,
  }));

  const availableModelsRaw = currentModelOptions[selectedProviderId] || [];

  const seen = new Set<string>();
  const modelOptionsList: ModelOption[] = [];

  const upsert = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    modelOptionsList.push({ value: trimmed, label: trimmed });
  };

  for (const candidate of availableModelsRaw) {
    upsert(candidate);
  }
  upsert(model);

  const isBaseUrlUpdating = isUpdatingKey(
    `post_process_base_url:${selectedProviderId}`,
  );
  const isApiKeyUpdating = isUpdatingKey(
    `post_process_api_key:${selectedProviderId}`,
  );
  const isModelUpdating = isUpdatingKey(
    `post_process_model:${selectedProviderId}`,
  );
  const isFetchingModels = isUpdatingKey(
    `post_process_models_fetch:${selectedProviderId}`,
  );

  const isCustomProvider = selectedProvider?.id === "custom";

  const handleProviderSelect = async (
    providerId: string,
  ): Promise<{ appleIntelligenceUnavailable: boolean }> => {
    let appleIntelligenceUnavailable = false;

    if (providerId === selectedProviderId) {
      return { appleIntelligenceUnavailable };
    }

    if (providerId === APPLE_PROVIDER_ID) {
      const available = await commands.checkAppleIntelligenceAvailable();
      if (!available) {
        appleIntelligenceUnavailable = true;
      }
    }

    void setPostProcessProvider(providerId);
    return { appleIntelligenceUnavailable };
  };

  const handleBaseUrlChange = (value: string) => {
    if (!selectedProvider || selectedProvider.id !== "custom") {
      return;
    }
    const trimmed = value.trim();
    if (trimmed && trimmed !== baseUrl) {
      void updatePostProcessBaseUrl(selectedProvider.id, trimmed);
    }
  };

  const handleApiKeyChange = (value: string) => {
    const trimmed = value.trim();
    if (trimmed !== apiKey) {
      void updatePostProcessApiKey(selectedProviderId, trimmed);
    }
  };

  const handleModelChange = (value: string) => {
    const trimmed = value.trim();
    if (trimmed !== model) {
      void updatePostProcessModel(selectedProviderId, trimmed);
    }
  };

  const handleModelSelect = (value: string) => {
    void updatePostProcessModel(selectedProviderId, value.trim());
  };

  const handleModelCreate = (value: string) => {
    void updatePostProcessModel(selectedProviderId, value);
  };

  const handleRefreshModels = () => {
    if (isAppleProvider) return;
    void fetchPostProcessModels(selectedProviderId);
  };

  return {
    providerOptions,
    selectedProviderId,
    selectedProvider,
    isCustomProvider,
    isAppleProvider,
    baseUrl,
    handleBaseUrlChange,
    isBaseUrlUpdating,
    apiKey,
    handleApiKeyChange,
    isApiKeyUpdating,
    model,
    handleModelChange,
    modelOptions: modelOptionsList,
    isModelUpdating,
    isFetchingModels,
    handleProviderSelect,
    handleModelSelect,
    handleModelCreate,
    handleRefreshModels,
  };
}
