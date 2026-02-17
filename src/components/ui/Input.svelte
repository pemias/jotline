<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  let {
    class: className = "",
    variant = "default",
    disabled,
    ...restProps
  }: HTMLInputAttributes & {
    variant?: "default" | "compact";
  } = $props();

  const baseClasses =
    "px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 rounded-md text-start transition-all duration-150";

  let interactiveClasses = $derived(
    disabled
      ? "opacity-60 cursor-not-allowed bg-mid-gray/10 border-mid-gray/40"
      : "hover:bg-logo-primary/10 hover:border-logo-primary focus:outline-none focus:bg-logo-primary/20 focus:border-logo-primary"
  );

  const variantClasses: Record<string, string> = {
    default: "px-3 py-2",
    compact: "px-2 py-1",
  };
</script>

<input
  class="{baseClasses} {variantClasses[variant]} {interactiveClasses} {className}"
  {disabled}
  {...restProps}
/>
