<script lang="ts">
  import { t } from "@/i18n";
  import { getVersion } from "@tauri-apps/api/app";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import SettingsGroup from "../../ui/SettingsGroup.svelte";
  import SettingContainer from "../../ui/SettingContainer.svelte";
  import Button from "../../ui/Button.svelte";
  import AppDataDirectory from "../AppDataDirectory.svelte";
  import AppLanguageSelector from "../AppLanguageSelector.svelte";
  import LogDirectory from "../debug/LogDirectory.svelte";

  let version = $state("");

  $effect(() => {
    const fetchVersion = async () => {
      try {
        const appVersion = await getVersion();
        version = appVersion;
      } catch (error) {
        console.error("Failed to get app version:", error);
        version = "0.1.2";
      }
    };
    fetchVersion();
  });

  const handleDonateClick = async () => {
    try {
      await openUrl("https://handy.computer/donate");
    } catch (error) {
      console.error("Failed to open donate link:", error);
    }
  };
</script>

<div class="max-w-3xl w-full mx-auto space-y-6">
  <SettingsGroup title={$t("settings.about.title")}>
    <AppLanguageSelector descriptionMode="tooltip" grouped={true} />
    <SettingContainer
      title={$t("settings.about.version.title")}
      description={$t("settings.about.version.description")}
      grouped={true}
    >
      <span class="text-sm font-mono">v{version}</span>
    </SettingContainer>

    <SettingContainer
      title={$t("settings.about.supportDevelopment.title")}
      description={$t("settings.about.supportDevelopment.description")}
      grouped={true}
    >
      <Button variant="primary" size="md" onclick={handleDonateClick}>
        {$t("settings.about.supportDevelopment.button")}
      </Button>
    </SettingContainer>

    <SettingContainer
      title={$t("settings.about.sourceCode.title")}
      description={$t("settings.about.sourceCode.description")}
      grouped={true}
    >
      <Button
        variant="secondary"
        size="md"
        onclick={() => openUrl("https://github.com/cjpais/Handy")}
      >
        {$t("settings.about.sourceCode.button")}
      </Button>
    </SettingContainer>

    <AppDataDirectory descriptionMode="tooltip" grouped={true} />
    <LogDirectory grouped={true} />
  </SettingsGroup>

  <SettingsGroup title={$t("settings.about.acknowledgments.title")}>
    <SettingContainer
      title={$t("settings.about.acknowledgments.whisper.title")}
      description={$t("settings.about.acknowledgments.whisper.description")}
      grouped={true}
      layout="stacked"
    >
      <div class="text-sm text-mid-gray">
        {$t("settings.about.acknowledgments.whisper.details")}
      </div>
    </SettingContainer>
  </SettingsGroup>
</div>
