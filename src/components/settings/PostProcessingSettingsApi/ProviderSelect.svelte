<script lang="ts">
  import Dropdown, { type DropdownOption } from "../../ui/Dropdown.svelte";

  let {
    options,
    value,
    onChange,
    disabled = false,
  }: {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  } = $props();
</script>

<Dropdown
  {options}
  selectedValue={value}
  onSelect={onChange}
  {disabled}
  class="flex-1"
/>
