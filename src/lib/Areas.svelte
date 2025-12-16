<script lang="ts">
  import { projectState } from "../state.svelte";
  import CreateNewLayerDialog from "./CreateNewLayerDialog.svelte";
import Layer from "./Layer.svelte";

let createNewAreaDialogIsOpen = $state(false);


</script>


<section id="areas">
  <header>
    <h2>Areas</h2>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
      onclick={() => {
        createNewAreaDialogIsOpen = true;
      }}
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter")      createNewAreaDialogIsOpen = true;
      }}
    >
      <sl-icon label="New area" library="pixelarticons" name="plus"
      ></sl-icon></sl-button
    >
  </header>

  <ul>
    {#each projectState.layers as layer, idx (layer.id)}
      <li>
        <Layer layerIdx={idx} />
      </li>
    {/each}
  </ul>
</section>
<CreateNewLayerDialog bind:open={createNewAreaDialogIsOpen}/>

<style lang="postcss">
  header {
    display: flex;
    justify-content: space-between;
  }
  #areas {
    display: flex;
    flex-direction: column;

    width: 320px !important;
    height: 100%;
  }

  li {
    background-color: var(--color-4);
  }



</style>
