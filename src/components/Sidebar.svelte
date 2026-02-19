<script lang="ts" module>
  export type SidebarSection =
    | "general"
    | "models"
    | "advanced"
    | "postprocessing"
    | "history"
    | "debug"
    | "about";
</script>

<script lang="ts">
  import { t } from "@/i18n";
  import { settings } from "@/stores/settingsStore";
  import { FlaskConical, History, Info, Settings, SlidersHorizontal, Sparkles, Cpu, type Icon } from "lucide-svelte";

  let {
    activeSection,
    onSectionChange,
  }: {
    activeSection: SidebarSection;
    onSectionChange: (section: SidebarSection) => void;
  } = $props();

  interface SectionDef {
    id: SidebarSection;
    labelKey: string;
    icon: typeof Icon;
    enabled: (s: typeof $settings) => boolean;
  }

  const sections: SectionDef[] = [
    { id: "general", labelKey: "sidebar.general", icon: Settings, enabled: () => true },
    { id: "models", labelKey: "sidebar.models", icon: Cpu, enabled: () => true },
    { id: "advanced", labelKey: "sidebar.advanced", icon: SlidersHorizontal, enabled: () => true },
    {
      id: "postprocessing",
      labelKey: "sidebar.postProcessing",
      icon: Sparkles,
      enabled: (s) => s?.post_process_enabled ?? false,
    },
    { id: "history", labelKey: "sidebar.history", icon: History, enabled: () => true },
    {
      id: "debug",
      labelKey: "sidebar.debug",
      icon: FlaskConical,
      enabled: (s) => s?.debug_mode ?? false,
    },
    { id: "about", labelKey: "sidebar.about", icon: Info, enabled: () => true },
  ];

  let availableSections = $derived(
    sections.filter((section) => section.enabled($settings))
  );
</script>

<div class="flex flex-col w-40 h-full border-e border-mid-gray/20 items-center px-2">
  <div class="flex flex-col w-full items-center gap-1 pt-4">
    {#each availableSections as section (section.id)}
      {@const Icon = section.icon}
      {@const isActive = activeSection === section.id}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="flex gap-2 items-center p-2 w-full rounded-lg cursor-pointer transition-colors {isActive
          ? 'bg-logo-primary/80'
          : 'hover:bg-mid-gray/20 hover:opacity-100 opacity-85'}"
        onclick={() => onSectionChange(section.id)}
        onkeydown={(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSectionChange(section.id);
          }
        }}
        role="button"
        tabindex={0}
      >
        <Icon width={24} height={24} class="shrink-0" />
        <p
          class="text-sm font-medium truncate"
          title={$t(section.labelKey)}
        >
          {$t(section.labelKey)}
        </p>
      </div>
    {/each}
  </div>
</div>
