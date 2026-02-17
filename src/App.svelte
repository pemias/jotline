<script lang="ts">
  import { Toaster } from "svelte-sonner";
  import { t, locale } from "@/i18n";
  import { platform } from "@tauri-apps/plugin-os";
  import {
    checkAccessibilityPermission,
    checkMicrophonePermission,
  } from "tauri-plugin-macos-permissions-api";
  import "./App.css";
  import AccessibilityPermissions from "./components/AccessibilityPermissions.svelte";
  import Footer from "./components/footer/Footer.svelte";
  import Onboarding from "./components/onboarding/Onboarding.svelte";
  import AccessibilityOnboarding from "./components/onboarding/AccessibilityOnboarding.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import type { SidebarSection } from "./components/Sidebar.svelte";
  import GeneralSettings from "./components/settings/general/GeneralSettings.svelte";
  import ModelsSettings from "./components/settings/models/ModelsSettings.svelte";
  import AdvancedSettings from "./components/settings/advanced/AdvancedSettings.svelte";
  import PostProcessingSettings from "./components/settings/post-processing/PostProcessingSettings.svelte";
  import HistorySettings from "./components/settings/history/HistorySettings.svelte";
  import DebugSettings from "./components/settings/debug/DebugSettings.svelte";
  import AboutSettings from "./components/settings/about/AboutSettings.svelte";
  import {
    settings,
    updateSetting,
    refreshAudioDevices,
    refreshOutputDevices,
  } from "./stores/settingsStore";
  import { commands } from "@/bindings";
  import { getLanguageDirection, initializeRTL } from "@/lib/utils/rtl";

  type OnboardingStep = "accessibility" | "model" | "done";

  let onboardingStep = $state<OnboardingStep | null>(null);
  let isReturningUser = $state(false);
  let currentSection = $state<SidebarSection>("general");
  let hasCompletedPostOnboardingInit = false;

  let direction = $derived(getLanguageDirection($locale));

  // Check onboarding status on mount
  $effect(() => {
    checkOnboardingStatus();
  });

  // Initialize RTL direction when language changes
  $effect(() => {
    initializeRTL($locale);
  });

  // Initialize Enigo, shortcuts, and refresh audio devices when main app loads
  $effect(() => {
    if (onboardingStep === "done" && !hasCompletedPostOnboardingInit) {
      hasCompletedPostOnboardingInit = true;
      Promise.all([
        commands.initializeEnigo(),
        commands.initializeShortcuts(),
      ]).catch((e) => {
        console.warn("Failed to initialize:", e);
      });
      refreshAudioDevices();
      refreshOutputDevices();
    }
  });

  // Handle keyboard shortcuts for debug mode toggle
  $effect(() => {
    const debugMode = $settings?.debug_mode;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isDebugShortcut =
        event.shiftKey &&
        event.key.toLowerCase() === "d" &&
        (event.ctrlKey || event.metaKey);

      if (isDebugShortcut) {
        event.preventDefault();
        const currentDebugMode = $settings?.debug_mode ?? false;
        updateSetting("debug_mode", !currentDebugMode);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  const checkOnboardingStatus = async () => {
    try {
      const result = await commands.hasAnyModelsAvailable();
      const hasModels = result.status === "ok" && result.data;

      if (hasModels) {
        isReturningUser = true;
        if (platform() === "macos") {
          try {
            const [hasAccessibility, hasMicrophone] = await Promise.all([
              checkAccessibilityPermission(),
              checkMicrophonePermission(),
            ]);
            if (!hasAccessibility || !hasMicrophone) {
              onboardingStep = "accessibility";
              return;
            }
          } catch (e) {
            console.warn("Failed to check permissions:", e);
          }
        }
        onboardingStep = "done";
      } else {
        isReturningUser = false;
        onboardingStep = "accessibility";
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
      onboardingStep = "accessibility";
    }
  };

  const handleAccessibilityComplete = () => {
    onboardingStep = isReturningUser ? "done" : "model";
  };

  const handleModelSelected = () => {
    onboardingStep = "done";
  };
</script>

{#if onboardingStep === null}
  <!-- Still checking onboarding status -->
{:else if onboardingStep === "accessibility"}
  <AccessibilityOnboarding onComplete={handleAccessibilityComplete} />
{:else if onboardingStep === "model"}
  <Onboarding onModelSelected={handleModelSelected} />
{:else}
  <div
    dir={direction}
    class="h-screen flex flex-col select-none cursor-default"
  >
    <Toaster
      theme="system"
      toastOptions={{
        unstyled: true,
        classes: {
          toast:
            "bg-background border border-mid-gray/20 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm",
          title: "font-medium",
          description: "text-mid-gray",
        },
      }}
    />
    <!-- Main content area that takes remaining space -->
    <div class="flex-1 flex overflow-hidden">
      <Sidebar
        activeSection={currentSection}
        onSectionChange={(section) => (currentSection = section)}
      />
      <!-- Scrollable content area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col items-center p-4 gap-4">
            <AccessibilityPermissions />
            {#if currentSection === "general"}
              <GeneralSettings />
            {:else if currentSection === "models"}
              <ModelsSettings />
            {:else if currentSection === "advanced"}
              <AdvancedSettings />
            {:else if currentSection === "postprocessing"}
              <PostProcessingSettings />
            {:else if currentSection === "history"}
              <HistorySettings />
            {:else if currentSection === "debug"}
              <DebugSettings />
            {:else if currentSection === "about"}
              <AboutSettings />
            {:else}
              <GeneralSettings />
            {/if}
          </div>
        </div>
      </div>
    </div>
    <!-- Fixed footer at bottom -->
    <Footer />
  </div>
{/if}
