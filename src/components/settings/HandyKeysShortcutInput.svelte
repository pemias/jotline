<script lang="ts">
  import { t } from "@/i18n";
  import { listen } from "@tauri-apps/api/event";
  import { formatKeyCombination } from "../../lib/utils/keyboard";
  import ResetButton from "../ui/ResetButton.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import {
    settings,
    isLoading,
    updateBinding,
    resetBinding,
    isUpdatingKey,
  } from "@/stores/settingsStore";
  import { getOsType } from "@/lib/utils/osType";
  import { commands } from "@/bindings";
  import { toast } from "svelte-sonner";
  import { onDestroy } from "svelte";

  interface HandyKeysEvent {
    modifiers: string[];
    key: string | null;
    is_key_down: boolean;
    hotkey_string: string;
  }

  let {
    descriptionMode = "tooltip",
    grouped = false,
    shortcutId,
    disabled = false,
  }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
    shortcutId: string;
    disabled?: boolean;
  } = $props();

  const osType = getOsType();

  let isRecording = $state(false);
  let currentKeys = $state("");
  let originalBinding = $state("");
  let shortcutRef: HTMLDivElement | undefined = $state();
  let unlistenFn: (() => void) | null = null;
  // Use a module-level variable to avoid stale closure issues
  let currentKeysSnapshot = "";

  let bindings = $derived($settings?.bindings || {});

  async function cancelRecording() {
    if (!isRecording) return;

    if (unlistenFn) {
      unlistenFn();
      unlistenFn = null;
    }

    await commands.stopHandyKeysRecording().catch(console.error);

    if (originalBinding) {
      try {
        await updateBinding(shortcutId, originalBinding);
      } catch (error) {
        console.error("Failed to restore original binding:", error);
        toast.error($t("settings.general.shortcut.errors.restore"));
      }
    }

    isRecording = false;
    currentKeys = "";
    currentKeysSnapshot = "";
    originalBinding = "";
  }

  // Set up event listener for handy-keys events
  $effect(() => {
    if (!isRecording) return;

    let cleanup = false;

    const setupListener = async () => {
      const unlisten = await listen<HandyKeysEvent>(
        "handy-keys-event",
        async (event) => {
          if (cleanup) return;

          const { hotkey_string, is_key_down } = event.payload;

          if (is_key_down && hotkey_string) {
            currentKeysSnapshot = hotkey_string;
            currentKeys = hotkey_string;
          } else if (!is_key_down && currentKeysSnapshot) {
            const keysToCommit = currentKeysSnapshot;
            try {
              await updateBinding(shortcutId, keysToCommit);
            } catch (error) {
              console.error("Failed to change binding:", error);
              toast.error(
                $t("settings.general.shortcut.errors.set", {
                  error: String(error),
                }),
              );

              if (originalBinding) {
                try {
                  await updateBinding(shortcutId, originalBinding);
                } catch (resetError) {
                  console.error("Failed to reset binding:", resetError);
                  toast.error($t("settings.general.shortcut.errors.reset"));
                }
              }
            }

            if (unlistenFn) {
              unlistenFn();
              unlistenFn = null;
            }
            await commands.stopHandyKeysRecording().catch(console.error);
            isRecording = false;
            currentKeys = "";
            currentKeysSnapshot = "";
            originalBinding = "";
          }
        },
      );

      unlistenFn = unlisten;
    };

    setupListener();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cleanup = true;
      window.removeEventListener("keydown", handleKeyDown);
      if (unlistenFn) {
        unlistenFn();
        unlistenFn = null;
      }
      commands.stopHandyKeysRecording().catch(console.error);
    };
  });

  // Handle click outside
  $effect(() => {
    if (!isRecording) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (shortcutRef && !shortcutRef.contains(e.target as Node)) {
        cancelRecording();
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  });

  async function startRecording() {
    if (isRecording) return;

    originalBinding = bindings[shortcutId]?.current_binding || "";

    try {
      await commands.startHandyKeysRecording(shortcutId);
      isRecording = true;
      currentKeys = "";
      currentKeysSnapshot = "";
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error(
        $t("settings.general.shortcut.errors.set", { error: String(error) }),
      );
    }
  }

  function formatCurrentKeys(): string {
    if (!currentKeys) return $t("settings.general.shortcut.pressKeys");
    return formatKeyCombination(currentKeys, osType);
  }

  let binding = $derived(bindings[shortcutId]);

  let translatedName = $derived(
    $t(
      `settings.general.shortcut.bindings.${shortcutId}.name`,
      binding?.name ?? "",
    )
  );
  let translatedDescription = $derived(
    $t(
      `settings.general.shortcut.bindings.${shortcutId}.description`,
      binding?.description ?? "",
    )
  );

  onDestroy(() => {
    if (unlistenFn) {
      unlistenFn();
      unlistenFn = null;
    }
  });
</script>

{#if $isLoading}
  <SettingContainer
    title={$t("settings.general.shortcut.title")}
    description={$t("settings.general.shortcut.description")}
    {descriptionMode}
    {grouped}
  >
    <div class="text-sm text-mid-gray">
      {$t("settings.general.shortcut.loading")}
    </div>
  </SettingContainer>
{:else if Object.keys(bindings).length === 0}
  <SettingContainer
    title={$t("settings.general.shortcut.title")}
    description={$t("settings.general.shortcut.description")}
    {descriptionMode}
    {grouped}
  >
    <div class="text-sm text-mid-gray">
      {$t("settings.general.shortcut.none")}
    </div>
  </SettingContainer>
{:else if !binding}
  <SettingContainer
    title={$t("settings.general.shortcut.title")}
    description={$t("settings.general.shortcut.notFound")}
    {descriptionMode}
    {grouped}
  >
    <div class="text-sm text-mid-gray">
      {$t("settings.general.shortcut.none")}
    </div>
  </SettingContainer>
{:else}
  <SettingContainer
    title={translatedName}
    description={translatedDescription}
    {descriptionMode}
    {grouped}
    {disabled}
    layout="horizontal"
  >
    <div class="flex items-center space-x-1">
      {#if isRecording}
        <div
          bind:this={shortcutRef}
          class="px-2 py-1 text-sm font-semibold border border-logo-primary bg-logo-primary/30 rounded-md"
        >
          {formatCurrentKeys()}
        </div>
      {:else}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 hover:bg-logo-primary/10 rounded-md cursor-pointer hover:border-logo-primary"
          role="button"
          tabindex="0"
          onclick={startRecording}
        >
          {formatKeyCombination(binding.current_binding, osType)}
        </div>
      {/if}
      <ResetButton
        onclick={() => resetBinding(shortcutId)}
        disabled={isUpdatingKey(`binding_${shortcutId}`)}
      />
    </div>
  </SettingContainer>
{/if}
