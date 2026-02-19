<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  let {
    children,
    class: className = "",
    variant = "primary",
    size = "md",
    ...restProps
  }: HTMLButtonAttributes & {
    children: Snippet;
    variant?: "primary" | "primary-soft" | "secondary" | "danger" | "danger-ghost" | "ghost";
    size?: "sm" | "md" | "lg";
  } = $props();

  const baseClasses =
    "font-medium rounded-lg border focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variantClasses: Record<string, string> = {
    primary:
      "text-white bg-background-ui border-background-ui hover:bg-background-ui/80 hover:border-background-ui/80 focus:ring-1 focus:ring-background-ui",
    "primary-soft":
      "text-text bg-mid-gray/15 border-transparent hover:bg-mid-gray/25 focus:ring-1 focus:ring-mid-gray",
    secondary:
      "bg-mid-gray/10 border-mid-gray/20 hover:bg-mid-gray/20 hover:border-mid-gray focus:outline-none",
    danger:
      "text-white bg-red-600 border-mid-gray/20 hover:bg-red-700 hover:border-red-700 focus:ring-1 focus:ring-red-500",
    "danger-ghost":
      "text-red-400 border-transparent hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/20",
    ghost:
      "text-current border-transparent hover:bg-mid-gray/10 hover:border-mid-gray focus:bg-mid-gray/20",
  };

  const sizeClasses: Record<string, string> = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-[5px] text-sm",
    lg: "px-4 py-2 text-base",
  };
</script>

<button
  class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
  {...restProps}
>
  {@render children()}
</button>
