<script lang="ts">
  import type { Snippet } from "svelte";
  import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-svelte";

  type AlertVariant = "error" | "warning" | "info" | "success";

  let {
    variant = "error",
    contained = false,
    children,
    class: className = "",
  }: {
    variant?: AlertVariant;
    contained?: boolean;
    children: Snippet;
    class?: string;
  } = $props();

  const variantStyles: Record<AlertVariant, { container: string; icon: string; text: string }> = {
    error: {
      container: "bg-red-500/10",
      icon: "text-red-500",
      text: "text-red-400",
    },
    warning: {
      container: "bg-yellow-500/10",
      icon: "text-yellow-500",
      text: "text-yellow-400",
    },
    info: {
      container: "bg-blue-500/10",
      icon: "text-blue-500",
      text: "text-blue-400",
    },
    success: {
      container: "bg-green-500/10",
      icon: "text-green-500",
      text: "text-green-400",
    },
  };

  let styles = $derived(variantStyles[variant]);
</script>

<div
  class="flex items-start gap-3 p-4 {styles.container} {contained ? '' : 'rounded-lg'} {className}"
>
  {#if variant === "error"}
    <AlertCircle class="w-5 h-5 shrink-0 mt-0.5 {styles.icon}" />
  {:else if variant === "warning"}
    <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5 {styles.icon}" />
  {:else if variant === "info"}
    <Info class="w-5 h-5 shrink-0 mt-0.5 {styles.icon}" />
  {:else}
    <CheckCircle class="w-5 h-5 shrink-0 mt-0.5 {styles.icon}" />
  {/if}
  <p class="text-sm {styles.text}">{@render children()}</p>
</div>
