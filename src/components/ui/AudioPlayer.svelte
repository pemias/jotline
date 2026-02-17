<script lang="ts">
  import { Play, Pause } from "lucide-svelte";

  let {
    src: initialSrc,
    onLoadRequest,
    class: className = "",
    autoPlay = false,
  }: {
    src?: string;
    onLoadRequest?: () => Promise<string | null>;
    class?: string;
    autoPlay?: boolean;
  } = $props();

  let isPlaying = $state(false);
  let duration = $state(0);
  let currentTime = $state(0);
  let isDragging = $state(false);
  let loadedSrc = $state<string | null>(null);
  let isLoading = $state(false);

  let audioEl: HTMLAudioElement | undefined = $state();
  let src = $derived(loadedSrc);
  let animationRef: number | undefined;
  let dragTimeRef = 0;

  // Refs to avoid stale closures
  let isPlayingRef = false;
  let isDraggingRef = false;

  $effect(() => {
    isPlayingRef = isPlaying;
  });

  $effect(() => {
    isDraggingRef = isDragging;
  });

  $effect(() => {
    loadedSrc = initialSrc ?? null;
  });

  function tick() {
    if (audioEl && !isDraggingRef) {
      currentTime = audioEl.currentTime;
    }
    if (isPlayingRef) {
      animationRef = requestAnimationFrame(tick);
    }
  }

  // Manage animation loop
  $effect(() => {
    if (isPlaying && !isDragging) {
      if (!animationRef) {
        animationRef = requestAnimationFrame(tick);
      }
    } else {
      if (animationRef) {
        cancelAnimationFrame(animationRef);
        animationRef = undefined;
      }
    }

    return () => {
      if (animationRef) {
        cancelAnimationFrame(animationRef);
        animationRef = undefined;
      }
    };
  });

  // Audio event handlers
  $effect(() => {
    const audio = audioEl;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      duration = audio.duration || 0;
      currentTime = 0;
    };

    const handleEnded = () => {
      isPlaying = false;
      currentTime = audio.duration || 0;
    };

    const handlePlay = () => isPlaying = true;
    const handlePause = () => isPlaying = false;

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  });

  // Auto-play when src becomes available
  let prevLoadedSrc: string | null = null;
  $effect(() => {
    const audio = audioEl;
    if (!audio) return;

    if (loadedSrc && !prevLoadedSrc && onLoadRequest) {
      audio.play().catch((error) => {
        console.error("Auto-play failed:", error);
      });
    } else if (autoPlay && initialSrc && !prevLoadedSrc) {
      audio.play().catch((error) => {
        console.error("Auto-play failed:", error);
      });
    }

    prevLoadedSrc = loadedSrc;
  });

  // Global drag handlers
  $effect(() => {
    if (!isDragging) return;

    const handleMouseUp = () => {
      isDragging = false;
      if (audioEl) {
        audioEl.currentTime = dragTimeRef;
        currentTime = dragTimeRef;
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  });

  // Cleanup blob URLs on unmount
  $effect(() => {
    return () => {
      if (loadedSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(loadedSrc);
      }
    };
  });

  async function togglePlay() {
    const audio = audioEl;
    if (!audio) return;
    if (isLoading) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        if (!src && onLoadRequest) {
          isLoading = true;
          const newSrc = await onLoadRequest();
          isLoading = false;
          if (newSrc) {
            loadedSrc = newSrc;
          }
        } else if (src) {
          await audio.play();
        }
      }
    } catch (error) {
      console.error("Playback failed:", error);
    }
  }

  function handleSeek(e: Event) {
    const newTime = parseFloat((e.target as HTMLInputElement).value);
    dragTimeRef = newTime;
    currentTime = newTime;

    if (!isDragging && audioEl) {
      audioEl.currentTime = newTime;
    }
  }

  function handleSliderMouseDown() {
    isDragging = true;
  }

  function handleSliderTouchStart() {
    isDragging = true;
  }

  function formatTime(time: number): string {
    if (!isFinite(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  let progressPercent = $derived.by(() => {
    if (duration <= 0) return 0;
    if (duration - currentTime < 0.1) return 100;
    const percent = (currentTime / duration) * 100;
    return Math.min(100, Math.max(0, percent));
  });
</script>

<div class="flex items-center gap-3 {className}">
  <audio bind:this={audioEl} src={src ?? undefined} preload="metadata"></audio>

  <button
    onclick={togglePlay}
    disabled={isLoading}
    class="transition-colors cursor-pointer text-text hover:text-logo-primary disabled:opacity-50"
    aria-label={isPlaying ? "Pause" : "Play"}
  >
    {#if isPlaying}
      <Pause width={20} height={20} fill="currentColor" />
    {:else}
      <Play width={20} height={20} fill="currentColor" />
    {/if}
  </button>

  <div class="flex-1 flex items-center gap-2">
    <span class="text-xs text-text/60 min-w-[30px] tabular-nums">
      {formatTime(currentTime)}
    </span>

    <input
      type="range"
      min="0"
      max={duration || 0}
      step="0.01"
      value={currentTime}
      oninput={handleSeek}
      onmousedown={handleSliderMouseDown}
      ontouchstart={handleSliderTouchStart}
      class="flex-1 h-1 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-logo-primary {progressPercent >= 99.5 ? '[&::-webkit-slider-thumb]:translate-x-0.5 [&::-moz-range-thumb]:translate-x-0.5' : ''}"
      style:background="linear-gradient(to right, #FAA2CA 0%, #FAA2CA {progressPercent}%, rgba(128, 128, 128, 0.2) {progressPercent}%, rgba(128, 128, 128, 0.2) 100%)"
    />

    <span class="text-xs text-text/60 min-w-[30px] tabular-nums">
      {formatTime(duration)}
    </span>
  </div>
</div>
