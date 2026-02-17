<script lang="ts" module>
  export type SelectOption = {
    value: string;
    label: string;
    isDisabled?: boolean;
  };
</script>

<script lang="ts">
  import { t } from "@/i18n";

  let {
    value,
    options,
    placeholder = "",
    disabled = false,
    isLoading = false,
    isClearable = true,
    onChange,
    onBlur,
    class: className = "",
    isCreatable = false,
    onCreateOption,
    formatCreateLabel,
  }: {
    value: string | null;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    isLoading?: boolean;
    isClearable?: boolean;
    onChange: (value: string | null) => void;
    onBlur?: () => void;
    class?: string;
    isCreatable?: boolean;
    onCreateOption?: (value: string) => void;
    formatCreateLabel?: (input: string) => string;
  } = $props();

  let isOpen = $state(false);
  let searchText = $state("");
  let highlightedIndex = $state(-1);
  let containerEl: HTMLDivElement | undefined = $state();
  let inputEl: HTMLInputElement | undefined = $state();

  let selectValue = $derived.by(() => {
    if (!value) return null;
    const existing = options.find((option) => option.value === value);
    if (existing) return existing;
    return { value, label: value, isDisabled: false };
  });

  let filteredOptions = $derived.by(() => {
    if (!searchText) return options;
    const lower = searchText.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  });

  let showCreateOption = $derived(
    isCreatable &&
    searchText.trim() !== "" &&
    !filteredOptions.some((o) => o.label.toLowerCase() === searchText.toLowerCase())
  );

  $effect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerEl && !containerEl.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  function open() {
    if (disabled) return;
    isOpen = true;
    searchText = "";
    highlightedIndex = -1;
    requestAnimationFrame(() => inputEl?.focus());
  }

  function close() {
    isOpen = false;
    searchText = "";
    highlightedIndex = -1;
    onBlur?.();
  }

  function handleSelect(option: SelectOption) {
    if (option.isDisabled) return;
    onChange(option.value);
    close();
  }

  function handleClear(e: MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  function handleCreate() {
    const trimmed = searchText.trim();
    if (trimmed && onCreateOption) {
      onCreateOption(trimmed);
      close();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const totalOptions = filteredOptions.length + (showCreateOption ? 1 : 0);
    const currentIndex = Number.isFinite(highlightedIndex) ? highlightedIndex : -1;

    if (e.key === "ArrowDown") {
      if (totalOptions === 0) {
        highlightedIndex = -1;
        return;
      }
      e.preventDefault();
      highlightedIndex = (currentIndex + 1) % totalOptions;
    } else if (e.key === "ArrowUp") {
      if (totalOptions === 0) {
        highlightedIndex = -1;
        return;
      }
      e.preventDefault();
      highlightedIndex = (currentIndex - 1 + totalOptions) % totalOptions;
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (showCreateOption && highlightedIndex === filteredOptions.length) {
        handleCreate();
      }
    } else if (e.key === "Escape") {
      close();
    }
  }

  const baseBackground = "color-mix(in srgb, var(--color-mid-gray) 10%, transparent)";
  const hoverBackground = "color-mix(in srgb, var(--color-logo-primary) 12%, transparent)";
  const focusBackground = "color-mix(in srgb, var(--color-logo-primary) 20%, transparent)";
  const neutralBorder = "color-mix(in srgb, var(--color-mid-gray) 80%, transparent)";
</script>

<div class="relative {className}" bind:this={containerEl}>
  <!-- Control -->
  <button
    type="button"
    class="select-control"
    class:select-control-focused={isOpen}
    class:select-control-disabled={disabled}
    onclick={() => isOpen ? close() : open()}
    {disabled}
  >
    <span class="select-value-container">
      {#if selectValue && !isOpen}
        <span class="select-single-value">{selectValue.label}</span>
      {:else if !isOpen}
        <span class="select-placeholder">{placeholder}</span>
      {/if}
      {#if isOpen}
        <input
          bind:this={inputEl}
          bind:value={searchText}
          class="select-input"
          onkeydown={handleKeydown}
          onclick={(e: MouseEvent) => e.stopPropagation()}
        />
      {/if}
    </span>
    <span class="select-indicators">
      {#if isLoading}
        <span class="select-loading">
          <span class="select-loading-dot"></span>
          <span class="select-loading-dot"></span>
          <span class="select-loading-dot"></span>
        </span>
      {/if}
      {#if isClearable && selectValue && !disabled}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <span
          class="select-clear"
          role="button"
          tabindex="-1"
          onclick={handleClear}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      {/if}
      <span class="select-separator"></span>
      <span class="select-dropdown-indicator" class:select-dropdown-indicator-focused={isOpen}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4.516 7.548c.436-.446 1.043-.481 1.576 0L10 11.295l3.908-3.747c.533-.481 1.141-.446 1.574 0 .436.445.408 1.197 0 1.615-.406.418-4.695 4.502-4.695 4.502a1.095 1.095 0 0 1-1.576 0S4.924 9.581 4.516 9.163c-.409-.418-.436-1.17 0-1.615z"/>
        </svg>
      </span>
    </span>
  </button>

  <!-- Dropdown menu -->
  {#if isOpen && !disabled}
    <div class="select-menu">
      {#each filteredOptions as option, i}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="select-option"
          class:select-option-selected={selectValue?.value === option.value}
          class:select-option-focused={highlightedIndex === i}
          class:select-option-disabled={option.isDisabled}
          role="option"
          tabindex="-1"
          aria-selected={selectValue?.value === option.value}
          onclick={() => handleSelect(option)}
          onmouseenter={() => highlightedIndex = i}
        >
          {option.label}
        </div>
      {/each}
      {#if showCreateOption}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="select-option select-option-create"
          class:select-option-focused={highlightedIndex === filteredOptions.length}
          role="option"
          tabindex="-1"
          aria-selected={false}
          onclick={handleCreate}
          onmouseenter={() => highlightedIndex = filteredOptions.length}
        >
          {formatCreateLabel ? formatCreateLabel(searchText) : `Create "${searchText}"`}
        </div>
      {/if}
      {#if filteredOptions.length === 0 && !showCreateOption}
        <div class="select-no-options">{$t("common.noOptionsFound")}</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .select-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
    border-radius: 6px;
    border: 1px solid color-mix(in srgb, var(--color-mid-gray) 80%, transparent);
    background-color: color-mix(in srgb, var(--color-mid-gray) 10%, transparent);
    font-size: 0.875rem;
    color: var(--color-text);
    transition: all 150ms ease;
    width: 100%;
    cursor: pointer;
    text-align: left;
  }

  .select-control:hover {
    border-color: var(--color-logo-primary);
    background-color: color-mix(in srgb, var(--color-logo-primary) 12%, transparent);
  }

  .select-control-focused {
    border-color: var(--color-logo-primary);
    box-shadow: 0 0 0 1px var(--color-logo-primary);
    background-color: color-mix(in srgb, var(--color-logo-primary) 20%, transparent);
  }

  .select-control-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select-value-container {
    flex: 1;
    display: flex;
    align-items: center;
    padding-inline: 10px;
    padding-block: 6px;
    min-width: 0;
    overflow: hidden;
  }

  .select-single-value {
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .select-placeholder {
    color: color-mix(in srgb, var(--color-mid-gray) 65%, transparent);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .select-input {
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.875rem;
    width: 100%;
    padding: 0;
  }

  .select-indicators {
    display: flex;
    align-items: center;
    padding-right: 8px;
    gap: 2px;
  }

  .select-clear {
    display: flex;
    align-items: center;
    color: color-mix(in srgb, var(--color-mid-gray) 80%, transparent);
    cursor: pointer;
    padding: 2px;
  }

  .select-clear:hover {
    color: var(--color-logo-primary);
  }

  .select-separator {
    width: 1px;
    height: 20px;
    background: color-mix(in srgb, var(--color-mid-gray) 30%, transparent);
    margin: 0 4px;
  }

  .select-dropdown-indicator {
    display: flex;
    align-items: center;
    color: color-mix(in srgb, var(--color-mid-gray) 80%, transparent);
  }

  .select-dropdown-indicator:hover,
  .select-dropdown-indicator-focused {
    color: var(--color-logo-primary);
  }

  .select-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    z-index: 30;
    background-color: var(--color-background);
    color: var(--color-text);
    border: 1px solid color-mix(in srgb, var(--color-mid-gray) 30%, transparent);
    border-radius: 6px;
    box-shadow: 0 10px 30px rgba(15, 15, 15, 0.2);
    max-height: 300px;
    overflow-y: auto;
  }

  .select-option {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .select-option-selected {
    background-color: color-mix(in srgb, var(--color-logo-primary) 20%, transparent);
  }

  .select-option-focused:not(.select-option-selected) {
    background-color: color-mix(in srgb, var(--color-logo-primary) 12%, transparent);
  }

  .select-option-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select-option-create {
    font-style: italic;
  }

  .select-no-options {
    padding: 8px 12px;
    color: color-mix(in srgb, var(--color-mid-gray) 65%, transparent);
    font-size: 0.875rem;
  }

  .select-loading {
    display: flex;
    gap: 2px;
    padding: 0 4px;
  }

  .select-loading-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-mid-gray);
    animation: select-loading-pulse 1s ease-in-out infinite;
  }

  .select-loading-dot:nth-child(2) { animation-delay: 0.15s; }
  .select-loading-dot:nth-child(3) { animation-delay: 0.3s; }

  @keyframes select-loading-pulse {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }
</style>
