<script lang="ts">
  import Input from "../../ui/Input.svelte";

  let {
    value,
    onBlur,
    disabled,
    placeholder = "",
    class: className = "",
  }: {
    value: string;
    onBlur: (value: string) => void;
    disabled: boolean;
    placeholder?: string;
    class?: string;
  } = $props();

  let localValue = $state("");

  $effect(() => {
    localValue = value;
  });
</script>

<Input
  type="password"
  value={localValue}
  oninput={(e: Event) => { localValue = (e.target as HTMLInputElement).value; }}
  onblur={() => onBlur(localValue)}
  {placeholder}
  variant="compact"
  {disabled}
  class="flex-1 min-w-[320px] {className}"
/>
