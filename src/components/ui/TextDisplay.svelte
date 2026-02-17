<script lang="ts">
  import { t } from "@/i18n";
  import SettingContainer from "./SettingContainer.svelte";

  let {
    label,
    description,
    value,
    descriptionMode = "tooltip",
    grouped = false,
    placeholder = "Not available",
    copyable = false,
    monospace = false,
    onCopy,
  }: {
    label: string;
    description: string;
    value: string;
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
    placeholder?: string;
    copyable?: boolean;
    monospace?: boolean;
    onCopy?: (value: string) => void;
  } = $props();

  let showCopied = $state(false);

  async function handleCopy() {
    if (!value || !copyable) return;

    try {
      await navigator.clipboard.writeText(value);
      showCopied = true;
      setTimeout(() => showCopied = false, 1500);
      if (onCopy) {
        onCopy(value);
      }
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  let displayValue = $derived(value || placeholder);
  let textClasses = $derived(monospace ? "font-mono break-all" : "break-words");
</script>

<SettingContainer
  title={label}
  {description}
  {descriptionMode}
  {grouped}
  layout="stacked"
>
  <div class="flex items-center space-x-2">
    <div class="flex-1 min-w-0">
      <div
        class="px-2 min-h-8 flex items-center bg-mid-gray/10 border border-mid-gray/80 rounded-md text-xs {textClasses} {!value ? 'opacity-60' : ''}"
      >
        {displayValue}
      </div>
    </div>
    {#if copyable && value}
      <button
        onclick={handleCopy}
        class="flex items-center justify-center px-2 py-1 w-12 min-h-8 text-xs font-semibold bg-mid-gray/10 hover:bg-logo-primary/10 border border-mid-gray/80 hover:border-logo-primary hover:text-logo-primary rounded-md transition-all duration-150 flex-shrink-0 cursor-pointer"
        title={$t("settings.history.copyToClipboard")}
      >
        {#if showCopied}
          <div class="flex items-center space-x-1">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        {:else}
          {$t("common.copy")}
        {/if}
      </button>
    {/if}
  </div>
</SettingContainer>
