<script lang="ts">
    import {   guiState, projectState } from "../state.svelte";
    import { splitIntoTiles } from "../utils";
    import TilesetTab from "./TilesetTab.svelte";

    let selectedTilesetIdx = $state(0);
    let fileInput: HTMLInputElement;

    const loadTileset = async (e: {currentTarget: HTMLInputElement}) => {
        try {
            if(e.currentTarget === null) alert("error");
                const input = e.currentTarget;
                const file = input.files![0];
                const bitmap = await createImageBitmap(file);
                const tiles = await splitIntoTiles(bitmap, projectState.tileSize);
                const numNamedNewTileset = projectState.tilesets.filter(t => t.name.match(/New tileset(\(\d\))?/)).length;
                projectState.tilesets.push({name: `New tileset${numNamedNewTileset === 0 ? "" : "(" + numNamedNewTileset + ")"}` , tiles: tiles});
                selectedTilesetIdx = projectState.tilesets.length - 1;
                   
        }catch (e) {
            console.error(e);
           guiState.notification = {variant: "danger", title: "Failed to decode image", msg: "Accepted image formats are image/png, image/jpeg, image/webp, image/bmp, image/svg+xml"}
        } finally {
            fileInput.value = "";
        }
    }

</script>

<section id="tilesets">
<header>
    <h2>Tilesets</h2>
   
    <sl-button
    onkeydown={() =>  fileInput?.click()}  
    onclick={() => {
    fileInput?.click()
    }}>
    <sl-icon label="Load asset" library="pixelarticons" name="upload"></sl-icon> </sl-button>
</header>

    <input bind:this={fileInput} type="file" style="display:none;"  accept="image/png, image/jpeg" onchange={loadTileset}/>

        {#if projectState.tilesets.length > 0}
            <sl-tab-group>
            {#each projectState.tilesets as tileset, idx} 
   
    <sl-tab slot="nav" panel={tileset.name}><TilesetTab tilesetIdx={idx}/></sl-tab>
                <sl-tab-panel name={tileset.name}>
                    <ul class="tiles">
                        {#each tileset.tiles as tile}
                            <li class="selected">
                                <img class="tile" src={tile.dataURL} alt="tile"/>
                            </li>
                        {/each}
                    </ul>
                </sl-tab-panel>
            {/each}
    </sl-tab-group>
      {:else}
    <sl-tab-group>
      
           <sl-tab slot="nav" panel={"empty"}>Load tileset</sl-tab>
            <sl-tab-panel name={"empty"}>
                <div id="div-empty">
                    <sl-icon library="pixelarticons" name="image"></sl-icon>
                </div>
                 
            </sl-tab-panel>
 
    </sl-tab-group>
       {/if}
</section>

<style>
     header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .tiles {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        gap: 1px;
    }

    .tile {
       aspect-ratio: 1/1;
       width: 100%;
       height: 100%;
       image-rendering: pixelated;
       cursor: pointer;
    }

    .selected {
        border: 1px solid lime;
    }

    sl-tab {
        padding:0;
    }

    #div-empty {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    sl-tab-panel::part(base) {
        height: 100%;
        width: 100%;
    }

    sl-tab-panel {
        background-color: var(--color-4);
        --padding: 0;
        height: 240px;
    }
</style>

