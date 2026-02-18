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
  {#if error}
    <p class="text-red-400 text-sm">
      {$t("errors.loadDirectory", { error })}
    </p>
  {:else}
    <PathDisplay path={logDir} onOpen={handleOpen} disabled={loading || !logDir} />
  {/if}
</SettingContainer>
