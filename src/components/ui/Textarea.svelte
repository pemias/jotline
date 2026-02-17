<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";

  let {
    class: className = "",
    variant = "default",
    ...restProps
  }: HTMLTextareaAttributes & {
    variant?: "default" | "compact";
  } = $props();

  const baseClasses =
    "px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 rounded-md text-start transition-[background-color,border-color] duration-150 hover:bg-logo-primary/10 hover:border-logo-primary focus:outline-none focus:bg-logo-primary/10 focus:border-logo-primary resize-y";

  const variantClasses: Record<string, string> = {
    default: "px-3 py-2 min-h-[100px]",
    compact: "px-2 py-1 min-h-[80px]",
  };
</script>

<textarea
  class="{baseClasses} {variantClasses[variant]} {className}"
  {...restProps}
></textarea>
