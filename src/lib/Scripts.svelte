<script lang="ts">
  import { appState } from "../state.svelte";
  import ScriptTreeItem from "./ScriptTreeItem.svelte";
  import ContextMenu from "./ContextMenu.svelte";

 type Tileset = {
    name: string;
    tiles: string[];
 }

 const tilesets: Tileset[] = [];

 let selectedTilesetIdx = 0;

</script>

<section id="scripts">

    <header>
        <h2>Scripts</h2>

    <sl-button><sl-icon label="New layer" library="pixelarticons" name="plus"></sl-icon></sl-button>


</header>

    
    <sl-tree selection="leaf">
        <sl-tree-item>
              <sl-icon library="pixelarticons" name="folder"></sl-icon>
            Scripts
    
    {#each appState.scripts as userScript, idx} 
  
    <sl-tree-item>
            <ContextMenu 
    menuItems={[{label: "Delete", icon: "close"}, {label: "Rename", icon: "edit-box"}]}
    onSelect={() => {}}
  >   
       
        <p>{userScript.name}</p>
        </ContextMenu>
    </sl-tree-item>

    {/each}    
</sl-tree-item>  
    </sl-tree>
</section>

<style lang="postcss">

    header {
        display: flex;
        justify-content: space-between;
    }
 
    #scripts {
 
        width: 320px !important;
        height:  100%;
    }
</style>

