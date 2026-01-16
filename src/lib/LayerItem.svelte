<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import { PaintType, type Layer } from "../types";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import EditableText from "./ui/EditableText.svelte";

  type LayerItemProps = {
    layer: Layer;
  };

  let { layer }: LayerItemProps = $props();

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
        selectLayer();
      }

      projectState.layers.delete(layer.id);
    } else if (item.value === "rename") {
      isEditingName = true;
    }
  };

  const selectLayer = () => {
    if (guiState.tilemapEditorState.selectedLayer.id !== layer.id) {
      guiState.tilemapEditorState.selectedLayer = layer;
      guiState.tilemapEditorState.selectedAsset = null;
      guiState.tilemapEditorState.type = layer.type;
    }
  };

  const toggleVisibility = () => {
    guiState.visibleLayers[layer.id] = !guiState.visibleLayers[layer.id];
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
  <div id="layer" onclick={selectLayer}>
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
    background: none;
    padding: none;
    border: none;
    font-family: inherit;
  }
</style>
