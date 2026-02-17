<script lang="ts">
  import { t, SUPPORTED_LANGUAGES, changeLanguage } from "@/i18n";
  import { settings, updateSetting } from "@/stores/settingsStore";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import i18n from "@/i18n";

  let { descriptionMode = "tooltip", grouped = false }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  let currentLanguage = $derived($settings?.app_language || i18n.language);

  let languageOptions = $derived(
    SUPPORTED_LANGUAGES.map((lang) => ({
      value: lang.code,
      label: `${lang.nativeName} (${lang.name})`,
    }))
  );

  function handleLanguageChange(langCode: string) {
    changeLanguage(langCode);
    updateSetting("app_language", langCode);
  }
</script>

<SettingContainer
  title={$t("appLanguage.title")}
  description={$t("appLanguage.description")}
  {descriptionMode}
  {grouped}
>
  <Dropdown
    options={languageOptions}
    selectedValue={currentLanguage}
    onSelect={handleLanguageChange}
  />
</SettingContainer>
