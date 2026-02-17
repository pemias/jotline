import { writable, get } from "svelte/store";
import { listen } from "@tauri-apps/api/event";
import { commands, type ModelInfo } from "@/bindings";

interface DownloadProgress {
  model_id: string;
  downloaded: number;
  total: number;
  percentage: number;
}

interface DownloadStats {
  startTime: number;
  lastUpdate: number;
  totalDownloaded: number;
  speed: number; // MB/s
}

// --- Writable stores ---

export const models = writable<ModelInfo[]>([]);
export const currentModel = writable<string>("");
export const downloadingModels = writable<Record<string, true>>({});
export const extractingModels = writable<Record<string, true>>({});
export const downloadProgress = writable<Record<string, DownloadProgress>>({});
export const downloadStats = writable<Record<string, DownloadStats>>({});
export const loading = writable<boolean>(true);
export const error = writable<string | null>(null);
export const hasAnyModels = writable<boolean>(false);
export const isFirstRun = writable<boolean>(false);
export const initialized = writable<boolean>(false);

// --- Actions ---

export async function loadModels(): Promise<void> {
  try {
    const result = await commands.getAvailableModels();
    if (result.status === "ok") {
      models.set(result.data);
      error.set(null);

      // Sync downloading state from backend
      const backendDownloading: Record<string, true> = {};
      result.data
        .filter((m) => m.is_downloading)
        .forEach((m) => {
          backendDownloading[m.id] = true;
        });

      downloadingModels.update((current) => {
        const updated = { ...current };

        // Merge: keep frontend state if downloading, add backend state
        Object.keys(backendDownloading).forEach((id) => {
          updated[id] = true;
        });

        // Remove models that backend says are NOT downloading AND
        // frontend doesn't have progress for (completed/cancelled)
        const currentProgress = get(downloadProgress);
        Object.keys(updated).forEach((id) => {
          if (!backendDownloading[id] && !currentProgress[id]) {
            delete updated[id];
          }
        });

        return updated;
      });
    } else {
      error.set(`Failed to load models: ${result.error}`);
    }
  } catch (err) {
    error.set(`Failed to load models: ${err}`);
  } finally {
    loading.set(false);
  }
}

export async function loadCurrentModel(): Promise<void> {
  try {
    const result = await commands.getCurrentModel();
    if (result.status === "ok") {
      currentModel.set(result.data);
    }
  } catch (err) {
    console.error("Failed to load current model:", err);
  }
}

export async function checkFirstRun(): Promise<boolean> {
  try {
    const result = await commands.hasAnyModelsAvailable();
    if (result.status === "ok") {
      const has = result.data;
      hasAnyModels.set(has);
      isFirstRun.set(!has);
      return !has;
    }
    return false;
  } catch (err) {
    console.error("Failed to check model availability:", err);
    return false;
  }
}

export async function selectModel(modelId: string): Promise<boolean> {
  try {
    error.set(null);
    const result = await commands.setActiveModel(modelId);
    if (result.status === "ok") {
      currentModel.set(modelId);
      isFirstRun.set(false);
      hasAnyModels.set(true);
      return true;
    } else {
      error.set(`Failed to switch to model: ${result.error}`);
      return false;
    }
  } catch (err) {
    error.set(`Failed to switch to model: ${err}`);
    return false;
  }
}

export async function downloadModel(modelId: string): Promise<boolean> {
  try {
    error.set(null);
    downloadingModels.update((d) => ({ ...d, [modelId]: true as const }));
    downloadProgress.update((p) => ({
      ...p,
      [modelId]: {
        model_id: modelId,
        downloaded: 0,
        total: 0,
        percentage: 0,
      },
    }));

    const result = await commands.downloadModel(modelId);
    if (result.status === "ok") {
      return true;
    } else {
      error.set(`Failed to download model: ${result.error}`);
      downloadingModels.update((d) => {
        const updated = { ...d };
        delete updated[modelId];
        return updated;
      });
      return false;
    }
  } catch (err) {
    error.set(`Failed to download model: ${err}`);
    downloadingModels.update((d) => {
      const updated = { ...d };
      delete updated[modelId];
      return updated;
    });
    return false;
  }
}

