<script lang="ts">
  import type { Snippet } from "svelte";

  let { title, description, children }: {
    title?: string;
    description?: string;
    children: Snippet;
  } = $props();
</script>

<div class="space-y-2">
  {#if title}
    <div class="px-4">
      <h2 class="text-xs font-medium text-mid-gray uppercase tracking-wide">
        {title}
      </h2>
      {#if description}
        <p class="text-xs text-mid-gray mt-1">{description}</p>
      {/if}
    </div>
  {/if}
  <div class="bg-background border border-mid-gray/20 rounded-lg overflow-visible">
    <div class="divide-y divide-mid-gray/20">{@render children()}</div>
  </div>
</div>
