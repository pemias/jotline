<script lang="ts">
  import { t } from "@/i18n";
  import SettingContainer from "../../ui/SettingContainer.svelte";

  let {
    descriptionMode = "inline",
    grouped = false,
  }: {
    descriptionMode?: "tooltip" | "inline";
    grouped?: boolean;
  } = $props();
</script>

<SettingContainer
  title={$t("settings.debug.paths.title")}
  description={$t("settings.debug.paths.description")}
  {descriptionMode}
  {grouped}
>
  <div class="text-sm text-gray-600 space-y-2">
    <div>
      <span class="font-medium">
        {$t("settings.debug.paths.appData")}
      </span>
      {" "}
      <span class="font-mono text-xs select-text">{$t("settings.debug.paths.appDataPath")}</span>
    </div>
    <div>
      <span class="font-medium">
        {$t("settings.debug.paths.models")}
      </span>
      {" "}
      <span class="font-mono text-xs select-text">
        {$t("settings.debug.paths.modelsPath")}
      </span>
    </div>
    <div>
      <span class="font-medium">
        {$t("settings.debug.paths.settings")}
      </span>
      {" "}
      <span class="font-mono text-xs select-text">
        {$t("settings.debug.paths.settingsPath")}
      </span>
    </div>
  </div>
</SettingContainer>
