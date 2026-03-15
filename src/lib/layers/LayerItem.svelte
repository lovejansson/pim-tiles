<script lang="ts">
  import type { SlIconButton } from "@shoelace-style/shoelace";
  import { guiState } from "../../state.svelte";
  import { PaintType, type Layer } from "../../types";
  import EditableText from "../common/EditableText.svelte";

  type LayerItemProps = {
    layer: Layer;
    onDelete: () => void;
    onRename: (name: string) => void;
  };

  let { layer, onDelete, onRename }: LayerItemProps = $props();

  let icon: SlIconButton;

  let name = $state(layer.name);
  let isEditingName = $state(false);

  $effect(() => {
    if (name !== layer.name) onRename(name);
  });

  const selectLayer = () => {
    if (layer.id !== guiState.tilemapEditorState.selectedLayer) {
      guiState.tilemapEditorState.selectedLayer = layer.id;
      // Clear the selected tool only if the new selected layer isn't the same type of layer so that the user can continue painting with selected tiles!
      if (layer.type !== guiState.tilemapEditorState.type)
        guiState.tilemapEditorState.selectedAsset = null;

      guiState.tilemapEditorState.type = layer.type;
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
    inputWidth="100%"
  />

  <sl-button-group>
    <sl-icon-button
      library="pixelarticons"
      name="edit"
      onclick={(e: MouseEvent) => {
        e.stopPropagation();
        isEditingName = true;
      }}
    >
    </sl-icon-button>

    <sl-icon-button
      id="icon-visibility"
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
        e.stopPropagation();
        onDelete();
      }}
    >
    </sl-icon-button>
  </sl-button-group>
</div>

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
