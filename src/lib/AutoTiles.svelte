<script lang="ts">
  import type { SlInput, SlChangeEvent } from "@shoelace-style/shoelace";
    import CreateAutoTileDialog from "./CreateAutoTileDialog.svelte";

let createDialogIsOpen = $state(false);


</script>

<section id="auto-tiles">
    <header>
            <h2>Auto tiles</h2>
                <sl-button  onclick={() => {
    createDialogIsOpen = true;
    }}><sl-icon label="New layer" library="pixelarticons" name="plus"></sl-icon></sl-button>


    </header>

    <ul id="ul-auto-tiles">
          
    <li>Create an auto tile to paint with.</li>
   
    </ul>

    <CreateAutoTileDialog bind:open={createDialogIsOpen} />
</section>

<style lang="postcss">
        header {
        display: flex;
        justify-content: space-between;
    }
    #auto-tiles {
        
        width: 320px !important;
        height:  100%;
        
    }

    ul {
        background-color: var(--color-4);
             padding: 1rem 0;   
    }   

</style>

