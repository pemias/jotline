<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import Input from "../ui/Input.svelte";
  import Button from "../ui/Button.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let newWord = $state("");
  let customWords = $derived($settings?.custom_words || []);
  let updating = $derived(isUpdatingKey("custom_words"));

  function handleAddWord() {
    const trimmedWord = newWord.trim();
    const sanitizedWord = trimmedWord.replace(/[<>"'&]/g, "");
    if (
      sanitizedWord &&
      !sanitizedWord.includes(" ") &&
      sanitizedWord.length <= 50 &&
      !customWords.includes(sanitizedWord)
    ) {
      updateSetting("custom_words", [...customWords, sanitizedWord]);
      newWord = "";
    }
  }

  function handleRemoveWord(wordToRemove: string) {
    updateSetting(
      "custom_words",
      customWords.filter((word) => word !== wordToRemove),
    );
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddWord();
    }
  }
</script>

<SettingContainer
  title={$t("settings.advanced.customWords.title")}
  description={$t("settings.advanced.customWords.description")}
  {descriptionMode}
  {grouped}
>
  <div class="flex items-center gap-2">
    <Input
      type="text"
      class="max-w-40"
      value={newWord}
      oninput={(e) => { newWord = (e.target as HTMLInputElement).value; }}
      onkeydown={handleKeyPress}
      placeholder={$t("settings.advanced.customWords.placeholder")}
      variant="compact"
      disabled={updating}
    />
    <Button
      onclick={handleAddWord}
      disabled={!newWord.trim() || newWord.includes(" ") || newWord.trim().length > 50 || updating}
      variant="primary"
      size="md"
    >
      {$t("settings.advanced.customWords.add")}
    </Button>
  </div>
</SettingContainer>
{#if customWords.length > 0}
  <div
    class="px-4 p-2 {grouped ? '' : 'rounded-lg border border-mid-gray/20'} flex flex-wrap gap-1"
  >
    {#each customWords as word (word)}
      <Button
        onclick={() => handleRemoveWord(word)}
        disabled={updating}
        variant="secondary"
        size="sm"
        class="inline-flex items-center gap-1 cursor-pointer"
        aria-label={$t("settings.advanced.customWords.remove", { word })}
      >
        <span>{word}</span>
        <svg
          class="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </Button>
    {/each}
  </div>
{/if}
