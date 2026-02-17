<script lang="ts" module>
  export type ModelCardStatus =
    | "downloadable"
    | "downloading"
    | "extracting"
    | "switching"
    | "active"
    | "available";
</script>

<script lang="ts">
  import { t } from "@/i18n";
  import {
    Check,
    Download,
    Globe,
    Languages,
    Loader2,
    Trash2,
  } from "lucide-svelte";
  import type { ModelInfo } from "@/bindings";
  import { formatModelSize } from "../../lib/utils/format";
  import {
    getTranslatedModelDescription,
    getTranslatedModelName,
  } from "../../lib/utils/modelTranslation";
  import { LANGUAGES } from "../../lib/constants/languages";
  import Badge from "../ui/Badge.svelte";
  import Button from "../ui/Button.svelte";

  const getLanguageDisplayText = (
    supportedLanguages: string[],
    tFn: (key: string, options?: Record<string, unknown>) => string
  ): string => {
    if (supportedLanguages.length === 1) {
      const langCode = supportedLanguages[0];
      const langName =
        LANGUAGES.find((l) => l.value === langCode)?.label || langCode;
      return tFn("modelSelector.capabilities.languageOnly", { language: langName });
    }
    return tFn("modelSelector.capabilities.multiLanguage");
  };

  let {
    model,
    variant = "default",
    status = "downloadable",
    disabled = false,
    class: className = "",
    onSelect,
    onDownload,
    onDelete,
    onCancel,
    downloadProgress,
    downloadSpeed,
    showRecommended = true,
  }: {
    model: ModelInfo;
    variant?: "default" | "featured";
    status?: ModelCardStatus;
    disabled?: boolean;
    class?: string;
    onSelect: (modelId: string) => void;
    onDownload?: (modelId: string) => void;
    onDelete?: (modelId: string) => void;
    onCancel?: (modelId: string) => void;
    downloadProgress?: number;
    downloadSpeed?: number;
    showRecommended?: boolean;
  } = $props();

  let isFeatured = $derived(variant === "featured");
  let isClickable = $derived(
    status === "available" || status === "active" || status === "downloadable"
  );

  let displayName = $derived(getTranslatedModelName(model, $t));
  let displayDescription = $derived(getTranslatedModelDescription(model, $t));

  const baseClasses =
    "flex flex-col rounded-xl px-4 py-3 gap-2 text-left transition-all duration-200";

  let variantClasses = $derived.by(() => {
    if (status === "active") return "border-2 border-logo-primary/50 bg-logo-primary/10";
    if (isFeatured) return "border-2 border-logo-primary/25 bg-logo-primary/5";
    return "border-2 border-mid-gray/20";
  });

  let interactiveClasses = $derived.by(() => {
    if (!isClickable) return "";
    if (disabled) return "opacity-50 cursor-not-allowed";
    return "cursor-pointer hover:border-logo-primary/50 hover:bg-logo-primary/5 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] group";
  });

  const handleClick = () => {
    if (!isClickable || disabled) return;
    if (status === "downloadable" && onDownload) {
      onDownload(model.id);
    } else {
      onSelect(model.id);
    }
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    onDelete?.(model.id);
  };
</script>

<div
  onclick={handleClick}
  onkeydown={(e: KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && isClickable) {
      e.preventDefault();
      handleClick();
    }
  }}
  role="button"
  aria-disabled={!isClickable || disabled}
  tabindex={isClickable && !disabled ? 0 : -1}
  class="{baseClasses} {variantClasses} {interactiveClasses} {className}"
