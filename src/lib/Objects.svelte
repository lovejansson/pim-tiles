<script lang="ts">
  import type {   SlInput, SlMenuItem } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../state.svelte";
    import { bitmapToDataURL } from "../utils";
    import Image from "./Image.svelte";
  import Object from "./Object.svelte";


    const selectedLayer = $derived.by(() => {

        const layer = projectState.layers.find(l => l.id === guiState.selectedLayer);

        if(layer === undefined) throw new Error("Internal error: selected layer missing");
            return layer;
        }
    );
  


</script>

<section id="objects">

<header>
    <h2>Objects</h2>
</header>
    <ul>
        {#if selectedLayer.type === "image" }
            {#each selectedLayer.data as image, idx}
                <li><Object imgIdx={idx}/></li>
            {/each}

        {:else}
        <div id="div-empty">
            <p>fmkdslfm</p>
              <sl-icon library="pixelarticons" name="image"></sl-icon>
        </div>
          
        {/if}
    </ul>
</section>

<style>

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    #objects {
        width: 320px !important;
        height:  100%;
    }

    #div-empty {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    li {
        cursor: pointer;
    }

</style>

