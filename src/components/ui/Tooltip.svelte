<script lang="ts">
  import { onMount, onDestroy, type Snippet } from "svelte";

  type TooltipPosition = "top" | "bottom";

  interface TooltipCoords {
    top: number;
    left: number;
    arrowLeft: number;
    actualPosition: TooltipPosition;
  }

  let { targetEl, position = "top", children }: {
    targetEl: HTMLElement | null;
    position?: TooltipPosition;
    children: Snippet;
  } = $props();

  const TOOLTIP_WIDTH = 200;
  const VIEWPORT_PADDING = 12;
  const GAP = 8;
  const ARROW_MARGIN = 12;
  const DEFAULT_HEIGHT = 60;

  let coords = $state<TooltipCoords | null>(null);
  let tooltipEl: HTMLDivElement | undefined = $state();

  function updatePosition() {
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    const tooltipHeight = tooltipEl?.offsetHeight || DEFAULT_HEIGHT;

    let actualPosition = position;
    let top: number;

    if (position === "top") {
      const spaceAbove = targetRect.top - tooltipHeight - GAP;
      if (spaceAbove < VIEWPORT_PADDING) {
        actualPosition = "bottom";
        top = targetRect.bottom + GAP;
      } else {
        top = targetRect.top - GAP - tooltipHeight;
      }
    } else {
      const spaceBelow =
        window.innerHeight - targetRect.bottom - tooltipHeight - GAP;
      if (spaceBelow < VIEWPORT_PADDING) {
        actualPosition = "top";
        top = targetRect.top - GAP - tooltipHeight;
      } else {
        top = targetRect.bottom + GAP;
      }
    }

    const targetCenter = targetRect.left + targetRect.width / 2;
    let left = targetCenter - TOOLTIP_WIDTH / 2;

    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    } else if (left + TOOLTIP_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING;
    }

    const arrowLeft = Math.min(
      Math.max(targetCenter - left, ARROW_MARGIN),
      TOOLTIP_WIDTH - ARROW_MARGIN,
    );

    coords = { top, left, arrowLeft, actualPosition };
  }

  let portalEl: HTMLDivElement | undefined;

  onMount(() => {
    portalEl = document.createElement("div");
    document.body.appendChild(portalEl);

    // Move the tooltip element to the portal
    if (tooltipEl) {
      portalEl.appendChild(tooltipEl);
    }

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
  });

  onDestroy(() => {
    window.removeEventListener("scroll", updatePosition, true);
    window.removeEventListener("resize", updatePosition);
    if (portalEl) {
      portalEl.remove();
    }
  });

  let arrowClasses = $derived(
    coords?.actualPosition === "top" ? "top-full" : "bottom-full rotate-180"
  );
</script>

<div
  bind:this={tooltipEl}
  style:position="fixed"
  style:top="{coords?.top ?? -9999}px"
  style:left="{coords?.left ?? -9999}px"
  style:width="{TOOLTIP_WIDTH}px"
  style:z-index="9999"
  style:opacity={coords ? 1 : 0}
  class="px-3 py-2 bg-background border border-mid-gray/80 rounded-lg shadow-lg whitespace-normal transition-opacity duration-150"
>
  {@render children()}
  <div
    style:left="{coords?.arrowLeft ?? 0}px"
    class="absolute {arrowClasses} transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-mid-gray/80"
  ></div>
</div>
