<script lang="ts">
  import { locale, t } from "@/i18n";
  import AudioPlayer from "../../ui/AudioPlayer.svelte";
  import { Copy, Star, Check, Trash2 } from "lucide-svelte";
  import type { HistoryEntry } from "@/bindings";
  import { formatDateTime } from "@/utils/dateFormat";

  let {
    entry,
    onToggleSaved,
    onCopyText,
    getAudioUrl,
    deleteAudio,
  }: {
    entry: HistoryEntry;
    onToggleSaved: () => void;
    onCopyText: () => void;
    getAudioUrl: (fileName: string) => Promise<string | null>;
    deleteAudio: (id: number) => Promise<void>;
  } = $props();

  let showCopied = $state(false);

  const handleLoadAudio = () => getAudioUrl(entry.file_name);

  const handleCopyText = () => {
    onCopyText();
    showCopied = true;
    setTimeout(() => (showCopied = false), 2000);
  };

  const handleDeleteEntry = async () => {
    try {
      await deleteAudio(entry.id);
    } catch (error) {
      console.error("Failed to delete entry:", error);
      alert("Failed to delete entry. Please try again.");
    }
  };

  let formattedDate = $derived(formatDateTime(String(entry.timestamp), $locale));
</script>

<div class="px-4 py-2 pb-5 flex flex-col gap-3">
  <div class="flex justify-between items-center">
    <p class="text-sm font-medium">{formattedDate}</p>
    <div class="flex items-center gap-1">
      <button
        onclick={handleCopyText}
        class="text-text/50 hover:text-text transition-colors cursor-pointer"
        title={$t("settings.history.copyToClipboard")}
      >
        {#if showCopied}
          <Check width={16} height={16} />
        {:else}
          <Copy width={16} height={16} />
        {/if}
      </button>
      <button
        onclick={onToggleSaved}
        class="p-2 rounded-md transition-colors cursor-pointer {entry.saved
          ? 'text-text hover:text-text/80'
          : 'text-text/50 hover:text-text'}"
        title={entry.saved
          ? $t("settings.history.unsave")
          : $t("settings.history.save")}
      >
        <Star
          width={16}
          height={16}
          fill={entry.saved ? "currentColor" : "none"}
        />
      </button>
      <button
        onclick={handleDeleteEntry}
        class="text-text/50 hover:text-text transition-colors cursor-pointer"
        title={$t("settings.history.delete")}
      >
        <Trash2 width={16} height={16} />
      </button>
    </div>
  </div>
  <p class="italic text-text/90 text-sm pb-2 select-text cursor-text">
    {entry.transcription_text}
  </p>
  <AudioPlayer onLoadRequest={handleLoadAudio} class="w-full" />
</div>
