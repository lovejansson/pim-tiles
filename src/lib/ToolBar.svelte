<script lang="ts">
  import AutoTiles from "./AutoTiles.svelte";
  import Images from "./Images.svelte";
  import Layers from "./Layers.svelte";
  import Scripts from "./Scripts.svelte";
  import Tilesets from "./Tilesets.svelte";
  import Tools from "./Tools.svelte";

</script>

<section id="toolbar">
    <Tools/>
    <sl-divider  ></sl-divider>
    <Layers/>
      <sl-divider></sl-divider>
    <Tilesets/>
      <sl-divider></sl-divider>
          <Images/>
      <sl-divider></sl-divider>
    <AutoTiles/>
      <sl-divider></sl-divider>
    <Scripts/>

</section>

<style lang="postcss">
    #toolbar {
        padding: 2rem 1rem;

    
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
   
   
    }

    sl-divider {
        --width: 1px;
        --color: var(--color-2);
 

    }
</style>

