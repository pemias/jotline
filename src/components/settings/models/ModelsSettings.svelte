<script lang="ts">
  import { t } from "@/i18n";
  import { ask } from "@tauri-apps/plugin-dialog";
  import { ChevronDown, Globe } from "lucide-svelte";
  import type { ModelCardStatus } from "@/components/onboarding/ModelCard.svelte";
  import ModelCard from "@/components/onboarding/ModelCard.svelte";
  import {
    models,
    currentModel,
    downloadingModels,
    downloadProgress,
    downloadStats,
    extractingModels,
    loading,
    downloadModel,
    cancelDownload,
    selectModel,
    deleteModel,
  } from "@/stores/modelStore";
  import { LANGUAGES } from "@/lib/constants/languages";
  import type { ModelInfo } from "@/bindings";

  const modelSupportsLanguage = (model: ModelInfo, langCode: string): boolean => {
    return model.supported_languages.includes(langCode);
  };

  let switchingModelId = $state<string | null>(null);
  let languageFilter = $state("all");
  let languageDropdownOpen = $state(false);
  let languageSearch = $state("");
  let languageDropdownRef: HTMLDivElement | undefined = $state();
  let languageSearchInputRef: HTMLInputElement | undefined = $state();

  // click outside handler for language dropdown
  $effect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageDropdownRef &&
        !languageDropdownRef.contains(event.target as Node)
      ) {
        languageDropdownOpen = false;
        languageSearch = "";
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  // focus search input when dropdown opens
  $effect(() => {
    if (languageDropdownOpen && languageSearchInputRef) {
      languageSearchInputRef.focus();
    }
  });

  // filtered languages for dropdown (exclude "auto")
  let filteredLanguages = $derived(
    LANGUAGES.filter(
      (lang) =>
        lang.value !== "auto" &&
        lang.label.toLowerCase().includes(languageSearch.toLowerCase())
    )
  );

  // Get selected language label
  let selectedLanguageLabel = $derived(
    languageFilter === "all"
      ? $t("settings.models.filters.allLanguages")
      : LANGUAGES.find((lang) => lang.value === languageFilter)?.label || ""
  );

  const getModelStatus = (modelId: string): ModelCardStatus => {
    if (modelId in $extractingModels) return "extracting";
    if (modelId in $downloadingModels) return "downloading";
    if (switchingModelId === modelId) return "switching";
    if (modelId === $currentModel) return "active";
    const model = $models.find((m: ModelInfo) => m.id === modelId);
    if (model?.is_downloaded) return "available";
    return "downloadable";
  };

  const getDownloadProgress = (modelId: string): number | undefined => {
    const progress = $downloadProgress[modelId];
    return progress?.percentage;
  };

  const getDownloadSpeed = (modelId: string): number | undefined => {
    const stats = $downloadStats[modelId];
    return stats?.speed;
  };

  const handleModelSelect = async (modelId: string) => {
    switchingModelId = modelId;
    try {
      await selectModel(modelId);
    } finally {
      switchingModelId = null;
    }
  };

  const handleModelDownload = async (modelId: string) => {
    await downloadModel(modelId);
  };

  const handleModelDelete = async (modelId: string) => {
    const model = $models.find((m: ModelInfo) => m.id === modelId);
    const modelName = model?.name || modelId;
    const isActive = modelId === $currentModel;

    const confirmed = await ask(
      isActive
        ? $t("settings.models.deleteActiveConfirm", { modelName })
        : $t("settings.models.deleteConfirm", { modelName }),
      {
        title: $t("settings.models.deleteTitle"),
        kind: "warning",
      }
    );

    if (confirmed) {
      try {
        await deleteModel(modelId);
      } catch (err) {
        console.error(`Failed to delete model ${modelId}:`, err);
      }
    }
  };

  const handleModelCancel = async (modelId: string) => {
    try {
      await cancelDownload(modelId);
    } catch (err) {
      console.error(`Failed to cancel download for ${modelId}:`, err);
    }
  };

  // Filter models based on language filter
  let filteredModels = $derived(
    $models.filter((model: ModelInfo) => {
      if (languageFilter !== "all") {
        if (!modelSupportsLanguage(model, languageFilter)) return false;
      }
      return true;
    })
  );

  // Split filtered models into downloaded and available sections
  let downloadedModels = $derived.by(() => {
    const downloaded: ModelInfo[] = [];
    for (const model of filteredModels) {
      if (
        model.is_custom ||
        model.is_downloaded ||
        model.id in $downloadingModels ||
        model.id in $extractingModels
      ) {
        downloaded.push(model);
      }
    }
    // Sort: active model first, then non-custom, then custom at the bottom
    downloaded.sort((a, b) => {
      if (a.id === $currentModel) return -1;
      if (b.id === $currentModel) return 1;
      if (a.is_custom !== b.is_custom) return a.is_custom ? 1 : -1;
      return 0;
    });
    return downloaded;
  });

  let availableModels = $derived.by(() => {
    const available: ModelInfo[] = [];
    for (const model of filteredModels) {
      if (
        !model.is_custom &&
        !model.is_downloaded &&
        !(model.id in $downloadingModels) &&
        !(model.id in $extractingModels)
      ) {
        available.push(model);
      }
    }
    return available;
  });
</script>

{#if $loading}
  <div class="max-w-3xl w-full mx-auto">
    <div class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-logo-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
{:else}
  <div class="max-w-3xl w-full mx-auto space-y-4">
    <div class="mb-4">
      <h1 class="text-xl font-semibold mb-2">
        {$t("settings.models.title")}
      </h1>
      <p class="text-sm text-text/60">
        {$t("settings.models.description")}
      </p>
    </div>
    {#if filteredModels.length > 0}
      <div class="space-y-6">
        <!-- Downloaded Models Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-text/60">
              {$t("settings.models.yourModels")}
            </h2>
            <!-- Language filter dropdown -->
            <div class="relative" bind:this={languageDropdownRef}>
              <button
                type="button"
                onclick={() => (languageDropdownOpen = !languageDropdownOpen)}
                class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {languageFilter !== 'all'
                  ? 'bg-logo-primary/20 text-logo-primary'
                  : 'bg-mid-gray/10 text-text/60 hover:bg-mid-gray/20'}"
              >
                <Globe class="w-3.5 h-3.5" />
                <span class="max-w-[120px] truncate">
                  {selectedLanguageLabel}
                </span>
                <ChevronDown
                  class="w-3.5 h-3.5 transition-transform {languageDropdownOpen ? 'rotate-180' : ''}"
                />
              </button>

              {#if languageDropdownOpen}
                <div class="absolute top-full right-0 mt-1 w-56 bg-background border border-mid-gray/80 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div class="p-2 border-b border-mid-gray/40">
                    <input
                      bind:this={languageSearchInputRef}
                      type="text"
                      bind:value={languageSearch}
                      onkeydown={(e: KeyboardEvent) => {
                        if (e.key === "Enter" && filteredLanguages.length > 0) {
                          languageFilter = filteredLanguages[0].value;
                          languageDropdownOpen = false;
                          languageSearch = "";
                        } else if (e.key === "Escape") {
                          languageDropdownOpen = false;
                          languageSearch = "";
                        }
                      }}
                      placeholder={$t("settings.general.language.searchPlaceholder")}
                      class="w-full px-2 py-1 text-sm bg-mid-gray/10 border border-mid-gray/40 rounded-md focus:outline-none focus:ring-1 focus:ring-logo-primary"
                    />
                  </div>
                  <div class="max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onclick={() => {
                        languageFilter = "all";
                        languageDropdownOpen = false;
                        languageSearch = "";
                      }}
                      class="w-full px-3 py-1.5 text-sm text-left transition-colors {languageFilter === 'all'
                        ? 'bg-logo-primary/20 text-logo-primary font-semibold'
                        : 'hover:bg-mid-gray/10'}"
                    >
                      {$t("settings.models.filters.allLanguages")}
                    </button>
                    {#each filteredLanguages as lang (lang.value)}
                      <button
                        type="button"
                        onclick={() => {
                          languageFilter = lang.value;
                          languageDropdownOpen = false;
                          languageSearch = "";
                        }}
                        class="w-full px-3 py-1.5 text-sm text-left transition-colors {languageFilter === lang.value
                          ? 'bg-logo-primary/20 text-logo-primary font-semibold'
                          : 'hover:bg-mid-gray/10'}"
                      >
                        {lang.label}
                      </button>
                    {/each}
                    {#if filteredLanguages.length === 0}
                      <div class="px-3 py-2 text-sm text-text/50 text-center">
                        {$t("settings.general.language.noResults")}
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </div>
          {#each downloadedModels as model (model.id)}
            <ModelCard
              {model}
              status={getModelStatus(model.id)}
              onSelect={handleModelSelect}
              onDownload={handleModelDownload}
              onDelete={handleModelDelete}
              onCancel={handleModelCancel}
              downloadProgress={getDownloadProgress(model.id)}
              downloadSpeed={getDownloadSpeed(model.id)}
              showRecommended={false}
            />
          {/each}
        </div>

        <!-- Available Models Section -->
        {#if availableModels.length > 0}
          <div class="space-y-3">
            <h2 class="text-sm font-medium text-text/60">
              {$t("settings.models.availableModels")}
            </h2>
            {#each availableModels as model (model.id)}
              <ModelCard
                {model}
                status={getModelStatus(model.id)}
                onSelect={handleModelSelect}
                onDownload={handleModelDownload}
                onDelete={handleModelDelete}
                onCancel={handleModelCancel}
                downloadProgress={getDownloadProgress(model.id)}
                downloadSpeed={getDownloadSpeed(model.id)}
                showRecommended={false}
              />
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-8 text-text/50">
        {$t("settings.models.noModelsMatch")}
      </div>
    {/if}
  </div>
{/if}
