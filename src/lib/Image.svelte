<script lang="ts">
    import { SlMenuItem, } from "@shoelace-style/shoelace";
    import { guiState, projectState } from "../state.svelte";
    import ContextMenu from "./ContextMenu.svelte";
    import ImageDialog from "./ImageDialog.svelte";
  import type { ImageLayerState } from "../types";

     const tilemapEditorState = $derived.by(
        (): ImageLayerState => {
        if (guiState.tilemapEditorState.type === "image") return guiState.tilemapEditorState;

        throw new Error("Invalid UI state");
        }
    );
    
    let { imgIdx} = $props();

    let viewImageDialogIsOpen = $state(false);

    const handleSelectMenuItem = (item: SlMenuItem) => {
        if(item.value === "delete") {
            projectState.images.splice(imgIdx, 1);
        } else if (item.value === "view") {
        viewImageDialogIsOpen = true;

        }
        
    }

    const selectImage = () => {
        tilemapEditorState.selectedAsset = { ref: {id: imgIdx}}
    }

</script>

<ContextMenu onSelect={handleSelectMenuItem} 
menuItems={[{label: "View", value:"view", icon: "edit-box"}, 
{label: "Delete", value:"delete", icon: "close"}]}>
     <!-- svelte-ignore a11y_no_static_element_interactions -->
     <sl-button 
     class:selected={guiState.tilemapEditorState.type === "image"  
     && guiState.tilemapEditorState.selectedAsset !== null 
     && guiState.tilemapEditorState.selectedAsset.ref.id == imgIdx} 
     onclick={selectImage} onkeydown={selectImage}>{projectState.images[imgIdx].filename}</sl-button>
</ContextMenu>

<ImageDialog imgIdx={imgIdx} bind:open={viewImageDialogIsOpen}/>

<style lang="postcss">

 .selected::part(base) {
   background-color: rgb(112, 253, 121);
 }

</style>

