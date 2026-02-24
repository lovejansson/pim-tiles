<script lang="ts">
  import { guiState, projectState } from "../../state.svelte";
  import CreateNewLayerDialog from "./CreateNewLayerDialog.svelte";
  import { dndzone, type DndEvent, type Item } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import LayerItem from "./LayerItem.svelte";
  import type { Layer } from "../../types";

  let createNewLayerDialogIsOpen = $state(false);

  // Need a separate state for layers here since dnd lib replaces items on drag and at the same time requires the user to update the items list which means that if we update project state it will
  // contain shadow items and miss real items for a short while.
  // IMPORTANTE that this syncs well with the SOT projectState, delete, update of name and reordering is done only in this component.
  let layers = $state(projectState.getLayers());

  const handleDndConsider = (e: CustomEvent<DndEvent<Layer>>) => {
    layers = e.detail.items; // Update only UI state here since it isn't finalized
  };

  const handleDndFinalize = (e: CustomEvent<DndEvent<Layer>>) => {
    projectState.setReorderedLayers(e.detail.items); // Update the SOT state here
    layers = e.detail.items; // Sync UI state with SOT state
    //updateSelectedStyles();
  };

  const styleDragged = (el?: HTMLElement, data?: Item) => {
    if (el && data) {
      el.style.outline = "var(--color-0) solid 1px";
      if (data.id === guiState.tilemapEditorState.selectedLayer)
        el.style.backgroundColor = "var(--color-2)";
      return el;
    }
  };

  // Work around the svelte reactivity updates of selected state for layer styles bc it didn't sync well with dnd operation
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

  const renameLayer = (id: string, name: string) => {
    projectState.updateLayer(id, name);
  };

  const deleteLayer = (id: string) => {
    if (projectState.getLayers().length === 1) {
      guiState.notification = {
        variant: "danger",
        title: "Delete layer",
        msg: "One layer is required!",
      };
      return;
    }

    const idx = layers.findIndex((l) => l.id === id);

    projectState.deleteLayer(id);

    if (idx === -1) throw new Error("Layer not found");

    layers.splice(idx, 1);
  };

  $effect(() => {
    if (guiState.tilemapEditorState.selectedLayer) {
      //updateSelectedStyles();
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
      items: layers,
      transformDraggedElement: styleDragged,
      dropTargetStyle: { outline: "var(--color-0) solid 1px" },
      flipDurationMs: 100,
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#each layers as layer, _ (layer.id)}
      <li
        id={layer.id}
        animate:flip={{ duration: 100 }}
        class={guiState.tilemapEditorState.selectedLayer === layer.id
          ? "selected"
          : ""}
      >
        <LayerItem
          {layer}
          onRename={(name: string) => renameLayer(layer.id, name)}
          onDelete={() => deleteLayer(layer.id)}
        />
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

  .selected {
    background-color: var(--color-2);
  }
</style>
