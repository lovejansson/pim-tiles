<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import CreateNewLayerDialog from "./CreateNewLayerDialog.svelte";
  import { dndzone, type DndEvent, type Item } from "svelte-dnd-action";
  let createNewLayerDialogIsOpen = $state(false);
  import { flip } from "svelte/animate";
  import LayerItem from "./LayerItem.svelte";
  import type { Layer } from "../types";

  const handleDndConsider = (e: CustomEvent<DndEvent<Layer>>) => {
    projectState.layers.set(e.detail.items);
  };

  const handleDndFinalize = (e: CustomEvent<DndEvent<Layer>>) => {
    projectState.layers.set(e.detail.items);
    updateSelectedStyles();
  };

  const styleDragged = (el?: HTMLElement, data?: Item) => {
    if (el && data) {
      el.style.outline = "var(--color-0) solid 1px";
      if (data.id === guiState.tilemapEditorState.selectedLayer)
        el.style.backgroundColor = "var(--color-2)";
      return el;
    }
  };

  // Had to work around the svelte reactivity updates of selected state for layer styles bc it didn't sync well with dnd operation
  const updateSelectedStyles = () => {
    const ul: HTMLUListElement = document.getElementById(
      "layers-list",
    )! as HTMLUListElement;

    for (const li of ul.children) {
      if (li.id === guiState.tilemapEditorState.selectedLayer) {
        (li as HTMLLIElement).style.backgroundColor = "var(--color-2)";
      } else {
        (li as HTMLLIElement).style.backgroundColor = "";
      }

      const eyeIcon = li.querySelector("sl-icon-button");
      if (eyeIcon) {
        eyeIcon.name = guiState.visibleLayers[li.id] ? "eye" : "eye-closed";
      }
    }
  };

  $effect(() => {
    if (guiState.tilemapEditorState.selectedLayer) {
      updateSelectedStyles();
    }
  });
</script>

<section id="layers">
  <header>
    <h2>Layers</h2>
   
    
    <sl-button
      onclick={() => {
        createNewLayerDialogIsOpen = true;
      }}
    >
      <sl-icon label="New layer" library="pixelarticons" name="plus"
      ></sl-icon></sl-button
    >
  </header>

  <ul
    id="layers-list"
    use:dndzone={{
      items: projectState.layers.get(),
      transformDraggedElement: styleDragged,
      dropTargetStyle: { outline: "var(--color-0) solid 1px" },
      flipDurationMs: 100,
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#each projectState.layers.get() as layer, idx (layer.id)}
      <li id={layer.id} animate:flip={{ duration: 100 }}>
        <LayerItem {layer} />
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
  }

  li {
    background-color: var(--color-4);
  }
  /* .selected {
    background-color: var(--color-2);
  } */
</style>
