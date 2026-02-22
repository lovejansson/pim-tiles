<script lang="ts">
  import type { SlMenuItem } from "@shoelace-style/shoelace";
  import { guiState } from "../../state.svelte";
  import { PaintType, type Layer } from "../../types";
  import ContextMenu from "../common/ContextMenu.svelte";
  import EditableText from "../common/EditableText.svelte";

  type LayerItemProps = {
    layer: Layer;
    onDelete: () => void;
    onRename: (name: string) => void;
  };

  let { layer, onDelete, onRename }: LayerItemProps = $props();

  let name = $state(layer.name);
  let isEditingName = $state(false);

  const handleSelectMenuItem = (item: SlMenuItem) => {
    if (item.value === "delete") {
      onDelete();
    } else if (item.value === "rename") {
      isEditingName = true;
    }
  };

  $effect(() => {
    if (name !== layer.name) onRename(name);
  });

  const selectLayer = () => {
    guiState.tilemapEditorState.selectedLayer = layer.id;
    guiState.tilemapEditorState.selectedAsset = null;
    guiState.tilemapEditorState.type = layer.type;
  };

  const toggleVisibility = () => {
    guiState.visibleLayers[layer.id] = !guiState.visibleLayers[layer.id];
  };
</script>

<ContextMenu
  onSelect={handleSelectMenuItem}
  menuItems={[
    { label: "Rename", value: "rename", icon: "edit-box" },
    { label: "Delete", value: "delete", icon: "close" },
  ]}
>
  <div id="layer" onclick={selectLayer} oncontextmenu={() => console.log("CONTEXT MENU CLICK")}>
    {#if layer.type === PaintType.TILE}
      <sl-tooltip content="Tile layer">
        <sl-icon library="pixelarticons" name="chess"></sl-icon>
      </sl-tooltip>
    {:else if layer.type === PaintType.AUTO_TILE}
      <sl-tooltip content="Autotile layer">
        <sl-icon library="pixelarticons" name="grid"></sl-icon>
      </sl-tooltip>
    {:else}
      <sl-tooltip content="Area layer">
        <sl-icon library="pixelarticons" name="section"></sl-icon>
      </sl-tooltip>
    {/if}

    <EditableText bind:isEditing={isEditingName} bind:text={name} />

    <sl-icon-button
      onclick={(e: MouseEvent) => {
        e.stopPropagation();
        toggleVisibility();
      }}
      library="pixelarticons"
      name={guiState.visibleLayers[layer.id] ? "eye" : "eye-closed"}
    >
    </sl-icon-button>
  </div>
</ContextMenu>

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
