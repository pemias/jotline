<script lang="ts">
  import { t } from "@/i18n";
  import Dropdown from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";
  import { settings, updateSetting, isUpdatingKey } from "@/stores/settingsStore";
  import { getOsType } from "@/lib/utils/osType";
  import { commands } from "@/bindings";
  import type { TypingTool } from "@/bindings";

  let {
    descriptionMode = "tooltip",
    grouped = false,
  }: {
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  } = $props();

  const allToolLabels: Record<string, string> = {
    wtype: "wtype",
    kwtype: "kwtype",
    dotool: "dotool",
    ydotool: "ydotool",
    xdotool: "xdotool",
  };

  const osType = getOsType();
  let availableTools = $state<string[] | null>(null);

  $effect(() => {
    if (osType !== "linux") return;
    commands
      .getAvailableTypingTools()
      .then((tools) => { availableTools = tools; })
      .catch(() => { availableTools = ["auto"]; });
  });

  let tools = $derived(availableTools ?? ["auto"]);

  let typingToolOptions = $derived(
    tools.map((tool) =>
      tool === "auto"
        ? { value: "auto", label: $t("settings.advanced.typingTool.options.auto") }
        : { value: tool, label: allToolLabels[tool] ?? tool }
    )
  );

  let selectedTool = $derived(
    ($settings?.typing_tool || "auto") as TypingTool
  );

  let pasteMethod = $derived($settings?.paste_method);
</script>

{#if osType === "linux" && pasteMethod === "direct"}
  <SettingContainer
    title={$t("settings.advanced.typingTool.title")}
    description={$t("settings.advanced.typingTool.description")}
    {descriptionMode}
    {grouped}
    tooltipPosition="bottom"
  >
    <Dropdown
      options={typingToolOptions}
      selectedValue={selectedTool}
      onSelect={(value) => updateSetting("typing_tool", value as TypingTool)}
      disabled={isUpdatingKey("typing_tool")}
    />
  </SettingContainer>
{/if}
