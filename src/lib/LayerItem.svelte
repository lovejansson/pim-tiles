<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import { PaintType, Tool, type Layer } from "../types";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import EditableText from "./ui/EditableText.svelte";

  type LayerItemProps = {
    layer: Layer;
    idx: number;
  };

  let { layer, idx }: LayerItemProps = $props();

  let isEditingName = $state(false);

  const handleSelectMenuItem = (item: any) => {
    if (item.value === "delete") {
      if (projectState.layers.get().length === 1) {
        guiState.notification = {
          variant: "danger",
          title: "Delete layer",
          msg: "One layer is required!",
        };
        return;
      }

      const layerIsSelected =
        guiState.tilemapEditorState.selectedLayer.id === layer.id;

      if (layerIsSelected) {
        selectLayer(layer, idx);
      }

      projectState.layers.delete(layer.id);
    } else if (item.value === "rename") {
      isEditingName = true;
    }
  };

  const selectLayer = (layer: Layer, idx: number) => {
    switch (layer.type) {
      case PaintType.TILE:
        guiState.tilemapEditorState = {
          type: PaintType.TILE,
          selectedLayer: layer,
          selectedTool: Tool.PAINT,
          selectedAsset: null,
          fillToolIsActive: false,
        };
        break;
      case PaintType.AUTO_TILE:
        guiState.tilemapEditorState = {
          type: PaintType.AUTO_TILE,
          selectedLayer: layer,
          selectedTool: Tool.PAINT,
          selectedAsset: null,
          fillToolIsActive: false,
        };
        break;
      case PaintType.AREA:
        guiState.tilemapEditorState = {
          type: PaintType.AREA,
          selectedLayer: layer,
          selectedTool: Tool.PAINT,
          selectedAsset: null,
          fillToolIsActive: false,
        };
    }
  };

  const toggleVisibility = () => {
    projectState.layers.get()[idx].isVisible =
      !projectState.layers.get()[idx].isVisible;
  };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<ContextMenu
  onSelect={handleSelectMenuItem}
  menuItems={[
    { label: "Rename", value: "rename", icon: "edit-box" },
    { label: "Delete", value: "delete", icon: "close" },
  ]}
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div id="layer" onclick={() => selectLayer(layer, idx)}>
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

    <EditableText bind:isEditing={isEditingName} text={layer.name} />

    <!-- sl handles accessability internally -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-icon-button
      onkeydown={(e: KeyboardEvent) => e.key === "Enter" && toggleVisibility()}
      onclick={(e: MouseEvent) => {
        e.stopPropagation();
        toggleVisibility();
      }}
      library="pixelarticons"
      name={layer.isVisible ? "eye" : "eye-closed"}
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
    background: none;
    padding: none;
    border: none;
    font-family: inherit;
  }
</style>
