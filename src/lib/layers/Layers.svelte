<script lang="ts">
  import {
    guiState,
    projectState,
    projectStateEvents,
    ProjectStateEventType,
  } from "../../state.svelte";
  import CreateNewLayerDialog from "./CreateNewLayerDialog.svelte";
  import { dndzone, type DndEvent, type Item } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import LayerItem from "./LayerItem.svelte";
  import type { Layer, PaintType } from "../../types";

  let createNewLayerDialogIsOpen = $state(false);

  let ulLayers: HTMLUListElement;

  $effect(() => {
    // Workaround due to bug in dnd kit, svelte's reactive DOM didn't work so style for layer items are updated the hard way
    if (guiState.tilemapEditorState.selectedLayer) {
      updateSelectedStyles();
    }
  });

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
    updateSelectedStyles();
    updateVisibilityIcon();
  };

  const styleDragged = (el?: HTMLElement, data?: Item) => {
    if (el && data) {
      el.style.outline = "var(--color-0) solid 1px";
      if (data.id === guiState.tilemapEditorState.selectedLayer)
        el.style.backgroundColor = "var(--color-2)";
      return el;
    }
  };

  $effect(() => {
    projectStateEvents.on(ProjectStateEventType.LOAD_FROM_FILE, () => {
      layers = projectState.getLayers();
    });

    projectStateEvents.on(ProjectStateEventType.NEW_PROJECT, () => {
      layers = projectState.getLayers();
    });
  });

  const updateVisibilityIcon = () => {
    for (const li of ulLayers.children) {
      const eyeIcon = li.querySelector("sl-icon-button");
      if (eyeIcon) {
        if (guiState.visibleLayers[li.id]) {
          eyeIcon.name = "eye";
        } else {
          eyeIcon.name = "eye-closed";
        }
      }
    }
  };

  const updateSelectedStyles = () => {
    for (const li of ulLayers.children) {
      if (li.id === guiState.tilemapEditorState.selectedLayer) {
        (li as HTMLLIElement).style.backgroundColor = "var(--color-2)";
      } else {
        (li as HTMLLIElement).style.backgroundColor = "var(--color-3)";
      }
    }
  };

  const renameLayer = (id: string, name: string) => {
    projectState.updateLayer(id, name);
  };
  const createLayer = (name: string, type: PaintType) => {
    projectState.createLayer(name, type);
    layers = projectState.getLayers();
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

    projectState.deleteLayer(id);

    layers = projectState.getLayers();

    if (id === guiState.tilemapEditorState.selectedLayer)
      guiState.tilemapEditorState.selectedLayer =
        projectState.getLayers()[0].id;
  };
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
    bind:this={ulLayers}
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
      <li id={layer.id} animate:flip={{ duration: 100 }}>
        <LayerItem
          {layer}
          onRename={(name: string) => renameLayer(layer.id, name)}
          onDelete={() => deleteLayer(layer.id)}
        />
      </li>
    {/each}
  </ul>
</section>
<CreateNewLayerDialog
  onCreate={createLayer}
  bind:open={createNewLayerDialogIsOpen}
/>

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
    background-color: var(--color-3);
  }
</style>
