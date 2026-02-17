<script lang="ts">
  import { t } from "@/i18n";
  import Button from "./Button.svelte";

  let {
    path,
    onOpen,
    disabled = false,
  }: {
    path: string;
    onOpen: () => void;
    disabled?: boolean;
  } = $props();
</script>

<div class="flex items-center gap-2">
  <div class="flex-1 min-w-0 px-2 py-2 bg-mid-gray/10 border border-mid-gray/80 rounded-lg text-xs font-mono break-all select-text cursor-text">
    {path}
  </div>
  <Button
    onclick={onOpen}
    variant="secondary"
    size="sm"
    {disabled}
    class="px-3 py-2"
  >
    {$t("common.open")}
  </Button>
</div>
