<script lang="ts">
  import { projectState } from "../state.svelte";
  import CreateNewLayerDialog from "./CreateNewLayerDialog.svelte";
import Layer from "./Layer.svelte";

let createNewLayerDialogIsOpen = $state(false);


</script>

<section id="layers">
  <header>
    <h2>Layers</h2>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
      onclick={() => {
        createNewLayerDialogIsOpen = true;
      }}
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter")      createNewLayerDialogIsOpen = true;
      }}
    >
      <sl-icon label="New layer" library="pixelarticons" name="plus"
      ></sl-icon></sl-button
    >
  </header>

  <ul>
    {#each projectState.layers as _, idx}
      <li class:odd={idx % 2 === 0}>
        <Layer layerIdx={idx} />
      </li>
    {/each}
  </ul>
</section>
<CreateNewLayerDialog bind:open={createNewLayerDialogIsOpen}/>

<style lang="postcss">
  header {
    display: flex;
    justify-content: space-between;
  }
  #layers {
    display: flex;
    flex-direction: column;

    width: 320px !important;
    height: 100%;
  }

  li {
  }

  .odd {
    background-color: var(--color-4);
  }
</style>
