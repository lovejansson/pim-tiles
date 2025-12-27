<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import CreateNewLayerDialog from "./CreateNewLayerDialog.svelte";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  let createNewLayerDialogIsOpen = $state(false);
  import { flip } from "svelte/animate";
  import LayerItem from "./LayerItem.svelte";
  import type { Layer } from "../types";

  const handleDndConsider = (e: CustomEvent<DndEvent<Layer>>) => {
    projectState.layers.set(e.detail.items);
  };

  const handleDndFinalize = (e: CustomEvent<DndEvent<Layer>>) => {
    projectState.layers.set(e.detail.items);
  };

  const styleDragged = (el: HTMLElement) => {
    el.style.outline = "var(--color-0) solid 1px";
    return el;
  };

  let dndLayers = $derived(projectState.layers.get().map((l) => ({ ...l })));
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
        if (e.key === "Enter") createNewLayerDialogIsOpen = true;
      }}
    >
      <sl-icon label="New layer" library="pixelarticons" name="plus"
      ></sl-icon></sl-button
    >
  </header>

  <ul
    use:dndzone={{
      items: dndLayers,
      transformDraggedElement: (el: HTMLElement | undefined) =>
        el && styleDragged(el),
      dropTargetStyle: { outline: "var(--color-0) solid 1px" },
      flipDurationMs: 100,
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#each dndLayers as layer, idx (layer.id)}
      <li
        class:selected={guiState.tilemapEditorState.selectedLayer.id ===
          layer.id}
        animate:flip={{ duration: 100 }}
      >
        <LayerItem {idx} {layer} />
      </li>
    {/each}
  </ul>
</section>
<CreateNewLayerDialog bind:open={createNewLayerDialogIsOpen} />

<style lang="postcss">
  header {
    display: flex;
    justify-content: space-between;
  }
  #layers {
    display: flex;
    flex-direction: column;

    width: 320px !important;
  }

  li {
    background-color: var(--color-4);
  }

  .selected {
    background-color: var(--color-2);
  }
</style>
