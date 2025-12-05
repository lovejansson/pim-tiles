<script lang="ts">
  import { appState } from "../state.svelte";


  import {detectOS} from "./utils";
 
 const OS = detectOS();

 // Paint (klick/drag), Erase (Same/), 
 // Bucket fill / add tile attriutees

</script>



    <sl-button-group label="Tools">
        <sl-tooltip content="Tile paint">
        <!-- Svelte wants an aria role but shoelace has handled this internally -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <sl-button
          class:selected-tool={appState.selectedTool === "paint"}
            onclick={() => appState.selectedTool = "paint"
        } 
        onkeydown={(e: KeyboardEvent) => {
            if(e.key === "Enter") {
                appState.selectedTool = "paint"
            }
        }}
        ><sl-icon library="pixelarticons" name="edit" label="Tile paint"></sl-icon></sl-button>
        </sl-tooltip>
        <sl-tooltip content="Fill area">

        <!-- Svelte wants an aria role but shoelace has handled this internally -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <sl-button  
                  class:selected-tool={appState.selectedTool === "fill"}
        onclick={() => appState.selectedTool = "fill"}
        onkeydown={(e: KeyboardEvent) => {
            if(e.key === "Enter") {
                appState.selectedTool = "fill"
            }
        }}
        ><sl-icon library="pixelarticons" name="fill-half" label="Fill area"
        ></sl-icon></sl-button>
        </sl-tooltip>
        <sl-tooltip content="Erase">
        <!-- Svelte wants an aria role but shoelace has handled this internally -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <sl-button
                  class:selected-tool={appState.selectedTool === "erase"}
        onclick={() => appState.selectedTool = "erase"}
         onkeydown={(e: KeyboardEvent) => {
            if(e.key === "Enter") {
                appState.selectedTool = "erase"
            }
        }}
        ><sl-icon id="erase" library="pixelarticons" name="layout-sidebar-left" label="Erase"></sl-icon></sl-button>
        </sl-tooltip>
  </sl-button-group>
 


<!--     
    <sl-button 
    

          onkeydown={() => appState.selectedTool = "paint"} 
        class:selected-tool={appState.selectedTool === "paint"} class="btn-tool" style="width: 42px"  ><sl-icon library="pixelarticons" name="edit"></sl-icon></sl-button>
    </sl-tooltip>

     <sl-tooltip content="Bucket fill">
        <sl-button
     role="button"

    onclick={() => appState.selectedTool = "fill"} 
      onkeydown={() => appState.selectedTool = "fill"} 
     class:selected-tool={appState.selectedTool === "fill"} class="btn-tool" style="width: 42px"><sl-icon library="pixelarticons" name="fill-half"></sl-icon> </sl-button>
  </sl-tooltip>
     <sl-tooltip content="Eraser">
     <sl-button
     role="button"
    onclick={() => appState.selectedTool = "erase"} 
    onkeydown={() => appState.selectedTool = "erase"} 
     class:selected-tool={appState.selectedTool === "erase"} class="btn-tool" style="width: 42px;height:42px"><sl-icon id="erase" library="pixelarticons" name="layout-sidebar-left"></sl-icon></sl-button>
     </sl-tooltip> -->

<style lang="postcss">

    #erase {
        transform: rotate(45deg);
    }

     sl-button::part(base):active,  
   sl-button::part(base):hover,  
   sl-button::part(base):focus,
     sl-button.selected-tool::part(base) {
       background-color: rgb(112, 253, 121);
    }
 



</style>

