<script lang="ts">
  import { t } from "@/i18n";
  import { commands } from "@/bindings";
  import SettingContainer from "../../ui/SettingContainer.svelte";
  import Dropdown from "../../ui/Dropdown.svelte";
  import Button from "../../ui/Button.svelte";
  import Input from "../../ui/Input.svelte";
  import Textarea from "../../ui/Textarea.svelte";
  import {
    settings,
    updateSetting,
    isUpdatingKey,
    refreshSettings,
  } from "@/stores/settingsStore";

  let isCreating = $state(false);
  let draftName = $state("");
  let draftText = $state("");

  let prompts = $derived($settings?.post_process_prompts || []);
  let selectedPromptId = $derived($settings?.post_process_selected_prompt_id || "");
  let selectedPrompt = $derived(
    prompts.find((prompt) => prompt.id === selectedPromptId) || null
  );

  $effect(() => {
    if (isCreating) return;

    if (selectedPrompt) {
      draftName = selectedPrompt.name;
      draftText = selectedPrompt.prompt;
    } else {
      draftName = "";
      draftText = "";
    }
  });

  function handlePromptSelect(promptId: string | null) {
    if (!promptId) return;
    updateSetting("post_process_selected_prompt_id", promptId);
    isCreating = false;
  }

  async function handleCreatePrompt() {
    if (!draftName.trim() || !draftText.trim()) return;

    try {
      const result = await commands.addPostProcessPrompt(
        draftName.trim(),
        draftText.trim(),
      );
      if (result.status === "ok") {
        await refreshSettings();
        updateSetting("post_process_selected_prompt_id", result.data.id);
        isCreating = false;
      }
    } catch (error) {
      console.error("Failed to create prompt:", error);
    }
  }

  async function handleUpdatePrompt() {
    if (!selectedPromptId || !draftName.trim() || !draftText.trim()) return;

    try {
      await commands.updatePostProcessPrompt(
        selectedPromptId,
        draftName.trim(),
        draftText.trim(),
      );
      await refreshSettings();
    } catch (error) {
      console.error("Failed to update prompt:", error);
    }
  }

  async function handleDeletePrompt(promptId: string) {
    if (!promptId) return;

    try {
      await commands.deletePostProcessPrompt(promptId);
      await refreshSettings();
      isCreating = false;
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    }
  }

  function handleCancelCreate() {
    isCreating = false;
    if (selectedPrompt) {
      draftName = selectedPrompt.name;
      draftText = selectedPrompt.prompt;
    } else {
      draftName = "";
      draftText = "";
    }
  }

  function handleStartCreate() {
    isCreating = true;
    draftName = "";
    draftText = "";
  }

  let hasPrompts = $derived(prompts.length > 0);
  let isDirty = $derived(
    !!selectedPrompt &&
    (draftName.trim() !== selectedPrompt.name ||
      draftText.trim() !== selectedPrompt.prompt.trim())
  );

  const editNameInputId = "post-process-edit-prompt-name";
  const editTextInputId = "post-process-edit-prompt-text";
  const createNameInputId = "post-process-create-prompt-name";
  const createTextInputId = "post-process-create-prompt-text";
</script>

<SettingContainer
  title={$t("settings.postProcessing.prompts.selectedPrompt.title")}
  description={$t("settings.postProcessing.prompts.selectedPrompt.description")}
  descriptionMode="tooltip"
  layout="stacked"
  grouped={true}
