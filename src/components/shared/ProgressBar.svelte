<script lang="ts" module>
  export interface ProgressData {
    id: string;
    percentage: number;
    speed?: number;
    label?: string;
  }
</script>

<script lang="ts">
  import { t } from "@/i18n";

  let {
    progress,
    class: className = "",
    size = "medium",
    showSpeed = false,
    showLabel = false,
  }: {
    progress: ProgressData[];
    class?: string;
    size?: "small" | "medium" | "large";
    showSpeed?: boolean;
    showLabel?: boolean;
  } = $props();

  const sizeClasses: Record<string, string> = {
    small: "w-16 h-1",
    medium: "w-20 h-1.5",
    large: "w-24 h-2",
  };

  let progressClasses = $derived(sizeClasses[size]);
</script>

{#if progress.length === 0}
  <!-- empty -->
{:else if progress.length === 1}
  {@const item = progress[0]}
  {@const percentage = Math.max(0, Math.min(100, item.percentage))}
  <div class="flex items-center gap-3 {className}">
    <progress
      value={percentage}
      max={100}
      class="{progressClasses} [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-mid-gray/20 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-logo-primary"
    ></progress>
    {#if showSpeed || showLabel}
      <div class="text-xs text-text/60 tabular-nums min-w-fit">
        {#if showLabel && item.label}
          <span class="me-2">{item.label}</span>
        {/if}
        {#if showSpeed && item.speed !== undefined && item.speed > 0}
          <span>{$t("modelSelector.downloadSpeed", { speed: item.speed.toFixed(1) })}</span>
        {:else if showSpeed}
          <span>{$t("common.downloading")}</span>
        {/if}
      </div>
    {/if}
  </div>
{:else}
  <div class="flex items-center gap-2 {className}">
    <div class="flex gap-1">
      {#each progress as item (item.id)}
        {@const percentage = Math.max(0, Math.min(100, item.percentage))}
        <progress
          value={percentage}
          max={100}
          title={item.label || `${percentage}%`}
          class="w-3 h-1.5 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-mid-gray/20 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-logo-primary"
        ></progress>
      {/each}
    </div>
    <div class="text-xs text-text/60 min-w-fit">
      {$t("common.downloadingCount", { count: progress.length })}
    </div>
  </div>
{/if}
