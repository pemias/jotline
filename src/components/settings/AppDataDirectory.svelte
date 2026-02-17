<script lang="ts">
  import { t } from "@/i18n";
  import { commands } from "@/bindings";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import PathDisplay from "../ui/PathDisplay.svelte";

  let { descriptionMode = "inline", grouped = false }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();

  let appDirPath = $state("");
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    loadAppDirectory();
  });

  async function loadAppDirectory() {
    try {
      const result = await commands.getAppDirPath();
      if (result.status === "ok") {
        appDirPath = result.data;
      } else {
        error = result.error;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load app directory";
    } finally {
      loading = false;
    }
  }

  async function handleOpen() {
    if (!appDirPath) return;
    try {
      await commands.openAppDataDir();
    } catch (openError) {
      console.error("Failed to open app data directory:", openError);
    }
  }
</script>

{#if loading}
  <div class="animate-pulse">
    <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
    <div class="h-8 bg-gray-100 rounded"></div>
  </div>
{:else if error}
  <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
    <p class="text-red-600 text-sm">
      {$t("errors.loadDirectory", { error })}
    </p>
  </div>
{:else}
  <SettingContainer
    title={$t("settings.about.appDataDirectory.title")}
    description={$t("settings.about.appDataDirectory.description")}
    {descriptionMode}
    {grouped}
    layout="stacked"
  >
    <PathDisplay
      path={appDirPath}
      onOpen={handleOpen}
      disabled={!appDirPath}
    />
  </SettingContainer>
{/if}
