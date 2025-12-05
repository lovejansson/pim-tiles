<script lang="ts">
  import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
  import { appState } from "../state.svelte";

  
import ContextMenu from "./ContextMenu.svelte";

let { layerIdx} = $props();

let isEditingName = $state(false);

const handleSelectMenuItem = (item: any) => {
    if(item.value === "delete") {
        appState.layers.splice(layerIdx, 1);
    } else if (item.value === "rename") {
        isEditingName = true;
        requestAnimationFrame(() => {
			if(inputName !== null) inputName.focus();
		});

    }
    
}

let inputName: SlInput;

</script>
<ContextMenu onSelect={handleSelectMenuItem} 
    menuItems={[{label: "Rename", value:"rename", icon: "edit-box"}, {label: "Delete", value:"delete", icon: "close"}]}>
    <div id="layer">
        {#if appState.layers[layerIdx].type === "tile"} 
        <sl-icon library="pixelarticons" name="chess"></sl-icon>
        {:else if appState.layers[layerIdx].type === "image"}
        <sl-icon library="pixelarticons" name="image"></sl-icon>
        {:else} 
        <sl-icon library="pixelarticons" name="image"></sl-icon>
        {/if}
        {#if isEditingName}
            <sl-input bind:this={inputName} onkeydown={(e: KeyboardEvent) => {
                if(e.key === "Enter") {
                    isEditingName = false;
                }
            }} onblur={()=> isEditingName = false} onsl-change={(e: SlChangeEvent) => {
                appState.layers[layerIdx].name = (e.target as SlInput).value;
            }}></sl-input>
        {:else}
            <p>{appState.layers[layerIdx].name}</p> 
        {/if}
        <sl-icon-button onclick={() => appState.layers[layerIdx].isVisible = !appState.layers[layerIdx].isVisible} 
            library="pixelarticons" name={appState.layers[layerIdx].isVisible ? "eye" : "eye-closed"} >
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

