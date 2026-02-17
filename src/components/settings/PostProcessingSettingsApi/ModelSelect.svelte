<script lang="ts">
  import type { ModelOption } from "./types";
  import Select from "../../ui/Select.svelte";

  let {
    value,
    options,
    disabled = false,
    placeholder = "",
    isLoading = false,
    onSelect,
    onCreate,
    onBlur,
    class: className = "flex-1 min-w-[360px]",
  }: {
    value: string;
    options: ModelOption[];
    disabled?: boolean;
    placeholder?: string;
    isLoading?: boolean;
    onSelect: (value: string) => void;
    onCreate: (value: string) => void;
    onBlur: () => void;
    class?: string;
  } = $props();

  function handleCreate(inputValue: string) {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onCreate(trimmed);
  }

  let computedClassName = $derived(`text-sm ${className}`);
</script>

<Select
  class={computedClassName}
  value={value || null}
  {options}
  onChange={(selected) => onSelect(selected ?? "")}
  onCreateOption={handleCreate}
  {onBlur}
  {placeholder}
  {disabled}
  {isLoading}
  isCreatable
  formatCreateLabel={(input) => `Use "${input}"`}
/>
