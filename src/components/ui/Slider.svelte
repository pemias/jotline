<script lang="ts">
  import SettingContainer from "./SettingContainer.svelte";

  let {
    value,
    onChange,
    min,
    max,
    step = 0.01,
    disabled = false,
    label,
    description,
    descriptionMode = "tooltip",
    grouped = false,
    showValue = true,
    formatValue = (v: number) => v.toFixed(2),
  }: {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    disabled?: boolean;
    label: string;
    description: string;
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
    showValue?: boolean;
    formatValue?: (value: number) => string;
  } = $props();

  function handleChange(e: Event) {
    onChange(parseFloat((e.target as HTMLInputElement).value));
  }
</script>

<SettingContainer
  title={label}
  {description}
  {descriptionMode}
  {grouped}
  layout="horizontal"
  {disabled}
>
  <div class="w-full">
    <div class="flex items-center space-x-1 h-6">
      <input
        type="range"
        {min}
        {max}
        {step}
        {value}
        oninput={handleChange}
        {disabled}
        class="flex-grow h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-logo-primary disabled:opacity-50 disabled:cursor-not-allowed"
        style:background="linear-gradient(to right, var(--color-background-ui) {((value - min) / (max - min)) * 100}%, rgba(128, 128, 128, 0.2) {((value - min) / (max - min)) * 100}%)"
      />
      {#if showValue}
        <span class="text-sm font-medium text-text/90 min-w-10 text-end">
          {formatValue(value)}
        </span>
      {/if}
    </div>
  </div>
</SettingContainer>
