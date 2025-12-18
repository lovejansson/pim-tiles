<script lang="ts">
    import { guiState, projectState } from "../state.svelte";

 
  import ContextMenu from "./ui/ContextMenu.svelte";
    import EditableText from "./ui/EditableText.svelte";

  let { scriptIdx} = $props();
  let isEditingName = $state(false);

  const handleSelectMenuItem = (item: any) => {
    if(item.value === "delete") {
        const workspaceTabIdx = guiState.workspaceTabs.findIndex(wt => wt.value === scriptIdx);

        if(workspaceTabIdx !== -1) {
          if(guiState.selectedWorkspaceTab === projectState.scripts[scriptIdx].name) {
            guiState.selectedWorkspaceTab = guiState.workspaceTabs[workspaceTabIdx - 1].label;
          }
            guiState.workspaceTabs.splice(workspaceTabIdx, 1);
        }
         projectState.scripts.splice(scriptIdx, 1);
    } else if (item.value === "rename") {
        isEditingName = true;
    }
  }

  const openScript = () => {
    // If script is already opened, select it
    if(guiState.workspaceTabs.find(s => s.value === scriptIdx)) {
        guiState.selectedWorkspaceTab = projectState.scripts[scriptIdx].name;
    } else {
      // Else open
        guiState.workspaceTabs.push({value: scriptIdx,label: projectState.scripts[scriptIdx].name })
    }
  };

  $effect(() => {
      if(projectState.scripts[scriptIdx].name) {
         for(const wt of guiState.workspaceTabs) {
            if(wt.value === scriptIdx) {
              wt.label = projectState.scripts[scriptIdx].name;
            }
         }
      }
  })


</script>

<div onclick={openScript}>
  <ContextMenu 
    menuItems={[{label: "Delete", icon: "close", value: "delete"}, {label: "Rename", icon: "edit-box", value: "rename"}]}
    onSelect={handleSelectMenuItem}
  >   
    <EditableText bind:isEditing={isEditingName} bind:text={projectState.scripts[scriptIdx].name}/></ContextMenu>
</div>


<style lang="postcss">
  div {
    width: 100%;
  }
</style>

