<script lang="ts">
    import { SlInput, SlMenuItem, type SlChangeEvent } from "@shoelace-style/shoelace";
    import { guiState, projectState } from "../state.svelte";
    import ContextMenu from "./ContextMenu.svelte";
    import ImageDialog from "./ImageDialog.svelte";


    const selectedLayer = $derived.by(() => {

        const layer = projectState.layers.find(l => l.id === guiState.selectedLayer);

        if(layer === undefined) throw new Error("Internal error: selected layer missing");

        if(layer.type !== "image") throw new Error("Internal error: selected layer missing");
            return layer;

        
        }
    );

    let { imgIdx} = $props();

    const object = $derived(selectedLayer.data[imgIdx])



    let viewImageDialogIsOpen = $state(false);

    const handleSelectMenuItem = (item: SlMenuItem) => {
        if(item.value === "delete") {
           
            selectedLayer.data = selectedLayer.data.filter(i => !i.isSelected);
        } else if (item.value === "view") {
        viewImageDialogIsOpen = true;

        }
        
    }

    const selectImage = () => {
      object.isSelected =   !object.isSelected
 
        
    }
  

</script>

<ContextMenu onSelect={handleSelectMenuItem} 
menuItems={[{label: "View", value:"view", icon: "edit-box"}, 
{label: "Delete", value:"delete", icon: "close"}]}>
     <!-- svelte-ignore a11y_no_static_element_interactions -->
     <sl-button 
     class:selected={object.isSelected} 
     onclick={selectImage} onkeydown={selectImage}>{projectState.images[object.index]?.filename}</sl-button>
</ContextMenu>

<ImageDialog imgIdx={object.index} bind:open={viewImageDialogIsOpen}/>

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

