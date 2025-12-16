<script lang="ts">
  import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
  import { projectState } from "../state.svelte";
    
    import ContextMenu from "./ContextMenu.svelte";
    import EditableText from "./EditableText.svelte";

let { layerIdx} = $props();

let isEditingName = $state(false);

const handleSelectMenuItem = (item: any) => {
    if(item.value === "delete") {
        projectState.layers.splice(layerIdx, 1);
    } else if (item.value === "rename") {
        isEditingName = true;
    }
}

let inputName: SlInput;

</script>
<ContextMenu onSelect={handleSelectMenuItem} 
    menuItems={[{label: "Rename", value:"rename", icon: "edit-box"}, {label: "Delete", value:"delete", icon: "close"}]}>
    <div id="layer">
        {#if projectState.layers[layerIdx].type === "tile"} 
        <sl-icon library="pixelarticons" name="chess"></sl-icon>
        {:else if projectState.layers[layerIdx].type === "image"}
        <sl-icon library="pixelarticons" name="image"></sl-icon>
        {:else} 
        <sl-icon library="pixelarticons" name="image"></sl-icon>
        {/if}

        <EditableText bind:isEditing={isEditingName} text={projectState.layers[layerIdx].name}/>

        <sl-icon-button onclick={() => projectState.layers[layerIdx].isVisible = !projectState.layers[layerIdx].isVisible} 
            library="pixelarticons" name={projectState.layers[layerIdx].isVisible ? "eye" : "eye-closed"} >
        </sl-icon-button>
    </div>
</ContextMenu>

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

</style>

