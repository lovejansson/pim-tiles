<script lang="ts">
  import type { SlChangeEvent, SlInput } from "@shoelace-style/shoelace";
  import { appState } from "../state.svelte";



 let fileInput: SlInput;

</script>

<section id="images">
<header>
        <h2>Images</h2>
   
    <sl-button  onclick={() => {
    fileInput?.showPicker()
    }}><sl-icon label="Load asset" library="pixelarticons" name="upload"></sl-icon> </sl-button>
</header>


<sl-input bind:this={fileInput} type="file" style="display:none;" onsl-change={(e: SlChangeEvent) => {
    console.dir(e)  
}}></sl-input>

    <ul>
        {#if appState.images.length > 0}
         {#each appState.images as image} 
            <li>{image.data}</li>
        {/each}
        {:else}
            <li>Upload images.</li>
        {/if}
    </ul>
</section>

<style>

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    #images {
 
        width: 320px !important;
        height:  100%;
   
    }

    ul {
        background-color: var(--color-4);
             padding: 1rem 0;   
    }
</style>

