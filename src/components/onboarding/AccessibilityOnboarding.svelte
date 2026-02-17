<script lang="ts">
  import { t } from "@/i18n";
  import { platform } from "@tauri-apps/plugin-os";
  import {
    checkAccessibilityPermission,
    requestAccessibilityPermission,
    checkMicrophonePermission,
    requestMicrophonePermission,
  } from "tauri-plugin-macos-permissions-api";
  import { toast } from "svelte-sonner";
  import { commands } from "@/bindings";
  import { refreshAudioDevices, refreshOutputDevices } from "@/stores/settingsStore";
  import HandyTextLogo from "../icons/HandyTextLogo.svelte";
  import { Keyboard, Mic, Check, Loader2 } from "lucide-svelte";

  let {
    onComplete,
  }: {
    onComplete: () => void;
  } = $props();

  type PermissionStatus = "checking" | "needed" | "waiting" | "granted";

  let isMacOS = $state<boolean | null>(null);
  let accessibilityStatus = $state<PermissionStatus>("checking");
  let microphoneStatus = $state<PermissionStatus>("checking");

  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  let completionTimeout: ReturnType<typeof setTimeout> | null = null;
  let errorCount = 0;
  const MAX_POLLING_ERRORS = 3;

  let allGranted = $derived(
    accessibilityStatus === "granted" && microphoneStatus === "granted"
  );

  // Check platform and permission status on mount
  $effect(() => {
    const currentPlatform = platform();
    const isMac = currentPlatform === "macos";
    isMacOS = isMac;

    if (!isMac) {
      onComplete();
      return;
    }

    const checkInitial = async () => {
      try {
        const [accessibilityGranted, microphoneGranted] = await Promise.all([
          checkAccessibilityPermission(),
          checkMicrophonePermission(),
        ]);

        if (accessibilityGranted) {
          try {
            await Promise.all([
              commands.initializeEnigo(),
              commands.initializeShortcuts(),
            ]);
          } catch (e) {
            console.warn("Failed to initialize after permission grant:", e);
          }
        }

        accessibilityStatus = accessibilityGranted ? "granted" : "needed";
        microphoneStatus = microphoneGranted ? "granted" : "needed";

        if (accessibilityGranted && microphoneGranted) {
          await Promise.all([refreshAudioDevices(), refreshOutputDevices()]);
          completionTimeout = setTimeout(() => onComplete(), 300);
        }
      } catch (error) {
        console.error("Failed to check permissions:", error);
        toast.error($t("onboarding.permissions.errors.checkFailed"));
        accessibilityStatus = "needed";
        microphoneStatus = "needed";
      }
    };

    checkInitial();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (completionTimeout) clearTimeout(completionTimeout);
    };
  });

  const startPolling = () => {
    if (pollingInterval) return;

    pollingInterval = setInterval(async () => {
      try {
        const [accessibilityGranted, microphoneGranted] = await Promise.all([
          checkAccessibilityPermission(),
          checkMicrophonePermission(),
        ]);

        if (accessibilityGranted && accessibilityStatus !== "granted") {
          accessibilityStatus = "granted";
          Promise.all([
            commands.initializeEnigo(),
            commands.initializeShortcuts(),
          ]).catch((e) => {
            console.warn("Failed to initialize after permission grant:", e);
          });
        }

        if (microphoneGranted && microphoneStatus !== "granted") {
          microphoneStatus = "granted";
        }

        if (accessibilityGranted && microphoneGranted) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
          await Promise.all([refreshAudioDevices(), refreshOutputDevices()]);
          completionTimeout = setTimeout(() => onComplete(), 500);
        }

        errorCount = 0;
      } catch (error) {
        console.error("Error checking permissions:", error);
        errorCount += 1;

        if (errorCount >= MAX_POLLING_ERRORS) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
          toast.error($t("onboarding.permissions.errors.checkFailed"));
        }
      }
    }, 1000);
  };

  const handleGrantAccessibility = async () => {
    try {
      await requestAccessibilityPermission();
      accessibilityStatus = "waiting";
      startPolling();
    } catch (error) {
      console.error("Failed to request accessibility permission:", error);
      toast.error($t("onboarding.permissions.errors.requestFailed"));
    }
  };

  const handleGrantMicrophone = async () => {
    try {
      await requestMicrophonePermission();
      microphoneStatus = "waiting";
      startPolling();
    } catch (error) {
      console.error("Failed to request microphone permission:", error);
      toast.error($t("onboarding.permissions.errors.requestFailed"));
    }
  };
