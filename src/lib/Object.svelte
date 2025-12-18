<script lang="ts">
    import { SlInput, SlMenuItem, type SlChangeEvent } from "@shoelace-style/shoelace";
    import { guiState, projectState } from "../state.svelte";
    import ContextMenu from "./ui/ContextMenu.svelte";
    import ImageDialog from "./ImageDialog.svelte";
  import type { ImageLayerState } from "../types";

    const tilemapEditorState = $derived.by(
        (): ImageLayerState => {
        if (guiState.tilemapEditorState.type === "image") return guiState.tilemapEditorState;

        throw new Error("Invalid UI state");
        }
    );

    let { imgIdx}: {imgIdx: number} = $props();

    const object = $derived(tilemapEditorState.selectedLayer.data[imgIdx])

    let viewImageDialogIsOpen = $state(false);

    const handleSelectMenuItem = (item: SlMenuItem) => {
        if(item.value === "delete") {
           
            tilemapEditorState.selectedLayer.data = tilemapEditorState.selectedLayer.data.filter(i => !i.isSelected);
        } else if (item.value === "view") {
        viewImageDialogIsOpen = true;

        }
        
    }

    const selectImage = (e:MouseEvent) => {
      object.isSelected =   !object.isSelected;
      e.stopPropagation();
    }
  

</script>

<ContextMenu onSelect={handleSelectMenuItem} 
menuItems={[{label: "View", value:"view", icon: "edit-box"}, 
{label: "Delete", value:"delete", icon: "close"}]}>
     <!-- svelte-ignore a11y_no_static_element_interactions -->
     <sl-button 
     class:selected={object.isSelected} 
     onclick={selectImage} onkeydown={selectImage}>{projectState.images[object.id]?.filename}</sl-button>
</ContextMenu>

<ImageDialog imgIdx={object.id} bind:open={viewImageDialogIsOpen}/>

<style lang="postcss">

 .selected::part(base) {
   background-color: rgb(112, 253, 121);
 }

</style>

