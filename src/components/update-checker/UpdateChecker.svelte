<script lang="ts">
  import { t } from "@/i18n";
  import { untrack } from "svelte";
  import { check } from "@tauri-apps/plugin-updater";
  import { relaunch } from "@tauri-apps/plugin-process";
  import { listen } from "@tauri-apps/api/event";
  import { ProgressBar } from "../shared";
  import { settings, isLoading } from "../../stores/settingsStore";

  let {
    class: className = "",
  }: {
    class?: string;
  } = $props();

  let isChecking = $state(false);
  let updateAvailable = $state(false);
  let isInstalling = $state(false);
  let downloadProgress = $state(0);
  let showUpToDate = $state(false);

  let settingsLoaded = $derived(!$isLoading && $settings !== null);
  let updateChecksEnabled = $derived($settings?.update_checks_enabled ?? false);

  let upToDateTimeout: ReturnType<typeof setTimeout> | undefined;
  let isManualCheck = false;
  let downloadedBytes = 0;
  let contentLength = 0;

  const checkForUpdates = async () => {
    if (!updateChecksEnabled || isChecking) return;

    try {
      isChecking = true;
      const update = await check();

      if (update) {
        updateAvailable = true;
        showUpToDate = false;
      } else {
        updateAvailable = false;

        if (isManualCheck) {
          showUpToDate = true;
          if (upToDateTimeout) clearTimeout(upToDateTimeout);
          upToDateTimeout = setTimeout(() => {
            showUpToDate = false;
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    } finally {
      isChecking = false;
      isManualCheck = false;
    }
  };

  const handleManualUpdateCheck = () => {
    if (!updateChecksEnabled) return;
    isManualCheck = true;
    checkForUpdates();
  };

  const installUpdate = async () => {
    if (!updateChecksEnabled) return;
    try {
      isInstalling = true;
      downloadProgress = 0;
      downloadedBytes = 0;
      contentLength = 0;
      const update = await check();

      if (!update) {
        console.log("No update available during install attempt");
        return;
      }

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            downloadedBytes = 0;
            contentLength = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            const progress =
              contentLength > 0
                ? Math.round((downloadedBytes / contentLength) * 100)
                : 0;
            downloadProgress = Math.min(progress, 100);
            break;
        }
      });
      await relaunch();
    } catch (error) {
      console.error("Failed to install update:", error);
    } finally {
      isInstalling = false;
      downloadProgress = 0;
      downloadedBytes = 0;
      contentLength = 0;
    }
  };

  $effect(() => {
    if (!settingsLoaded) return;

    if (!updateChecksEnabled) {
      if (upToDateTimeout) clearTimeout(upToDateTimeout);
      isChecking = false;
      updateAvailable = false;
      showUpToDate = false;
      return;
    }

    untrack(() => {
      checkForUpdates();
    });

    const updateUnlisten = listen("check-for-updates", () => {
      handleManualUpdateCheck();
    });

    return () => {
      if (upToDateTimeout) clearTimeout(upToDateTimeout);
      updateUnlisten.then((fn) => fn());
    };
  });

  let updateStatusText = $derived.by(() => {
    if (!updateChecksEnabled) return $t("footer.updateCheckingDisabled");
    if (isInstalling) {
      return downloadProgress > 0 && downloadProgress < 100
        ? $t("footer.downloading", {
            progress: downloadProgress.toString().padStart(3),
          })
        : downloadProgress === 100
          ? $t("footer.installing")
          : $t("footer.preparing");
    }
    if (isChecking) return $t("footer.checkingUpdates");
    if (showUpToDate) return $t("footer.upToDate");
    if (updateAvailable) return $t("footer.updateAvailableShort");
    return $t("footer.checkForUpdates");
  });

  let updateStatusAction = $derived.by(() => {
    if (!updateChecksEnabled) return undefined;
    if (updateAvailable && !isInstalling) return installUpdate;
    if (!isChecking && !isInstalling && !updateAvailable) return handleManualUpdateCheck;
    return undefined;
  });

  let isUpdateDisabled = $derived(!updateChecksEnabled || isChecking || isInstalling);
  let isUpdateClickable = $derived(
    !isUpdateDisabled && (updateAvailable || (!isChecking && !showUpToDate))
  );
</script>

<div class="flex items-center gap-3 {className}">
  {#if isUpdateClickable}
    <button
      onclick={updateStatusAction}
      disabled={isUpdateDisabled}
      class="transition-colors disabled:opacity-50 tabular-nums {updateAvailable
        ? 'text-logo-primary hover:text-logo-primary/80 font-medium'
        : 'text-text/60 hover:text-text/80'}"
    >
      {updateStatusText}
    </button>
  {:else}
    <span class="text-text/60 tabular-nums">
      {updateStatusText}
    </span>
  {/if}

  {#if isInstalling && downloadProgress > 0 && downloadProgress < 100}
    <ProgressBar
      progress={[
        {
          id: "update",
          percentage: downloadProgress,
        },
      ]}
      size="large"
    />
  {/if}
</div>
