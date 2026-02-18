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

<SettingContainer
  title={$t("settings.about.appDataDirectory.title")}
  description={$t("settings.about.appDataDirectory.description")}
  {descriptionMode}
  {grouped}
  layout="stacked"
>
  {#if error}
    <p class="text-red-400 text-sm">
      {$t("errors.loadDirectory", { error })}
    </p>
  {:else}
    <PathDisplay
      path={appDirPath}
      onOpen={handleOpen}
      disabled={loading || !appDirPath}
    />
  {/if}
</SettingContainer>