>
  <!-- Top section: name/description + score bars -->
  <div class="flex justify-between items-center w-full">
    <div class="flex flex-col items-start flex-1 min-w-0">
      <div class="flex items-center gap-3 flex-wrap">
        <h3
          class="text-base font-semibold text-text {isClickable ? 'group-hover:text-logo-primary' : ''} transition-colors"
        >
          {displayName}
        </h3>
        {#if showRecommended && model.is_recommended}
          <Badge variant="primary">{$t("onboarding.recommended")}</Badge>
        {/if}
        {#if status === "active"}
          <Badge variant="primary">
            <Check class="w-3 h-3 mr-1" />
            {$t("modelSelector.active")}
          </Badge>
        {/if}
        {#if model.is_custom}
          <Badge variant="secondary">{$t("modelSelector.custom")}</Badge>
        {/if}
        {#if status === "switching"}
          <Badge variant="secondary">
            <Loader2 class="w-3 h-3 mr-1 animate-spin" />
            {$t("modelSelector.switching")}
          </Badge>
        {/if}
      </div>
      <p class="text-text/60 text-sm leading-relaxed">
        {displayDescription}
      </p>
    </div>
    {#if model.accuracy_score > 0 || model.speed_score > 0}
      <div class="hidden sm:flex items-center ml-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <p class="text-xs text-text/60 w-14 text-right">
              {$t("onboarding.modelCard.accuracy")}
            </p>
            <div class="w-16 h-1.5 bg-mid-gray/20 rounded-full overflow-hidden">
              <div
                class="h-full bg-logo-primary rounded-full"
                style="width: {model.accuracy_score * 100}%"
              ></div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <p class="text-xs text-text/60 w-14 text-right">
              {$t("onboarding.modelCard.speed")}
            </p>
            <div class="w-16 h-1.5 bg-mid-gray/20 rounded-full overflow-hidden">
              <div
                class="h-full bg-logo-primary rounded-full"
                style="width: {model.speed_score * 100}%"
              ></div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <hr class="w-full border-mid-gray/20" />

  <!-- Bottom row: tags + action buttons -->
  <div class="flex items-center gap-3 w-full -mb-0.5 mt-0.5 h-5">
    {#if model.supported_languages.length > 0}
      <div
        class="flex items-center gap-1 text-xs text-text/50"
        title={model.supported_languages.length === 1
          ? $t("modelSelector.capabilities.singleLanguage")
          : $t("modelSelector.capabilities.languageSelection")}
      >
        <Globe class="w-3.5 h-3.5" />
        <span>{getLanguageDisplayText(model.supported_languages, $t)}</span>
      </div>
    {/if}
    {#if model.supports_translation}
      <div
        class="flex items-center gap-1 text-xs text-text/50"
        title={$t("modelSelector.capabilities.translation")}
      >
        <Languages class="w-3.5 h-3.5" />
        <span>{$t("modelSelector.capabilities.translate")}</span>
      </div>
    {/if}
    {#if status === "downloadable"}
      <span class="flex items-center gap-1.5 ml-auto text-xs text-text/50">
        <Download class="w-3.5 h-3.5" />
        <span>{formatModelSize(Number(model.size_mb))}</span>
      </span>
    {/if}
    {#if onDelete && (status === "available" || status === "active")}
      <Button
        variant="ghost"
        size="sm"
        onclick={handleDelete}
        title={$t("modelSelector.deleteModel", { modelName: displayName })}
        class="flex items-center gap-1.5 ml-auto text-logo-primary/85 hover:text-logo-primary hover:bg-logo-primary/10"
      >
        <Trash2 class="w-3.5 h-3.5" />
        <span>{$t("common.delete")}</span>
      </Button>
    {/if}
  </div>

  <!-- Download/extract progress -->
  {#if status === "downloading" && downloadProgress !== undefined}
    <div class="w-full mt-3">
      <div class="w-full h-1.5 bg-mid-gray/20 rounded-full overflow-hidden">
        <div
          class="h-full bg-logo-primary rounded-full transition-all duration-300"
          style="width: {downloadProgress}%"
        ></div>
      </div>
      <div class="flex items-center justify-between text-xs mt-1">
        <span class="text-text/50">
          {$t("modelSelector.downloading", {
            percentage: Math.round(downloadProgress),
          })}
        </span>
        <div class="flex items-center gap-2">
          {#if downloadSpeed !== undefined && downloadSpeed > 0}
            <span class="tabular-nums text-text/50">
              {$t("modelSelector.downloadSpeed", {
                speed: downloadSpeed.toFixed(1),
              })}
            </span>
          {/if}
          {#if onCancel}
            <Button
              variant="danger-ghost"
              size="sm"
              onclick={(e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel(model.id);
              }}
              aria-label={$t("modelSelector.cancelDownload")}
            >
              {$t("modelSelector.cancel")}
            </Button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  {#if status === "extracting"}
    <div class="w-full mt-3">
      <div class="w-full h-1.5 bg-mid-gray/20 rounded-full overflow-hidden">
        <div class="h-full bg-logo-primary rounded-full animate-pulse w-full"></div>
      </div>
      <p class="text-xs text-text/50 mt-1">
        {$t("modelSelector.extractingGeneric")}
      </p>
    </div>
  {/if}
</div>
