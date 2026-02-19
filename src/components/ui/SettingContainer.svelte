<script lang="ts">
  import { t } from "@/i18n";
  import type { Snippet } from "svelte";
  import Tooltip from "./Tooltip.svelte";

  let {
    title,
    description,
    children,
    descriptionMode = "tooltip",
    grouped = false,
    layout = "horizontal",
    disabled = false,
    tooltipPosition = "top",
  }: {
    title: string;
    description: string;
    children: Snippet;
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
    layout?: "horizontal" | "stacked";
    disabled?: boolean;
    tooltipPosition?: "top" | "bottom";
  } = $props();

  let showTooltip = $state(false);
  let tooltipRef: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!showTooltip) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef && !tooltipRef.contains(event.target as Node)) {
        showTooltip = false;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  function toggleTooltip() {
    showTooltip = !showTooltip;
  }

  let containerClasses = $derived(
    grouped
      ? "px-4 p-2"
      : "px-4 p-2 rounded-lg border border-mid-gray/20"
  );

  let horizontalContainerClasses = $derived(
    grouped
      ? "flex items-center justify-between px-4 p-2"
      : "flex items-center justify-between px-4 p-2 rounded-lg border border-mid-gray/20"
  );
</script>

{#if layout === "stacked"}
  {#if descriptionMode === "tooltip"}
    <div class={containerClasses}>
      <div class="flex items-center gap-2 mb-2">
        <h3 class="text-sm font-medium {disabled ? 'opacity-50' : ''}">
          {title}
        </h3>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          bind:this={tooltipRef}
          class="relative"
          role="button"
          tabindex="-1"
          onmouseenter={() => showTooltip = true}
          onmouseleave={() => showTooltip = false}
          onclick={toggleTooltip}
        >
          <svg
            class="w-4 h-4 text-mid-gray cursor-help hover:text-text transition-colors duration-200 select-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label={$t("common.moreInformation")}
            role="button"
            tabindex={0}
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTooltip();
              }
            }}
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {#if showTooltip}
            <Tooltip targetEl={tooltipRef ?? null} position="top">
              <p class="text-sm text-center leading-relaxed">
                {description}
              </p>
            </Tooltip>
          {/if}
        </div>
      </div>
      <div class="w-full">{@render children()}</div>
    </div>
  {:else}
    <div class={containerClasses}>
      <div class="mb-2">
        <h3 class="text-sm font-medium {disabled ? 'opacity-50' : ''}">
          {title}
        </h3>
        <p class="text-sm {disabled ? 'opacity-50' : ''}">
          {description}
        </p>
      </div>
      <div class="w-full">{@render children()}</div>
    </div>
  {/if}
{:else}
  {#if descriptionMode === "tooltip"}
    <div class={horizontalContainerClasses}>
      <div class="max-w-2/3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium {disabled ? 'opacity-50' : ''}">
            {title}
          </h3>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            bind:this={tooltipRef}
            class="relative"
            role="button"
            tabindex="-1"
            onmouseenter={() => showTooltip = true}
            onmouseleave={() => showTooltip = false}
            onclick={toggleTooltip}
          >
            <svg
              class="w-4 h-4 text-mid-gray cursor-help hover:text-text transition-colors duration-200 select-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label={$t("common.moreInformation")}
              role="button"
              tabindex={0}
              onkeydown={(e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleTooltip();
                }
              }}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {#if showTooltip}
              <Tooltip targetEl={tooltipRef ?? null} position={tooltipPosition}>
                <p class="text-sm text-center leading-relaxed">
                  {description}
                </p>
              </Tooltip>
            {/if}
          </div>
        </div>
      </div>
      <div class="relative">{@render children()}</div>
    </div>
  {:else}
    <div class={horizontalContainerClasses}>
      <div class="max-w-2/3">
        <h3 class="text-sm font-medium {disabled ? 'opacity-50' : ''}">
          {title}
        </h3>
        <p class="text-sm {disabled ? 'opacity-50' : ''}">
          {description}
        </p>
      </div>
      <div class="relative">{@render children()}</div>
    </div>
  {/if}
{/if}
