<script lang="ts">
    import { SlInput, SlMenuItem, type SlChangeEvent } from "@shoelace-style/shoelace";
    import { guiState, projectState } from "../state.svelte";
    import ContextMenu from "./ContextMenu.svelte";
    import ImageDialog from "./ImageDialog.svelte";

    let { imgIdx} = $props();

    let viewImageDialogIsOpen = $state(false);

    const handleSelectMenuItem = (item: SlMenuItem) => {
        if(item.value === "delete") {
            projectState.images.splice(imgIdx, 1);
        } else if (item.value === "view") {
        viewImageDialogIsOpen = true;

        }
        
    }

</script>

<ContextMenu onSelect={handleSelectMenuItem} 
menuItems={[{label: "View", value:"view", icon: "edit-box"}, {label: "Delete", value:"delete", icon: "close"}]}>
     <!-- svelte-ignore a11y_no_static_element_interactions -->
     <sl-button class:selected={guiState.selectedImageIdx === imgIdx} onclick={() => guiState.selectedImageIdx = imgIdx} onkeydown={() => guiState.selectedImageIdx = imgIdx}>{projectState.images[imgIdx].filename}</sl-button>
</ContextMenu>

<ImageDialog imgIdx={imgIdx} bind:open={viewImageDialogIsOpen}/>

<style lang="postcss">
 #layer {
    display: flex;  
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;

 }
 p{
       margin: 0;
    margin-right: auto;
 
 }

 .selected::part(base) {
   background-color: rgb(112, 253, 121);
 }

</style>