export async function cancelDownload(modelId: string): Promise<boolean> {
  try {
    error.set(null);
    const result = await commands.cancelDownload(modelId);
    if (result.status === "ok") {
      downloadingModels.update((d) => {
        const updated = { ...d };
        delete updated[modelId];
        return updated;
      });
      downloadProgress.update((p) => {
        const updated = { ...p };
        delete updated[modelId];
        return updated;
      });
      downloadStats.update((s) => {
        const updated = { ...s };
        delete updated[modelId];
        return updated;
      });

      await loadModels();
      return true;
    } else {
      error.set(`Failed to cancel download: ${result.error}`);
      return false;
    }
  } catch (err) {
    error.set(`Failed to cancel download: ${err}`);
    return false;
  }
}

export async function deleteModel(modelId: string): Promise<boolean> {
  try {
    error.set(null);
    const result = await commands.deleteModel(modelId);
    if (result.status === "ok") {
      await loadModels();
      await loadCurrentModel();
      return true;
    } else {
      error.set(`Failed to delete model: ${result.error}`);
      return false;
    }
  } catch (err) {
    error.set(`Failed to delete model: ${err}`);
    return false;
  }
}

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return get(models).find((model) => model.id === modelId);
}

export function isModelDownloading(modelId: string): boolean {
  return modelId in get(downloadingModels);
}

export function isModelExtracting(modelId: string): boolean {
  return modelId in get(extractingModels);
}

export function getDownloadProgress(
  modelId: string,
): DownloadProgress | undefined {
  return get(downloadProgress)[modelId];
}

export async function initialize(): Promise<void> {
  if (get(initialized)) return;

  // Load initial data
  await Promise.all([loadModels(), loadCurrentModel(), checkFirstRun()]);

  // Set up event listeners
  listen<DownloadProgress>("model-download-progress", (event) => {
    const progress = event.payload;
    downloadProgress.update((p) => ({
      ...p,
      [progress.model_id]: progress,
    }));

    // Update download stats for speed calculation
    const now = Date.now();
    downloadStats.update((stats) => {
      const current = stats[progress.model_id];

      if (!current) {
        return {
          ...stats,
          [progress.model_id]: {
            startTime: now,
            lastUpdate: now,
            totalDownloaded: progress.downloaded,
            speed: 0,
          },
        };
      } else {
        const timeDiff = (now - current.lastUpdate) / 1000;
        const bytesDiff = progress.downloaded - current.totalDownloaded;

        if (timeDiff > 0.5) {
          const currentSpeed = bytesDiff / (1024 * 1024) / timeDiff;
          const validCurrentSpeed = Math.max(0, currentSpeed);
          const smoothedSpeed =
            current.speed > 0
              ? current.speed * 0.8 + validCurrentSpeed * 0.2
              : validCurrentSpeed;

          return {
            ...stats,
            [progress.model_id]: {
              startTime: current.startTime,
              lastUpdate: now,
              totalDownloaded: progress.downloaded,
              speed: Math.max(0, smoothedSpeed),
            },
          };
        }

        return stats;
      }
    });
  });

  listen<string>("model-download-complete", (event) => {
    const modelId = event.payload;
    downloadingModels.update((d) => {
      const updated = { ...d };
      delete updated[modelId];
      return updated;
    });
    downloadProgress.update((p) => {
      const updated = { ...p };
      delete updated[modelId];
      return updated;
    });
    downloadStats.update((s) => {
      const updated = { ...s };
      delete updated[modelId];
      return updated;
    });
    loadModels();
  });

  listen<string>("model-extraction-started", (event) => {
    const modelId = event.payload;
    extractingModels.update((e) => ({ ...e, [modelId]: true as const }));
  });

  listen<string>("model-extraction-completed", (event) => {
    const modelId = event.payload;
    extractingModels.update((e) => {
      const updated = { ...e };
      delete updated[modelId];
      return updated;
    });
    loadModels();
  });

  listen<{ model_id: string; error: string }>(
    "model-extraction-failed",
    (event) => {
      const modelId = event.payload.model_id;
      extractingModels.update((e) => {
        const updated = { ...e };
        delete updated[modelId];
        return updated;
      });
      error.set(`Failed to extract model: ${event.payload.error}`);
    },
  );

  listen<string>("model-download-cancelled", (event) => {
    const modelId = event.payload;
    downloadingModels.update((d) => {
      const updated = { ...d };
      delete updated[modelId];
      return updated;
    });
    downloadProgress.update((p) => {
      const updated = { ...p };
      delete updated[modelId];
      return updated;
    });
    downloadStats.update((s) => {
      const updated = { ...s };
      delete updated[modelId];
      return updated;
    });
  });

  listen<string>("model-deleted", () => {
    loadModels();
    loadCurrentModel();
  });

  listen("model-state-changed", () => {
    loadModels();
    loadCurrentModel();
  });

  initialized.set(true);
}
