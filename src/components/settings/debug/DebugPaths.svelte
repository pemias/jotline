<script lang="ts">
  import { t } from "@/i18n";
  import { appDataDir, join } from "@tauri-apps/api/path";
  import SettingContainer from "../../ui/SettingContainer.svelte";

  let {
    descriptionMode = "inline",
    grouped = false,
  }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();

  let appDataPath = $state("");
  let modelsPath = $state("");
  let settingsPath = $state("");

  $effect(() => {
    const fetchPaths = async () => {
      try {
        const base = await appDataDir();
        appDataPath = base;
        modelsPath = await join(base, "models");
        settingsPath = await join(base, "settings_store.json");
      } catch (error) {
        console.error("Failed to resolve paths:", error);
      }
    };
    fetchPaths();
  });
</script>

<SettingContainer
  title={$t("settings.debug.paths.title")}
  description={$t("settings.debug.paths.description")}
  {descriptionMode}
  {grouped}
  layout="stacked"
>
  <div class="text-sm text-mid-gray space-y-1">
    <div>
      <span class="font-medium">{$t("settings.debug.paths.appData")}</span>
      <div class="font-mono text-xs select-text break-all">{appDataPath}</div>
    </div>
    <div>
      <span class="font-medium">{$t("settings.debug.paths.models")}</span>
      <div class="font-mono text-xs select-text break-all">{modelsPath}</div>
    </div>
    <div>
      <span class="font-medium">{$t("settings.debug.paths.settings")}</span>
      <div class="font-mono text-xs select-text break-all">{settingsPath}</div>
    </div>
  </div>
</SettingContainer>
