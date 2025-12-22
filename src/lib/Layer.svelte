<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import EditableText from "./ui/EditableText.svelte";

  let { layerIdx } = $props();

  let isEditingName = $state(false);

  const handleSelectMenuItem = (item: any) => {

    if (item.value === "delete") {

      if(projectState.layers.length === 1) {
        guiState.notification = {
          variant: "danger",
          title: "Delete layer",
          msg: "One layer is required!",
        };
        return;
      }

      const layerIsSelected =
        guiState.tilemapEditorState.selectedLayer ===
        projectState.layers[layerIdx];

      if (layerIsSelected) {
        selectLayer(layerIdx - 1);
      }

      projectState.layers.splice(layerIdx, 1);

    } else if (item.value === "rename") {
      isEditingName = true;
    }

  };

  const selectLayer = (idx: number) => {
    
    const layer = projectState.layers[idx];

    switch (layer.type) {
      case "tile":
        guiState.tilemapEditorState = {
          type: "tile",
          selectedLayer: layer,
          selectedTool: "paint",
          selectedAsset: null,
        };
        break;
      case "image":
        guiState.tilemapEditorState = {
          type: "image",
          selectedLayer: layer,
          selectedAsset: null,
        };
        break;
      case "area":
        guiState.tilemapEditorState = {
          type: "area",
          selectedLayer: layer,
          selectedTool: "paint",
          selectedAsset: null,
        };
    }
  };

  const toggleVisibility = () => {
    projectState.layers[layerIdx].isVisible =
      !projectState.layers[layerIdx].isVisible;
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
  <div id="layer" onclick={() => selectLayer(layerIdx)}>
    {#if projectState.layers[layerIdx].type === "tile"}
      <sl-tooltip content="Tile layer">
        <sl-icon library="pixelarticons" name="chess"></sl-icon>
      </sl-tooltip>
    {:else if projectState.layers[layerIdx].type === "image"}
      <sl-tooltip content="Image layer">
        <sl-icon library="pixelarticons" name="image"></sl-icon>
      </sl-tooltip>
    {:else}
      <sl-tooltip content="Area layer">
        <sl-icon library="pixelarticons" name="drop-area"></sl-icon>
      </sl-tooltip>
    {/if}

    <EditableText
      bind:isEditing={isEditingName}
      text={projectState.layers[layerIdx].name}
    />

    <!-- sl handles accessability internally -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-icon-button
      onkeydown={(e: KeyboardEvent) => e.key === "Enter" && toggleVisibility()}
      onclick={toggleVisibility}
      library="pixelarticons"
      name={projectState.layers[layerIdx].isVisible ? "eye" : "eye-closed"}
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
