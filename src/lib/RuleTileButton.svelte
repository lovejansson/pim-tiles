<script lang="ts">
    import { projectState } from "../state.svelte";
    import type { ConnectedTilesRequirements, TileRule, TileRef, ConnectedTileRequirement } from "../types";



type RuleTileButtonProps = {
    ruleTile: TileRule;
    selectedTile: TileRef | null
    onDelete: () => void;
}
let { ruleTile = $bindable(), selectedTile, onDelete }: RuleTileButtonProps = $props();

const getNextReq = (connection: ConnectedTileRequirement) => {
    switch(connection) {
        case "required":
            return "excluded";
        case "excluded":
            return "optional";
        case "optional":
            return "required";
    }
}

  const entries = $derived(Object.entries(ruleTile.connectedTilesRequirements) as [
    keyof ConnectedTilesRequirements,
    ConnectedTileRequirement
  ][]);



</script>
<div id="wrapper">

   <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div id="btns-directions">
        {#each entries as [direction, connectionReq] }
      <sl-button 
        style={`grid-area: ${direction};`}
        onclick={() => ruleTile.connectedTilesRequirements[direction] = getNextReq(connectionReq)} 
        onkeydown={(e: KeyboardEvent) => {
            if(e.key === "Enter") {
               ruleTile.connectedTilesRequirements[direction] = getNextReq(connectionReq)
            }}} 
        size="small" class={connectionReq}>
        </sl-button>

    {/each}
    </div>

    {#if ruleTile.tile !== null}
        <img class="tile" src={ruleTile.tile !== null ? projectState.tilesets[ruleTile.tile?.tilesetIdx].tiles[ruleTile.tile?.tileIdx].dataURL : ""} alt="tile"/>
        {:else}
            <sl-button onclick={() => {
                if(selectedTile !== null) {
                    ruleTile.tile = {...selectedTile}
                }
            }} class="tile-placeholder tile"></sl-button>
        {/if}

 
      <sl-icon-button onclick={onDelete} library="pixelarticons" name="close">
        

      </sl-icon-button>

</div>

<style>

#wrapper {
    display: flex;
    gap: 1rem;
}

#btns-directions {
    display: grid;
    grid-template-areas: 
    "nw n ne"
    "e . w"
    "sw s se";
}

.tile, .tile::part(base){
    height: 100%;
    width: auto;
    aspect-ratio: 1/1;
    image-rendering: pixelated;
}




sl-button {
      --padding: 0;
}

sl-button::part(base) {
    width: 32px;
    height: 32px;
  
}

.excluded::part(base) {
    background-color: rgb(64, 255, 64);
}

.optional::part(base) {
    background: rgb(61, 8, 255);
}

.required::part(base) {
    background-color: var(--sl-color-rose-600);
}



</style>