</script>

{#if isMacOS === null || (accessibilityStatus === "checking" && microphoneStatus === "checking")}
  <div class="h-screen w-screen flex items-center justify-center">
    <Loader2 class="w-8 h-8 animate-spin text-text/50" />
  </div>
{:else if allGranted}
  <div class="h-screen w-screen flex flex-col items-center justify-center gap-4">
    <div class="p-4 rounded-full bg-emerald-500/20">
      <Check class="w-12 h-12 text-emerald-400" />
    </div>
    <p class="text-lg font-medium text-text">
      {$t("onboarding.permissions.allGranted")}
    </p>
  </div>
{:else}
  <div class="h-screen w-screen flex flex-col p-6 gap-6 items-center justify-center">
    <div class="flex flex-col items-center gap-2">
      <HandyTextLogo width={200} />
    </div>

    <div class="max-w-md w-full flex flex-col items-center gap-4">
      <div class="text-center mb-2">
        <h2 class="text-xl font-semibold text-text mb-2">
          {$t("onboarding.permissions.title")}
        </h2>
        <p class="text-text/70">
          {$t("onboarding.permissions.description")}
        </p>
      </div>

      <!-- Microphone Permission Card -->
      <div class="w-full p-4 rounded-lg bg-white/5 border border-mid-gray/20">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-full bg-logo-primary/20 shrink-0">
            <Mic class="w-6 h-6 text-logo-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-text">
              {$t("onboarding.permissions.microphone.title")}
            </h3>
            <p class="text-sm text-text/60 mb-3">
              {$t("onboarding.permissions.microphone.description")}
            </p>
            {#if microphoneStatus === "granted"}
              <div class="flex items-center gap-2 text-emerald-400 text-sm">
                <Check class="w-4 h-4" />
                {$t("onboarding.permissions.granted")}
              </div>
            {:else if microphoneStatus === "waiting"}
              <div class="flex items-center gap-2 text-text/50 text-sm">
                <Loader2 class="w-4 h-4 animate-spin" />
                {$t("onboarding.permissions.waiting")}
              </div>
            {:else}
              <button
                onclick={handleGrantMicrophone}
                class="px-4 py-2 rounded-lg bg-logo-primary hover:bg-logo-primary/90 text-white text-sm font-medium transition-colors"
              >
                {$t("onboarding.permissions.grant")}
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Accessibility Permission Card -->
      <div class="w-full p-4 rounded-lg bg-white/5 border border-mid-gray/20">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-full bg-logo-primary/20 shrink-0">
            <Keyboard class="w-6 h-6 text-logo-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-text">
              {$t("onboarding.permissions.accessibility.title")}
            </h3>
            <p class="text-sm text-text/60 mb-3">
              {$t("onboarding.permissions.accessibility.description")}
            </p>
            {#if accessibilityStatus === "granted"}
              <div class="flex items-center gap-2 text-emerald-400 text-sm">
                <Check class="w-4 h-4" />
                {$t("onboarding.permissions.granted")}
              </div>
            {:else if accessibilityStatus === "waiting"}
              <div class="flex items-center gap-2 text-text/50 text-sm">
                <Loader2 class="w-4 h-4 animate-spin" />
                {$t("onboarding.permissions.waiting")}
              </div>
            {:else}
              <button
                onclick={handleGrantAccessibility}
                class="px-4 py-2 rounded-lg bg-logo-primary hover:bg-logo-primary/90 text-white text-sm font-medium transition-colors"
              >
                {$t("onboarding.permissions.grant")}
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