>
  <div class="space-y-3">
    <div class="flex gap-2">
      <Dropdown
        selectedValue={selectedPromptId || null}
        options={prompts.map((p) => ({
          value: p.id,
          label: p.name,
        }))}
        onSelect={(value) => handlePromptSelect(value)}
        placeholder={prompts.length === 0
          ? $t("settings.postProcessing.prompts.noPrompts")
          : $t("settings.postProcessing.prompts.selectPrompt")}
        disabled={isUpdatingKey("post_process_selected_prompt_id") || isCreating}
        class="flex-1"
      />
      <Button
        onclick={handleStartCreate}
        variant="primary"
        size="md"
        disabled={isCreating}
      >
        {$t("settings.postProcessing.prompts.createNew")}
      </Button>
    </div>

    {#if !isCreating && hasPrompts && selectedPrompt}
      <div class="space-y-3">
        <div class="space-y-2 flex flex-col">
          <label for={editNameInputId} class="text-sm font-semibold">
            {$t("settings.postProcessing.prompts.promptLabel")}
          </label>
          <Input
            id={editNameInputId}
            type="text"
            value={draftName}
            oninput={(e: Event) => { draftName = (e.target as HTMLInputElement).value; }}
            placeholder={$t("settings.postProcessing.prompts.promptLabelPlaceholder")}
            variant="compact"
          />
        </div>

        <div class="space-y-2 flex flex-col">
          <label for={editTextInputId} class="text-sm font-semibold">
            {$t("settings.postProcessing.prompts.promptInstructions")}
          </label>
          <Textarea
            id={editTextInputId}
            value={draftText}
            oninput={(e: Event) => { draftText = (e.target as HTMLTextAreaElement).value; }}
            placeholder={$t("settings.postProcessing.prompts.promptInstructionsPlaceholder")}
          />
          <p class="text-xs text-mid-gray/70">
            {@html $t("settings.postProcessing.prompts.promptTip")}
          </p>
        </div>

        <div class="flex gap-2 pt-2">
          <Button
            onclick={handleUpdatePrompt}
            variant="primary"
            size="md"
            disabled={!draftName.trim() || !draftText.trim() || !isDirty}
          >
            {$t("settings.postProcessing.prompts.updatePrompt")}
          </Button>
          <Button
            onclick={() => handleDeletePrompt(selectedPromptId)}
            variant="secondary"
            size="md"
            disabled={!selectedPromptId || prompts.length <= 1}
          >
            {$t("settings.postProcessing.prompts.deletePrompt")}
          </Button>
        </div>
      </div>
    {/if}

    {#if !isCreating && !selectedPrompt}
      <div class="p-3 bg-mid-gray/5 rounded-md border border-mid-gray/20">
        <p class="text-sm text-mid-gray">
          {hasPrompts
            ? $t("settings.postProcessing.prompts.selectToEdit")
            : $t("settings.postProcessing.prompts.createFirst")}
        </p>
      </div>
    {/if}

    {#if isCreating}
      <div class="space-y-3">
        <div class="space-y-2 flex flex-col">
          <label for={createNameInputId} class="text-sm font-semibold text-text">
            {$t("settings.postProcessing.prompts.promptLabel")}
          </label>
          <Input
            id={createNameInputId}
            type="text"
            value={draftName}
            oninput={(e: Event) => { draftName = (e.target as HTMLInputElement).value; }}
            placeholder={$t("settings.postProcessing.prompts.promptLabelPlaceholder")}
            variant="compact"
          />
        </div>

        <div class="space-y-2 flex flex-col">
          <label for={createTextInputId} class="text-sm font-semibold">
            {$t("settings.postProcessing.prompts.promptInstructions")}
          </label>
          <Textarea
            id={createTextInputId}
            value={draftText}
            oninput={(e: Event) => { draftText = (e.target as HTMLTextAreaElement).value; }}
            placeholder={$t("settings.postProcessing.prompts.promptInstructionsPlaceholder")}
          />
          <p class="text-xs text-mid-gray/70">
            {@html $t("settings.postProcessing.prompts.promptTip")}
          </p>
        </div>

        <div class="flex gap-2 pt-2">
          <Button
            onclick={handleCreatePrompt}
            variant="primary"
            size="md"
            disabled={!draftName.trim() || !draftText.trim()}
          >
            {$t("settings.postProcessing.prompts.createPrompt")}
          </Button>
          <Button
            onclick={handleCancelCreate}
            variant="secondary"
            size="md"
          >
            {$t("settings.postProcessing.prompts.cancel")}
          </Button>
        </div>
      </div>
    {/if}
  </div>
</SettingContainer>
