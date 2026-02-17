<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, resetSetting, isUpdatingKey } from "@/stores/settingsStore";
  import { LANGUAGES } from "@/lib/constants/languages";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import ResetButton from "../ui/ResetButton.svelte";

  let { descriptionMode = "tooltip", grouped = false, supportedLanguages }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
    supportedLanguages?: string[];
  } = $props();

  let isOpen = $state(false);
  let searchQuery = $state("");
  let dropdownRef: HTMLDivElement | undefined = $state();
  let searchInputRef: HTMLInputElement | undefined = $state();

  let selectedLanguage = $derived($settings?.selected_language || "auto");
  let updating = $derived(isUpdatingKey("selected_language"));

  $effect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        isOpen = false;
        searchQuery = "";
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  $effect(() => {
    if (isOpen && searchInputRef) {
      searchInputRef.focus();
    }
  });

  let availableLanguages = $derived.by(() => {
    if (!supportedLanguages || supportedLanguages.length === 0) return LANGUAGES;
    return LANGUAGES.filter(
      (lang) => lang.value === "auto" || supportedLanguages.includes(lang.value),
    );
  });

  let filteredLanguages = $derived(
    availableLanguages.filter((language) =>
      language.label.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  );

  let selectedLanguageName = $derived(
    LANGUAGES.find((lang) => lang.value === selectedLanguage)?.label ||
    $t("settings.general.language.auto")
  );

  async function handleLanguageSelect(languageCode: string) {
    await updateSetting("selected_language", languageCode);
    isOpen = false;
    searchQuery = "";
  }

  async function handleReset() {
    await resetSetting("selected_language");
  }

  function handleToggle() {
    if (updating) return;
    isOpen = !isOpen;
  }

  function handleSearchChange(event: Event) {
    searchQuery = (event.target as HTMLInputElement).value;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && filteredLanguages.length > 0) {
      handleLanguageSelect(filteredLanguages[0].value);
    } else if (event.key === "Escape") {
      isOpen = false;
      searchQuery = "";
    }
  }
</script>

<SettingContainer
  title={$t("settings.general.language.title")}
  description={$t("settings.general.language.description")}
  {descriptionMode}
  {grouped}
>
  <div class="flex items-center space-x-1">
    <div class="relative" bind:this={dropdownRef}>
      <button
        type="button"
        class="px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 rounded min-w-[200px] text-start flex items-center justify-between transition-all duration-150 {updating
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-logo-primary/10 cursor-pointer hover:border-logo-primary'}"
        onclick={handleToggle}
        disabled={updating}
      >
        <span class="truncate">{selectedLanguageName}</span>
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

      {#if isOpen && !updating}
        <div class="absolute top-full left-0 right-0 mt-1 bg-background border border-mid-gray/80 rounded shadow-lg z-50 max-h-60 overflow-hidden">
          <div class="p-2 border-b border-mid-gray/80">
            <input
              bind:this={searchInputRef}
              type="text"
              value={searchQuery}
              oninput={handleSearchChange}
              onkeydown={handleKeyDown}
              placeholder={$t("settings.general.language.searchPlaceholder")}
              class="w-full px-2 py-1 text-sm bg-mid-gray/10 border border-mid-gray/40 rounded focus:outline-none focus:ring-1 focus:ring-logo-primary focus:border-logo-primary"
            />
          </div>

          <div class="max-h-48 overflow-y-auto">
            {#if filteredLanguages.length === 0}
              <div class="px-2 py-2 text-sm text-mid-gray text-center">
                {$t("settings.general.language.noResults")}
              </div>
            {:else}
              {#each filteredLanguages as language (language.value)}
                <button
                  type="button"
                  class="w-full px-2 py-1 text-sm text-start hover:bg-logo-primary/10 transition-colors duration-150 {selectedLanguage === language.value
                    ? 'bg-logo-primary/20 text-logo-primary font-semibold'
                    : ''}"
                  onclick={() => handleLanguageSelect(language.value)}
                >
                  <div class="flex items-center justify-between">
                    <span class="truncate">{language.label}</span>
                  </div>
                </button>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
    <ResetButton
      onclick={handleReset}
      disabled={updating}
    />
  </div>
  {#if updating}
    <div class="absolute inset-0 bg-mid-gray/10 rounded flex items-center justify-center">
      <div class="w-4 h-4 border-2 border-logo-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  {/if}
</SettingContainer>
