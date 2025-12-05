<script lang="ts">
  import type { SlChangeEvent, SlInput } from "@shoelace-style/shoelace";


 type Tileset = {
    name: string;
    tiles: string[];
 }

 const tilesets: Tileset[] = [{name: "alien", tiles: []}, {name: "japan", tiles: []}];

 let selectedTilesetIdx = 0;

 let fileInput: SlInput;

</script>

<section id="tilesets">
<header>
        <h2>Tilesets</h2>
   
    <sl-button  onclick={() => {
    fileInput?.showPicker()
    }}><sl-icon label="Load asset" library="pixelarticons" name="upload"></sl-icon> </sl-button>
</header>



<sl-input bind:this={fileInput} type="file" style="display:none;" onsl-change={(e: SlChangeEvent) => {
    console.dir(e)  
}}></sl-input>



    <sl-tab-group>
        {#each tilesets as tileset} 
          <sl-tab slot="nav" panel={tileset.name}>{tileset.name}</sl-tab>
        <sl-tab-panel name={tileset.name}>Tileset panel for {tileset.name}</sl-tab-panel>
        {/each}

        </sl-tab-group>



   
</section>

<style>
     header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    #tilesets {
 
        width: 320px !important;
        height:  100%;
    }

    sl-tab-panel {
   
        background-color: var(--color-4);
    }
</style>

