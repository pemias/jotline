<script lang="ts" module>
  export interface DropdownOption {
    value: string;
    label: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import { t } from "@/i18n";

  let {
    options,
    selectedValue,
    onSelect,
    class: className = "",
    placeholder = "Select an option...",
    disabled = false,
    onRefresh,
  }: {
    options: DropdownOption[];
    selectedValue: string | null;
    onSelect: (value: string) => void;
    class?: string;
    placeholder?: string;
    disabled?: boolean;
    onRefresh?: () => void;
  } = $props();

  let isOpen = $state(false);
  let dropdownRef: HTMLDivElement | undefined = $state();

  $effect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        isOpen = false;
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  let selectedOption = $derived(
    options.find((option) => option.value === selectedValue)
  );

  function handleSelect(value: string) {
    onSelect(value);
    isOpen = false;
  }

  function handleToggle() {
    if (disabled) return;
    if (!isOpen && onRefresh) onRefresh();
    isOpen = !isOpen;
  }
</script>

<div class="relative {className}" bind:this={dropdownRef}>
  <button
    type="button"
    class="px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 rounded-md min-w-[200px] text-start flex items-center justify-between transition-all duration-150 {disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-mid-gray/15 cursor-pointer hover:border-mid-gray'}"
    onclick={handleToggle}
    {disabled}
  >
    <span class="truncate">{selectedOption?.label || placeholder}</span>
    <svg
      class="w-4 h-4 ms-2 transition-transform duration-200 {isOpen ? 'transform rotate-180' : ''}"
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
  {#if isOpen && !disabled}
    <div class="absolute top-full left-0 right-0 mt-1 bg-background border border-mid-gray/80 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
      {#if options.length === 0}
        <div class="px-2 py-1 text-sm text-mid-gray">
          {$t("common.noOptionsFound")}
        </div>
      {:else}
        {#each options as option (option.value)}
          <button
            type="button"
            class="w-full px-2 py-1 text-sm text-start hover:bg-mid-gray/15 transition-colors duration-150 {selectedValue === option.value
              ? 'bg-mid-gray/20 font-semibold'
              : ''} {option.disabled ? 'opacity-50 cursor-not-allowed' : ''}"
            onclick={() => handleSelect(option.value)}
            disabled={option.disabled}
          >
            <span class="truncate">{option.label}</span>
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>
