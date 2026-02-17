<script lang="ts">
  import { getVersion } from "@tauri-apps/api/app";
  import ModelSelector from "../model-selector/ModelSelector.svelte";
  import UpdateChecker from "../update-checker/UpdateChecker.svelte";

  let version = $state("");

  $effect(() => {
    const fetchVersion = async () => {
      try {
        const appVersion = await getVersion();
        version = appVersion;
      } catch (error) {
        console.error("Failed to get app version:", error);
        version = "0.1.2";
      }
    };
    fetchVersion();
  });
</script>

<div class="w-full border-t border-mid-gray/20 pt-3">
  <div class="flex justify-between items-center text-xs px-4 pb-3 text-text/60">
    <div class="flex items-center gap-4">
      <ModelSelector />
    </div>

    <!-- Update Status -->
    <div class="flex items-center gap-1">
      <UpdateChecker />
      <span>&bull;</span>
      <span>v{version}</span>
    </div>
  </div>
</div>
