<script lang="ts">
import { SlInput, SlSelect, type SlChangeEvent, type SlHideEvent} from '@shoelace-style/shoelace';
import { projectState } from '../state.svelte';
    import type { TileRule, TileRef } from '../types';
    import RuleTileButton from './RuleTileButton.svelte';

let { open = $bindable() } = $props();

const hide = ( ) => {
    open = false;
}
const show = () => open = true;

let selectedTile: TileRef | null = $state(null);

let name = $state("New auto tile");
let rules: TileRule[] = $state([]);

const saveRule = () => {
    projectState.ruleTiles.push({name, rules});
    console.log(projectState.ruleTiles)
    open = false;
}

const newRule = () => {

    rules.push({ 
        connectedTilesRequirements: { 
                n: "optional",
                ne: "optional",
                e: "optional",
                se: "optional",
                s: "optional",
                sw: "optional",
                w: "optional",
                nw: "optional",
            },
            tile: null,
    })
}

const deleteRule = (idx: number) => {
    rules.splice(idx, 1);
}

</script>

<sl-dialog  onsl-after-hide={hide} label="Create auto tile" open={open}>
    <div id="content-wrapper">
    <section id="add-rules">
        <sl-input onsl-change={(e: SlChangeEvent) => {
                    if(e.target) {
                        name = (e.target as SlInput).value;
                    }
                }} 
                label="Name"  type="text" value={name}>
            </sl-input>  

        <!-- svelte-ignore a11y_no_static_element_interactions -->
            <sl-button
        onclick={newRule}
        onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter") newRule()
        }}
        > Add rule
        <sl-icon label="Add rule" library="pixelarticons" name="plus"
        ></sl-icon></sl-button>

        <ul id="rules">
            {#each rules as rule, idx} 
                <RuleTileButton onDelete={() => deleteRule(idx)} selectedTile={selectedTile} bind:ruleTile={rules[idx]} />
            {/each}
        </ul>
      </section>

    <sl-tab-group id="tilesets">
            {#each projectState.tilesets as tileset, tilesetIdx} 
   
    <sl-tab slot="nav" panel={tileset.name}>{tileset.name}</sl-tab>
                <sl-tab-panel name={tileset.name}>
                    <ul class="tiles">
                        {#each tileset.tiles as tile, tileIdx}
                            <li class:selected={selectedTile && selectedTile.tilesetId === tilesetIdx && selectedTile.tileId === tileIdx}>
                               <button onclick={() => selectedTile = {tilesetId: tilesetIdx, tileId: tileIdx}} class="btn-tile"> <img class="img-tile" src={tile.dataURL} alt="tile"/></button>
                            </li>
                        {/each}
                    </ul>
                </sl-tab-panel>
            {/each}
    </sl-tab-group>
    
   
        
 
</div>
   <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button 
    slot="footer"

    variant="primary"
    onclick={saveRule}
    onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter") saveRule();
    }}
    >Save</sl-button>
</sl-dialog>


<style>

    sl-dialog {
        --width: 50%;
        height:  50%;
    }
        #content-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: stretch;
  
        height: 60dvh;
        width: 100%;
        gap: 1rem;
       }
    #add-rules {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow-y: auto;
        flex: 3;
   
    }
    #tilesets {
       flex: 3;
   

    }
    #btn-save {

    }


    #rules {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow-y: auto;
    }

    .tiles {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        margin: 0;
        width: 100%;
 
        gap: 1px;
        
 
    }


    .btn-tile {
        aspect-ratio: 1/1;
        width: 100%;
        height: 100%;
        border: none;
        background-color: none;
        padding: 0;
           cursor: pointer;
    }

    .img-tile {
       aspect-ratio: 1/1;
       width: 100%;
       height: 100%;
       image-rendering: pixelated;
    
    }
  

    .selected {
        outline: 1px solid lime  !important;
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
        height: 55dvh;
    }

    sl-tab-panel {
        background-color: var(--color-4);
        --padding: 0;
        height: 100%;

        /* height: 240px; */
    }

</style>
