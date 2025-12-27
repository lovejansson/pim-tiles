<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import type { Script } from "../types";

  import ContextMenu from "./ui/ContextMenu.svelte";
  import EditableText from "./ui/EditableText.svelte";

  type ScriptItemProps = {
    script: Script;
  };
  let { script }: ScriptItemProps = $props();
  let isEditingName = $state(false);

  const handleSelectMenuItem = (item: any) => {
    if (item.value === "delete") {
      const workspaceTabIdx = guiState.workspaceTabs.findIndex(
        (wt) => wt.value === script.id,
      );

      if (workspaceTabIdx !== -1) {
        if (
          guiState.selectedWorkspaceTab ===
          script.id
        ) {
          guiState.selectedWorkspaceTab =
            guiState.workspaceTabs[workspaceTabIdx - 1].label;
        }
        guiState.workspaceTabs.splice(workspaceTabIdx, 1);
      }
      projectState.scripts.delete(script.id);
    } else if (item.value === "rename") {
      isEditingName = true;
    }
  };

  const openScript = () => {
    // If script is already opened, select it
    if (guiState.workspaceTabs.find((s) => s.value === script.id)) {
      guiState.selectedWorkspaceTab = script.name;
    } else {
      // Else open
      guiState.workspaceTabs.push({
        value: script.id,
        label: script.name,
      });
    }
  };

  $effect(() => {
    if (script.name) {
      for (const wt of guiState.workspaceTabs) {
        if (wt.value === script.id) {
          wt.label = script.name;
        }
      }
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div onclick={openScript}>
  <ContextMenu
    menuItems={[
      { label: "Delete", icon: "close", value: "delete" },
      { label: "Rename", icon: "edit-box", value: "rename" },
    ]}
    onSelect={handleSelectMenuItem}
  >
    <EditableText
      bind:isEditing={isEditingName}
      bind:text={script.name}
    /></ContextMenu
  >
</div>

<style lang="postcss">
  div {
    width: 100%;
  }
</style>
