<script lang="ts">
  import { t } from "@/i18n";
  import { type as osType } from "@tauri-apps/plugin-os";
  import {
    checkAccessibilityPermission,
    requestAccessibilityPermission,
  } from "tauri-plugin-macos-permissions-api";

  type PermissionState = "request" | "verify" | "granted";

  const isMacOS = osType() === "macos";

  let hasAccessibility = $state(false);
  let permissionState = $state<PermissionState>("request");

  const checkPermissions = async (): Promise<boolean> => {
    const hasPermissions = await checkAccessibilityPermission();
    hasAccessibility = hasPermissions;
    permissionState = hasPermissions ? "granted" : "verify";
    return hasPermissions;
  };

  const handleButtonClick = async (): Promise<void> => {
    if (permissionState === "request") {
      try {
        await requestAccessibilityPermission();
        permissionState = "verify";
      } catch (error) {
        console.error("Error requesting permissions:", error);
        permissionState = "verify";
      }
    } else if (permissionState === "verify") {
      await checkPermissions();
    }
  };

  $effect(() => {
    if (!isMacOS) return;

    const initialSetup = async (): Promise<void> => {
      const hasPermissions = await checkAccessibilityPermission();
      hasAccessibility = hasPermissions;
      permissionState = hasPermissions ? "granted" : "request";
    };

    initialSetup();
  });

  interface ButtonConfig {
    text: string;
    className: string;
  }

  let buttonConfig = $derived.by<ButtonConfig | null>(() => {
    if (permissionState === "granted") return null;
    if (permissionState === "request") {
      return {
        text: $t("accessibility.openSettings"),
        className:
          "px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 hover:bg-logo-primary/10 rounded cursor-pointer hover:border-logo-primary",
      };
    }
    return {
      text: $t("accessibility.openSettings"),
      className:
        "bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-3 rounded-md text-sm flex items-center justify-center cursor-pointer",
    };
  });
</script>

{#if isMacOS && !hasAccessibility}
  {@const config = buttonConfig}
  {#if config}
    <div class="p-4 w-full rounded-lg border border-mid-gray">
      <div class="flex justify-between items-center gap-2">
        <div>
          <p class="text-sm font-medium">
            {$t("accessibility.permissionsDescription")}
          </p>
        </div>
        <button
          onclick={handleButtonClick}
          class="min-h-10 {config.className}"
        >
          {config.text}
        </button>
      </div>
    </div>
  {/if}
{/if}
