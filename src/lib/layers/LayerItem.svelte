<script lang="ts">
  import type { SlIconButton } from "@shoelace-style/shoelace";
  import {
    guiState,
    tilemapEditorState,
    updateTilemapEditorState,
  } from "../../projectState.svelte";
  import { PaintType, Tool, type LayerComp } from "../../types";
  import EditableText from "../common/EditableText.svelte";
  import ConfirmDialog from "../common/ConfirmDialog.svelte";

  type LayerItemProps = {
    layer: LayerComp;
    onDelete: () => void;
    onRename: (name: string) => void;
  };

  let { layer, onDelete, onRename }: LayerItemProps = $props();

  let icon: SlIconButton;

  let name = $state(layer.name);
  let isEditingName = $state(false);
  let confirmDialogIsOpen = $state(false);

  $effect(() => {
    if (name !== layer.name) onRename(name);
  });

  const selectLayer = () => {
    if (layer.id !== tilemapEditorState.selectedLayer) {
      updateTilemapEditorState({
        type: layer.type,
        selectedLayer: layer.id,
        selectedAsset:
          layer.type === tilemapEditorState.type
            ? tilemapEditorState.selectedAsset
            : null,
        selectedTool: tilemapEditorState.selectedTool,
        fillToolIsActive: tilemapEditorState.fillToolIsActive,
        selection: { tiles: [] },
      });
    }
  };

  const toggleVisibility = () => {
    if (guiState.visibleLayers[layer.id]) {
      guiState.visibleLayers[layer.id] = false;
      icon.name = "eye-closed";
    } else {
      guiState.visibleLayers[layer.id] = true;
      icon.name = "eye";
    }
  };

  const handleConfirm = () => {
    onDelete();
  };

  const handleCancel = () => {
    confirmDialogIsOpen = false;
  };
</script>

<div id="layer" onclick={selectLayer}>
  {#if layer.type === PaintType.TILE}
    <sl-tooltip content="Tile layer">
      <sl-icon library="pixelarticons" name="chess"></sl-icon>
    </sl-tooltip>
  {:else if layer.type === PaintType.AUTO_TILE}
    <sl-tooltip content="Autotile layer">
      <sl-icon library="pixelarticons" name="grid"></sl-icon>
    </sl-tooltip>
  {/if}

  <EditableText
    bind:isEditing={isEditingName}
    bind:text={name}
    inputWidth="fit-content"
  />

  <sl-button-group>
    <sl-icon-button
      library="pixelarticons"
      name="edit"
      onclick={(e: MouseEvent) => {
        e.stopPropagation();
        isEditingName = !isEditingName;
      }}
    >
    </sl-icon-button>

    <sl-icon-button
      bind:this={icon}
      onclick={(e: MouseEvent) => {
        e.stopPropagation();
        toggleVisibility();
      }}
      library="pixelarticons"
      name={guiState.visibleLayers[layer.id] ? "eye" : "eye-closed"}
    >
    </sl-icon-button>
    <sl-icon-button
      library="pixelarticons"
      name="close"
      onclick={(e: MouseEvent) => {
        confirmDialogIsOpen = true;
        e.stopPropagation();
      }}
    >
    </sl-icon-button>
  </sl-button-group>
</div>

<ConfirmDialog
  open={confirmDialogIsOpen}
  label="Delete layer"
  msg="Deleting a layer will erase the painted tilemap and is irreversable. Are you sure you want to do that?"
  cancel={handleCancel}
  confirm={handleConfirm}
/>

<style lang="postcss">
  #layer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 0.5rem;
    padding: 0.5rem;
    padding: none;
    border: none;
    font-family: inherit;
  }
</style>
