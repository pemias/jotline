<script lang="ts">
  import { t } from "@/i18n";
  import Button from "../../ui/Button.svelte";
  import { FolderOpen } from "lucide-svelte";
  import { listen } from "@tauri-apps/api/event";
  import { convertFileSrc } from "@tauri-apps/api/core";
  import { readFile } from "@tauri-apps/plugin-fs";
  import { commands, type HistoryEntry } from "@/bindings";
  import { type as osType } from "@tauri-apps/plugin-os";
  import HistoryEntryRow from "./HistoryEntryRow.svelte";

  let historyEntries = $state<HistoryEntry[]>([]);
  let loading = $state(true);

  const currentOsType = osType();

  const loadHistoryEntries = async () => {
    try {
      const result = await commands.getHistoryEntries();
      if (result.status === "ok") {
        historyEntries = result.data;
      }
    } catch (error) {
      console.error("Failed to load history entries:", error);
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    loadHistoryEntries();

    const setupListener = async () => {
      return await listen("history-updated", () => {
        console.log("History updated, reloading entries...");
        loadHistoryEntries();
      });
    };

    let unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => {
        if (unlisten) unlisten();
      });
    };
  });

  const toggleSaved = async (id: number) => {
    try {
      await commands.toggleHistoryEntrySaved(id);
    } catch (error) {
      console.error("Failed to toggle saved status:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const getAudioUrl = async (fileName: string): Promise<string | null> => {
    try {
      const result = await commands.getAudioFilePath(fileName);
      if (result.status === "ok") {
        if (currentOsType === "linux") {
          const fileData = await readFile(result.data);
          const blob = new Blob([fileData], { type: "audio/wav" });
          return URL.createObjectURL(blob);
        }
        return convertFileSrc(result.data, "asset");
      }
      return null;
    } catch (error) {
      console.error("Failed to get audio file path:", error);
      return null;
    }
  };

  const deleteAudioEntry = async (id: number) => {
    try {
      await commands.deleteHistoryEntry(id);
    } catch (error) {
      console.error("Failed to delete audio entry:", error);
      throw error;
    }
  };

  const openRecordingsFolder = async () => {
    try {
      await commands.openRecordingsFolder();
    } catch (error) {
      console.error("Failed to open recordings folder:", error);
    }
  };
</script>

<div class="max-w-3xl w-full mx-auto space-y-6">
  <div class="space-y-2">
    <div class="px-4 flex items-center justify-between">
      <div>
        <h2 class="text-xs font-medium text-mid-gray uppercase tracking-wide">
          {$t("settings.history.title")}
        </h2>
      </div>
      <Button
        onclick={openRecordingsFolder}
        variant="secondary"
        size="sm"
        class="flex items-center gap-2"
        title={$t("settings.history.openFolder")}
      >
        <FolderOpen class="w-4 h-4" />
        <span>{$t("settings.history.openFolder")}</span>
      </Button>
    </div>
    <div class="bg-background border border-mid-gray/20 rounded-lg overflow-visible">
      {#if loading}
        <div class="px-4 py-3 text-center text-text/60">
          {$t("settings.history.loading")}
        </div>
      {:else if historyEntries.length === 0}
        <div class="px-4 py-3 text-center text-text/60">
          {$t("settings.history.empty")}
        </div>
      {:else}
        <div class="divide-y divide-mid-gray/20">
          {#each historyEntries as entry (entry.id)}
            <HistoryEntryRow
              {entry}
              onToggleSaved={() => toggleSaved(entry.id)}
              onCopyText={() => copyToClipboard(entry.transcription_text)}
              {getAudioUrl}
              deleteAudio={deleteAudioEntry}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
