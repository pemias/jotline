<script lang="ts">
  import { t } from "@/i18n";
  import { settings, updateSetting, customSounds, playTestSound } from "@/stores/settingsStore";
  import Button from "../ui/Button.svelte";
  import Dropdown from "../ui/Dropdown.svelte";
  import type { DropdownOption } from "../ui/Dropdown.svelte";
  import SettingContainer from "../ui/SettingContainer.svelte";

  let { label, description }: {
    label: string;
    description: string;
  } = $props();

  let selectedTheme = $derived($settings?.sound_theme ?? "marimba");

  let options: DropdownOption[] = $derived.by(() => {
    const base: DropdownOption[] = [
      { value: "marimba", label: "Marimba" },
      { value: "pop", label: "Pop" },
    ];
    if ($customSounds.start && $customSounds.stop) {
      base.push({ value: "custom", label: "Custom" });
    }
    return base;
  });

  async function handlePlayBothSounds() {
    await playTestSound("start");
    await playTestSound("stop");
  }
</script>

<SettingContainer
  title={label}
  {description}
  grouped
  layout="horizontal"
>
  <div class="flex items-center gap-2">
    <Dropdown
      selectedValue={selectedTheme}
      onSelect={(value) => updateSetting("sound_theme", value as "marimba" | "pop" | "custom")}
      {options}
    />
    <Button
      variant="ghost"
      size="sm"
      onclick={handlePlayBothSounds}
      title={$t("settings.debug.soundTheme.preview")}
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    </Button>
  </div>
</SettingContainer>
