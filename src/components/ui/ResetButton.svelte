<script lang="ts">
  import type { Snippet } from "svelte";
  import ResetIcon from "../icons/ResetIcon.svelte";

  let {
    onclick,
    disabled = false,
    class: className = "",
    ariaLabel,
    children,
  }: {
    onclick: () => void;
    disabled?: boolean;
    class?: string;
    ariaLabel?: string;
    children?: Snippet;
  } = $props();
</script>

<button
  type="button"
  aria-label={ariaLabel}
  class="p-1 rounded-md border border-transparent transition-all duration-150 {disabled
    ? 'opacity-50 cursor-not-allowed text-text/40'
    : 'hover:bg-mid-gray/20 active:bg-mid-gray/30 active:translate-y-[1px] hover:cursor-pointer hover:border-mid-gray text-text/80'} {className}"
  {onclick}
  {disabled}
>
  {#if children}
    {@render children()}
  {:else}
    <ResetIcon />
  {/if}
</button>
