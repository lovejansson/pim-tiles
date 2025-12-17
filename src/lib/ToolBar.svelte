<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import Areas from "./Areas.svelte";
  import AutoTiles from "./AutoTiles.svelte";
  import Images from "./Images.svelte";
  import Layers from "./Layers.svelte";
  import Objects from "./Objects.svelte";
  import Scripts from "./Scripts.svelte";
  import Tilesets from "./Tilesets.svelte";
  import Tools from "./Tools.svelte";

   const selectedLayer = $derived.by(() => {

        const layer = projectState.layers.find(l => l.id === guiState.selectedLayer);

        if(layer === undefined) throw new Error("Internal error: selected layer missing");
            return layer;
        }
    );

</script>

<section id="toolbar">
    <Layers/>
    <sl-divider></sl-divider>
    {#if selectedLayer.type === "tile"}
      <Tools/>
      <Tilesets/>
        <sl-divider></sl-divider>
      <AutoTiles/>
    {:else if selectedLayer.type === "area"}
        <Areas/>
    {:else if selectedLayer.type === "image"}
        <Objects/>
                   <sl-divider></sl-divider>
         <Images/>
    {/if}
         <sl-divider></sl-divider>
    <Scripts/>

</section>

<style lang="postcss">
    #toolbar {
        padding: 2rem 1rem;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        gap: 1rem;

    }

    sl-divider {
        --width: 1px;
        --color: var(--color-2);
 

    }
</style>

