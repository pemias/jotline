<script lang="ts">
  import { listen } from "@tauri-apps/api/event";
  import { onMount } from "svelte";
  import { t, locale, syncLanguageFromSettings } from "@/i18n";
  import { getLanguageDirection } from "@/lib/utils/rtl";
  import MicrophoneIcon from "../components/icons/MicrophoneIcon.svelte";
  import TranscriptionIcon from "../components/icons/TranscriptionIcon.svelte";
  import CancelIcon from "../components/icons/CancelIcon.svelte";
  import { commands } from "@/bindings";
  import "./RecordingOverlay.css";

  type OverlayState = "recording" | "transcribing" | "processing";

  let isVisible = $state(false);
  let overlayState = $state<OverlayState>("recording");
  let levels = $state<number[]>(Array(16).fill(0));
  let smoothedLevelsRef = Array(16).fill(0);
  let direction = $derived(getLanguageDirection($locale));

  onMount(() => {
    const unlistenFns: Array<() => void> = [];

    async function setup() {
      const unlistenShow = await listen("show-overlay", async (event) => {
        await syncLanguageFromSettings();
        const payload = event.payload as OverlayState;
        overlayState = payload;
        isVisible = true;
      });
      unlistenFns.push(unlistenShow);

      const unlistenHide = await listen("hide-overlay", () => {
        isVisible = false;
      });
      unlistenFns.push(unlistenHide);

      const unlistenLevel = await listen<number[]>("mic-level", (event) => {
        const newLevels = event.payload as number[];
        const smoothed = smoothedLevelsRef.map((prev, i) => {
          const target = newLevels[i] || 0;
          return prev * 0.7 + target * 0.3;
        });
        smoothedLevelsRef = smoothed;
        levels = smoothed.slice(0, 9);
      });
      unlistenFns.push(unlistenLevel);
    }

    setup();

    return () => {
      for (const unlisten of unlistenFns) {
        unlisten();
      }
    };
  });
</script>

<div
  dir={direction}
  class="recording-overlay {isVisible ? 'fade-in' : ''}"
>
  <div class="overlay-left">
    {#if overlayState === "recording"}
      <MicrophoneIcon />
    {:else}
      <TranscriptionIcon />
    {/if}
  </div>

  <div class="overlay-middle">
    {#if overlayState === "recording"}
      <div class="bars-container">
        {#each levels as v, i (i)}
          <div
            class="bar"
            style:height="{Math.min(20, 4 + Math.pow(v, 0.7) * 16)}px"
            style:transition="height 60ms ease-out, opacity 120ms ease-out"
            style:opacity={Math.max(0.2, v * 1.7)}
          ></div>
        {/each}
      </div>
    {/if}
    {#if overlayState === "transcribing"}
      <div class="transcribing-text">{$t("overlay.transcribing")}</div>
    {/if}
    {#if overlayState === "processing"}
      <div class="transcribing-text">{$t("overlay.processing")}</div>
    {/if}
  </div>

  <div class="overlay-right">
    {#if overlayState === "recording"}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="cancel-button"
        role="button"
        tabindex="0"
        onclick={() => { commands.cancelOperation(); }}
      >
        <CancelIcon />
      </div>
    {/if}
  </div>
</div>
