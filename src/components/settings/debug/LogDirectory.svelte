<script lang="ts">
  import { t } from "@/i18n";
  import { commands } from "@/bindings";
  import SettingContainer from "../../ui/SettingContainer.svelte";
  import PathDisplay from "../../ui/PathDisplay.svelte";

  let {
    descriptionMode = "tooltip",
    grouped = false,
  }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();

  let logDir = $state("");
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    const loadLogDirectory = async () => {
      try {
        const result = await commands.getLogDirPath();
        if (result.status === "ok") {
          logDir = result.data;
        } else {
          error = result.error;
        }
      } catch (err) {
        const errorMessage =
          err && typeof err === "object" && "message" in err
            ? String(err.message)
            : "Failed to load log directory";
        error = errorMessage;
      } finally {
        loading = false;
      }
    };

    loadLogDirectory();
  });

  async function handleOpen() {
    if (!logDir) return;
    try {
      await commands.openLogDir();
    } catch (openError) {
      console.error("Failed to open log directory:", openError);
    }
  }
</script>

<SettingContainer
  title={$t("settings.debug.logDirectory.title")}
  description={$t("settings.debug.logDirectory.description")}
  {descriptionMode}
  {grouped}
  layout="stacked"
>
  {#if loading}
    <div class="animate-pulse">
      <div class="h-8 bg-gray-100 rounded"></div>
    </div>
  {:else if error}
    <div class="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-600">
      {$t("errors.loadDirectory", { error })}
    </div>
  {:else}
    <PathDisplay path={logDir} onOpen={handleOpen} disabled={!logDir} />
  {/if}
</SettingContainer>
