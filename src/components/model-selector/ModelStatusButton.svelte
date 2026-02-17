<script lang="ts">
  type ModelStatus =
    | "ready"
    | "loading"
    | "downloading"
    | "extracting"
    | "error"
    | "unloaded"
    | "none";

  let {
    status,
    displayText,
    isDropdownOpen,
    onclick,
    class: className = "",
  }: {
    status: ModelStatus;
    displayText: string;
    isDropdownOpen: boolean;
    onclick: () => void;
    class?: string;
  } = $props();

  const getStatusColor = (s: ModelStatus): string => {
    switch (s) {
      case "ready":
        return "bg-green-400";
      case "loading":
        return "bg-yellow-400 animate-pulse";
      case "downloading":
        return "bg-logo-primary animate-pulse";
      case "extracting":
        return "bg-orange-400 animate-pulse";
      case "error":
        return "bg-red-400";
      case "unloaded":
        return "bg-mid-gray/60";
      case "none":
        return "bg-red-400";
      default:
        return "bg-mid-gray/60";
    }
  };
</script>

<button
  {onclick}
  class="flex items-center gap-2 hover:text-text/80 transition-colors {className}"
  title="Model status: {displayText}"
>
  <div class="w-2 h-2 rounded-full {getStatusColor(status)}"></div>
  <span class="max-w-28 truncate">{displayText}</span>
  <svg
    class="w-3 h-3 transition-transform {isDropdownOpen ? 'rotate-180' : ''}"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M19 9l-7 7-7-7"
    />
  </svg>
</button>
