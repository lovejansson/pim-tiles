<script lang="ts">
  import type { SlInput, SlChangeEvent } from "@shoelace-style/shoelace";
    import CreateAutoTileDialog from "./CreateAutoTileDialog.svelte";
    import { projectState } from "../state.svelte";

let createDialogIsOpen = $state(false);


</script>

<section id="auto-tiles">
    <header>
            <h2>Auto tiles</h2>
                <sl-button  onclick={() => {
    createDialogIsOpen = true;
    }}><sl-icon label="New layer" library="pixelarticons" name="plus"></sl-icon></sl-button>


    </header>

    {#if projectState.ruleTiles.length > 0 }
    
        <ul >
          

   
    </ul>        {#each projectState.ruleTiles as ruleTile, idx}
            <li>
                <div class="auto-tile-item">
                    <span>{ruleTile.name}</span>
                </div>
            </li>
        {/each}
    {:else}
        <div id="div-empty">
          <sl-icon library="pixelarticons" name="chess"></sl-icon>
        </div>
    {/if}




    <CreateAutoTileDialog bind:open={createDialogIsOpen} />
</section>

<style>
    header {
        display: flex;
        justify-content: space-between;
    }
    #auto-tiles {
        display: flex;
    flex-direction: column;

    width: 320px !important;
    height: 100%;

        
    }

      #div-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

    ul {
     
           display: flex;
    flex-direction: column;
    gap: 0.5rem;  
    }   

</style>

