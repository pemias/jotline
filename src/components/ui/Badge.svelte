<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    variant = "primary",
    class: className = "",
  }: {
    children: Snippet;
    variant?: "primary" | "success" | "secondary";
    class?: string;
  } = $props();

  const variantClasses: Record<string, string> = {
    primary: "bg-logo-primary",
    success: "bg-green-500/20 text-green-400",
    secondary: "bg-mid-gray/20 text-text/70",
  };
</script>

<span
  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium {variantClasses[variant]} {className}"
>
  {@render children()}
</span>
