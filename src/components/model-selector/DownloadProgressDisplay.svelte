<script lang="ts">
  import { ProgressBar, type ProgressData } from "../shared";

  let {
    downloadProgress,
    downloadStats,
    class: className = "",
  }: {
    downloadProgress: Record<string, { model_id: string; downloaded: number; total: number; percentage: number }>;
    downloadStats: Record<string, { startTime: number; lastUpdate: number; totalDownloaded: number; speed: number }>;
    class?: string;
  } = $props();

  let progressValues = $derived(Object.values(downloadProgress));

  let progressData = $derived<ProgressData[]>(
    progressValues.map((progress) => {
      const stats = downloadStats[progress.model_id];
      return {
        id: progress.model_id,
        percentage: progress.percentage,
        speed: stats?.speed,
      };
    })
  );
</script>

{#if progressValues.length > 0}
  <ProgressBar
    progress={progressData}
    class={className}
    showSpeed={progressValues.length === 1}
    size="medium"
  />
{/if}
