<script lang="ts">
  import {
    guiState,
    projectState,
    projectStateEvents,
    ProjectStateEventType,
    tilemapEditorState,
    updateTilemapEditorState,
  } from "../../projectState.svelte";
  import CreateNewLayerDialog from "./CreateNewLayerDialog.svelte";
  import { dndzone, type DndEvent, type Item } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import LayerItem from "./LayerItem.svelte";
  import { type LayerComp, type PaintType } from "../../types";
  import type { SlIconButton } from "@shoelace-style/shoelace";

  let dialogIsOpen = $state(false);

  let ulLayers: HTMLUListElement;

  $effect(() => {
    // Workaround due to bug in dnd kit, svelte's reactive DOM didn't work so style for layer items are updated the hard way
    if (tilemapEditorState.selectedLayer) {
      updateSelectedStyles();
    }
  });

  // Need a separate state for layers here since dnd lib replaces items on drag and at the same time requires the user to update the items list which means that if we update project state it will
  // contain shadow items and miss real items for a short while.
  // IMPORTANTE that this syncs well with the SOT projectState, delete, update of name and reordering is done only in this component.
  let layers = $state(projectState.getLayers());

  const handleDndConsider = (e: CustomEvent<DndEvent<LayerComp>>) => {
    layers = e.detail.items; // Update only UI state here since it isn't finalized
  };

  const handleDndFinalize = (e: CustomEvent<DndEvent<LayerComp>>) => {
    projectState.setReorderedLayers(e.detail.items); // Update the SOT state here
    layers = e.detail.items; // Sync UI state with SOT state
    updateSelectedStyles();
    updateVisibilityIcon();
  };

  const styleDragged = (el?: HTMLElement, data?: Item) => {
    if (el && data) {
      el.style.outline = "var(--color-0) solid 1px";
      if (data.id === tilemapEditorState.selectedLayer)
        el.style.backgroundColor = "var(--color-2)";
      return el;
    }
  };

  $effect(() => {
    projectStateEvents.on(ProjectStateEventType.OPEN_FILE, () => {
      layers = projectState.getLayers();
    });

    projectStateEvents.on(ProjectStateEventType.NEW_PROJECT, () => {
      layers = projectState.getLayers();
    });
  });

  const updateVisibilityIcon = () => {
    for (const li of ulLayers.children) {
      const eyeIcon: SlIconButton | null = li.querySelector(
        "#icon-visibility",
      ) as SlIconButton | null;
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
      if (li.id === tilemapEditorState.selectedLayer) {
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

    // Set selected layer to first layer
    if (id === tilemapEditorState.selectedLayer) {
      const firstLayer = projectState.getLayers()[0];

      updateTilemapEditorState({
        type: firstLayer.type,
        selectedLayer: firstLayer.id,

        selection: { tiles: [] },
      });
    }
  };
</script>

<section id="layers">
  <header>
    <h2>Layers</h2>

    <sl-button
      onclick={() => {
        dialogIsOpen = true;
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
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <li tabindex={0} id={layer.id} animate:flip={{ duration: 100 }}>
        <LayerItem
          {layer}
          onRename={(name: string) => renameLayer(layer.id, name)}
          onDelete={() => deleteLayer(layer.id)}
        />
      </li>
    {/each}
  </ul>
</section>

{#if dialogIsOpen}
  <CreateNewLayerDialog onCreate={createLayer} bind:open={dialogIsOpen} />{/if}

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
