<script lang="ts">
  import { t } from "@/i18n";
  import type { ModelInfo } from "@/bindings";
  import {
    getTranslatedModelName,
    getTranslatedModelDescription,
  } from "../../lib/utils/modelTranslation";

  let {
    models,
    currentModelId,
    onModelSelect,
  }: {
    models: ModelInfo[];
    currentModelId: string;
    onModelSelect: (modelId: string) => void;
  } = $props();

  let downloadedModels = $derived(models.filter((m) => m.is_downloaded));

  const handleModelClick = (modelId: string) => {
    onModelSelect(modelId);
  };
</script>

<div class="absolute bottom-full start-0 mb-2 w-64 max-h-[60vh] overflow-y-auto bg-background border border-mid-gray/20 rounded-lg shadow-lg py-2 z-50">
  {#if downloadedModels.length > 0}
    <div>
      {#each downloadedModels as model (model.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => handleModelClick(model.id)}
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleModelClick(model.id);
            }
          }}
          tabindex={0}
          role="button"
          class="w-full px-3 py-2 text-start hover:bg-mid-gray/10 transition-colors cursor-pointer focus:outline-none {currentModelId === model.id
            ? 'bg-logo-primary/10 text-logo-primary'
            : ''}"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-text/80">
                {getTranslatedModelName(model, $t)}
                {#if model.is_custom}
                  <span class="ms-1.5 text-[10px] font-medium text-text/40 uppercase">
                    {$t("modelSelector.custom")}
                  </span>
                {/if}
              </div>
              <div class="text-xs text-text/40 italic pe-4">
                {getTranslatedModelDescription(model, $t)}
              </div>
            </div>
            {#if currentModelId === model.id}
              <div class="text-xs text-logo-primary">
                {$t("modelSelector.active")}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="px-3 py-2 text-sm text-text/60">
      {$t("modelSelector.noModelsAvailable")}
    </div>
  {/if}
</div>
