<script lang="ts">
  import { guiState } from "../state.svelte";


  import {detectOS} from "./utils";
 
 const OS = detectOS();

 const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore when user is typing
    if((e.target as HTMLElement | null)?.localName  === "sl-input") return;

    switch(e.key.toLowerCase()) {
        case "e":
            guiState.selectedTool = "erase";
            break;
        case "t":
            guiState.selectedTool = "paint";
      
            break; 
    }
};

</script>

<svelte:window  onkeydown={handleKeyDown} />

    <sl-button-group label="Tools">
        <sl-tooltip content="Tile paint">
        <!-- Svelte wants an aria role but shoelace has handled this internally -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <sl-button
          class:selected-tool={guiState.selectedTool === "paint"}
            onclick={() => guiState.selectedTool = "paint"
        } 
        onkeydown={(e: KeyboardEvent) => {
            if(e.key === "Enter") {
                guiState.selectedTool = "paint"
            }
        }}
        ><sl-icon library="pixelarticons" name="edit" label="Tile paint"></sl-icon></sl-button>
        </sl-tooltip>

        <sl-tooltip content="Erase">
        <!-- Svelte wants an aria role but shoelace has handled this internally -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <sl-button
        class:selected-tool={guiState.selectedTool === "erase"}
        onclick={() => guiState.selectedTool = "erase"}
         onkeydown={(e: KeyboardEvent) => {
            if(e.key === "Enter") {
                guiState.selectedTool = "erase"
            }
        }}
        ><sl-icon id="erase" library="pixelarticons" name="layout-sidebar-left" label="Erase"></sl-icon></sl-button>
        </sl-tooltip>
  </sl-button-group>


<style lang="postcss">

    #erase {
        transform: rotate(45deg);
    }
    
     sl-button::part(base):active,  
   sl-button::part(base):hover,  
   sl-button::part(base):focus, 
   .selected-tool::part(base) {
     background-color: rgb(112, 253, 121);
    }


</style>

