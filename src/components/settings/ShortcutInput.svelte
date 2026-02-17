<script lang="ts">
  import { settings } from "@/stores/settingsStore";
  import GlobalShortcutInput from "./GlobalShortcutInput.svelte";
  import HandyKeysShortcutInput from "./HandyKeysShortcutInput.svelte";

  let {
    descriptionMode = "tooltip",
    grouped = false,
    shortcutId,
    disabled = false,
  }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
    shortcutId: string;
    disabled?: boolean;
  } = $props();

  let keyboardImplementation = $derived($settings?.keyboard_implementation);
</script>

{#if keyboardImplementation === "handy_keys"}
  <HandyKeysShortcutInput {descriptionMode} {grouped} {shortcutId} {disabled} />
{:else}
  <GlobalShortcutInput {descriptionMode} {grouped} {shortcutId} {disabled} />
{/if}
