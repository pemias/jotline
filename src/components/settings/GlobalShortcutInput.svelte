<script lang="ts">
  import { t } from "@/i18n";
  import {
    getKeyName,
    formatKeyCombination,
    normalizeKey,
  } from "../../lib/utils/keyboard";
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

  let keyPressed = $state<string[]>([]);
  let recordedKeys = $state<string[]>([]);
  let editingShortcutId = $state<string | null>(null);
  let originalBinding = $state("");
  let shortcutRef: HTMLDivElement | undefined = $state();

  let bindings = $derived($settings?.bindings || {});

  $effect(() => {
    if (editingShortcutId === null) return;

    let cleanup = false;

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (cleanup) return;
      if (e.repeat) return;
      if (e.key === "Escape") {
        if (editingShortcutId && originalBinding) {
          try {
            await updateBinding(editingShortcutId, originalBinding);
          } catch (error) {
            console.error("Failed to restore original binding:", error);
            toast.error($t("settings.general.shortcut.errors.restore"));
          }
        } else if (editingShortcutId) {
          await commands.resumeBinding(editingShortcutId).catch(console.error);
        }
        editingShortcutId = null;
        keyPressed = [];
        recordedKeys = [];
        originalBinding = "";
        return;
      }
      e.preventDefault();

      const rawKey = getKeyName(e, osType);
      const key = normalizeKey(rawKey);

      if (!keyPressed.includes(key)) {
        keyPressed = [...keyPressed, key];
        if (!recordedKeys.includes(key)) {
          recordedKeys = [...recordedKeys, key];
        }
      }
    };

    const handleKeyUp = async (e: KeyboardEvent) => {
      if (cleanup) return;
      e.preventDefault();

      const rawKey = getKeyName(e, osType);
      const key = normalizeKey(rawKey);

      const updatedKeyPressed = keyPressed.filter((k) => k !== key);
      keyPressed = updatedKeyPressed;

      if (updatedKeyPressed.length === 0 && recordedKeys.length > 0) {
        const modifiers = [
          "ctrl", "control", "shift", "alt", "option",
          "meta", "command", "cmd", "super", "win", "windows",
        ];
        const sortedKeys = [...recordedKeys].sort((a, b) => {
          const aIsModifier = modifiers.includes(a.toLowerCase());
          const bIsModifier = modifiers.includes(b.toLowerCase());
          if (aIsModifier && !bIsModifier) return -1;
          if (!aIsModifier && bIsModifier) return 1;
          return 0;
        });
        const newShortcut = sortedKeys.join("+");

        if (editingShortcutId && bindings[editingShortcutId]) {
          try {
            await updateBinding(editingShortcutId, newShortcut);
          } catch (error) {
            console.error("Failed to change binding:", error);
            toast.error(
              $t("settings.general.shortcut.errors.set", {
                error: String(error),
              }),
            );

            if (originalBinding) {
              try {
                await updateBinding(editingShortcutId, originalBinding);
              } catch (resetError) {
                console.error("Failed to reset binding:", resetError);
                toast.error($t("settings.general.shortcut.errors.reset"));
              }
            }
          }

          editingShortcutId = null;
          keyPressed = [];
          recordedKeys = [];
          originalBinding = "";
        }
      }
    };

    const handleClickOutside = async (e: MouseEvent) => {
      if (cleanup) return;
      if (shortcutRef && !shortcutRef.contains(e.target as Node)) {
        if (editingShortcutId && originalBinding) {
          try {
            await updateBinding(editingShortcutId, originalBinding);
          } catch (error) {
            console.error("Failed to restore original binding:", error);
            toast.error($t("settings.general.shortcut.errors.restore"));
          }
        } else if (editingShortcutId) {
          commands.resumeBinding(editingShortcutId).catch(console.error);
        }
        editingShortcutId = null;
        keyPressed = [];
        recordedKeys = [];
        originalBinding = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("click", handleClickOutside);

    return () => {
      cleanup = true;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("click", handleClickOutside);
    };
  });

  async function startRecording(id: string) {
    if (editingShortcutId === id) return;

    await commands.suspendBinding(id).catch(console.error);

    originalBinding = bindings[id]?.current_binding || "";
    editingShortcutId = id;
    keyPressed = [];
    recordedKeys = [];
  }

  function formatCurrentKeys(): string {
    if (recordedKeys.length === 0)
      return $t("settings.general.shortcut.pressKeys");
    return formatKeyCombination(recordedKeys.join("+"), osType);
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
      {#if editingShortcutId === shortcutId}
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
          onclick={() => startRecording(shortcutId)}
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
