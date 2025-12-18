<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import CreateNewLayerDialog from "./CreateNewLayerDialog.svelte";
  import Layer from "./Layer.svelte";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  let createNewLayerDialogIsOpen = $state(false);
  import { flip } from "svelte/animate";

  const handleDndConsider = (e: CustomEvent<DndEvent<any>>) => {
    projectState.layers = e.detail.items.map((i) => i.layer);
  };

  const handleDndFinalize = (e: CustomEvent<DndEvent<any>>) => {
    projectState.layers = e.detail.items.map((i) => i.layer);
  };

  const styleDragged = (el: HTMLElement) => {
    el.style.outline = "var(--color-0) solid 1px";
    return el;
  };
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
      items: projectState.layers.map((l, i) => ({ layer: l, id: i })),
      dragDisabled: false,
      dropFromOthersDisabled: true,
      transformDraggedElement: (el: HTMLElement | undefined) =>
        el && styleDragged(el),
      type: "layer",
      dropTargetStyle: { outline: "var(--color-0) solid 1px" },
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#each projectState.layers.map( (l, i) => ({ layer: l, id: i }) ) as layer, idx (layer.id)}
      <li
        class:selected={guiState.tilemapEditorState.selectedLayer ===
          layer.layer}
        animate:flip={{ duration: 100 }}
      >
        <Layer layerIdx={idx} />
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
    height: 100%;
  }

  li {
    background-color: var(--color-4);
  }

  .selected {
    background-color: var(--color-2);
  }
</style>
