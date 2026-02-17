<script lang="ts">
  import { t } from "@/i18n";
  import { listen } from "@tauri-apps/api/event";
  import { commands } from "@/bindings";
  import { getTranslatedModelName } from "../../lib/utils/modelTranslation";
  import {
    models,
    currentModel,
    downloadProgress,
    downloadStats,
    extractingModels,
    selectModel,
  } from "../../stores/modelStore";
  import ModelStatusButton from "./ModelStatusButton.svelte";
  import ModelDropdown from "./ModelDropdown.svelte";
  import DownloadProgressDisplay from "./DownloadProgressDisplay.svelte";

  interface ModelStateEvent {
    event_type: string;
    model_id?: string;
    model_name?: string;
    error?: string;
  }

  type ModelStatus =
    | "ready"
    | "loading"
    | "downloading"
    | "extracting"
    | "error"
    | "unloaded"
    | "none";

  let {
    onError,
  }: {
    onError?: (error: string) => void;
  } = $props();

  let modelStatus = $state<ModelStatus>("unloaded");
  let modelError = $state<string | null>(null);
  let showModelDropdown = $state(false);
  let pendingModelId = $state<string | null>(null);
  let dropdownRef: HTMLDivElement | undefined = $state();

  let displayModelId = $derived(pendingModelId || $currentModel);

  // Check model status when currentModel changes
  $effect(() => {
    const cm = $currentModel;
    const checkStatus = async () => {
      if (cm) {
        try {
          const statusResult = await commands.getTranscriptionModelStatus();
          if (statusResult.status === "ok") {
            modelStatus = statusResult.data === cm ? "ready" : "unloaded";
          }
        } catch {
          modelStatus = "error";
          modelError = "Failed to check model status";
        }
      } else {
        modelStatus = "none";
      }
    };
    checkStatus();
  });

  // Listen for model events + click outside
  $effect(() => {
    const modelStateUnlisten = listen<ModelStateEvent>(
      "model-state-changed",
      (event) => {
        const { event_type, error } = event.payload;
        switch (event_type) {
          case "loading_started":
            modelStatus = "loading";
            modelError = null;
            break;
          case "loading_completed":
            modelStatus = "ready";
            modelError = null;
            pendingModelId = null;
            break;
          case "loading_failed":
            modelStatus = "error";
            modelError = error || "Failed to load model";
            pendingModelId = null;
            break;
          case "unloaded":
            modelStatus = "unloaded";
            modelError = null;
            break;
        }
      }
    );

    const downloadCompleteUnlisten = listen<string>(
      "model-download-complete",
      (event) => {
        const modelId = event.payload;
        setTimeout(async () => {
          try {
            const isRecording = await commands.isRecording();
            if (!isRecording) {
              pendingModelId = modelId;
              modelError = null;
              showModelDropdown = false;
              const success = await selectModel(modelId);
              if (!success) {
                pendingModelId = null;
              }
            }
          } catch {
            // Ignore errors in auto-select
          }
        }, 500);
      }
    );

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        showModelDropdown = false;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      modelStateUnlisten.then((fn) => fn());
      downloadCompleteUnlisten.then((fn) => fn());
    };
  });

  const handleModelSelect = async (modelId: string) => {
    pendingModelId = modelId;
    modelError = null;
    showModelDropdown = false;
    const success = await selectModel(modelId);
    if (!success) {
      pendingModelId = null;
      modelStatus = "error";
      modelError = "Failed to switch model";
      onError?.("Failed to switch model");
    }
  };

  const getModelDisplayText = (): string => {
    const extractingKeys = Object.keys($extractingModels);
    if (extractingKeys.length > 0) {
      if (extractingKeys.length === 1) {
        const modelId = extractingKeys[0];
        const model = $models.find((m) => m.id === modelId);
        const modelName = model
          ? getTranslatedModelName(model, $t)
          : $t("modelSelector.extractingGeneric").replace("...", "");
        return $t("modelSelector.extracting", { modelName });
      } else {
        return $t("modelSelector.extractingMultiple", {
          count: extractingKeys.length,
        });
      }
    }

    const progressValues = Object.values($downloadProgress);
    if (progressValues.length > 0) {
      if (progressValues.length === 1) {
        const progress = progressValues[0];
        const percentage = Math.max(
          0,
          Math.min(100, Math.round(progress.percentage))
        );
        return $t("modelSelector.downloading", { percentage });
      } else {
        return $t("modelSelector.downloadingMultiple", {
          count: progressValues.length,
        });
      }
    }

    const currentModelInfo = $models.find((m) => m.id === displayModelId);

    switch (modelStatus) {
      case "ready":
        return currentModelInfo
          ? getTranslatedModelName(currentModelInfo, $t)
          : $t("modelSelector.modelReady");
      case "loading":
        return currentModelInfo
          ? $t("modelSelector.loading", {
              modelName: getTranslatedModelName(currentModelInfo, $t),
            })
          : $t("modelSelector.loadingGeneric");
      case "extracting":
        return currentModelInfo
          ? $t("modelSelector.extracting", {
              modelName: getTranslatedModelName(currentModelInfo, $t),
            })
          : $t("modelSelector.extractingGeneric");
      case "error":
        return modelError || $t("modelSelector.modelError");
      case "unloaded":
        return currentModelInfo
          ? getTranslatedModelName(currentModelInfo, $t)
          : $t("modelSelector.modelUnloaded");
      case "none":
        return $t("modelSelector.noModelDownloadRequired");
      default:
        return currentModelInfo
          ? getTranslatedModelName(currentModelInfo, $t)
          : $t("modelSelector.modelUnloaded");
    }
  };

  let displayStatus = $derived.by<ModelStatus>(() => {
    if (Object.keys($extractingModels).length > 0) return "extracting";
    if (Object.keys($downloadProgress).length > 0) return "downloading";
    return modelStatus;
  });
</script>

<!-- Model Status and Switcher -->
<div class="relative" bind:this={dropdownRef}>
  <ModelStatusButton
    status={displayStatus}
    displayText={getModelDisplayText()}
    isDropdownOpen={showModelDropdown}
    onclick={() => (showModelDropdown = !showModelDropdown)}
  />

  {#if showModelDropdown}
    <ModelDropdown
      models={$models}
      currentModelId={displayModelId}
      onModelSelect={handleModelSelect}
    />
  {/if}
</div>

<!-- Download Progress Bar for Models -->
<DownloadProgressDisplay
  downloadProgress={$downloadProgress}
  downloadStats={$downloadStats}
/>
