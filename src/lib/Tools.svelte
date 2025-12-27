<script lang="ts">
  import { guiState } from "../state.svelte";
  import type { AreaLayerState, AutoTileLayerState, TileLayerState } from "../types";

  const tilemapEditorState = $derived.by(
    (): TileLayerState | AreaLayerState | AutoTileLayerState => {
      if (guiState.tilemapEditorState.type === "tile")
        return guiState.tilemapEditorState;
      if (guiState.tilemapEditorState.type === "area")
        return guiState.tilemapEditorState;
      if(guiState.tilemapEditorState.type === "auto-tile") 
        return guiState.tilemapEditorState;

      throw new Error("Invalid UI state");
    }
  );

  const handleKeyDown = (e: KeyboardEvent) => {
  
    if ((e.target as HTMLElement | null)?.localName === "sl-input") return;

    switch (e.key.toLowerCase()) {
      case "e":
        tilemapEditorState.selectedTool = "erase";
        break;
      case "t":
        tilemapEditorState.selectedTool = "paint";
        break;
      case "f":
        tilemapEditorState.fillToolIsActive = !tilemapEditorState.fillToolIsActive;
        break;
    }
  };  

</script>

<svelte:window onkeydown={handleKeyDown} />

<div>

<sl-button-group label="Tools">
  <sl-tooltip content="Tile paint (T)">
    <!-- Svelte wants an aria role but shoelace has handled this internally -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
      class:selected-tool={tilemapEditorState.selectedTool === "paint"}
      onclick={() => (tilemapEditorState.selectedTool = "paint")}
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter") {
          tilemapEditorState.selectedTool = "paint";
        }
      }}
      ><sl-icon library="pixelarticons" name="edit" label="Tile paint"
      ></sl-icon></sl-button
    >
  </sl-tooltip>

  <sl-tooltip content="Erase (E)">
    <!-- Svelte wants an aria role   but shoelace has handled this internally -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
      class:selected-tool={tilemapEditorState.selectedTool === "erase"}
      onclick={() => (tilemapEditorState.selectedTool = "erase")}
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter") {
          tilemapEditorState.selectedTool = "erase";
        }
      }}
      ><sl-icon
        id="erase"
        library="pixelarticons"
        name="layout-sidebar-left"
        label="Erase"
      ></sl-icon></sl-button
    >
  </sl-tooltip>
</sl-button-group>

<sl-button-group label="Modifiers">
  <sl-tooltip content="Fill tool (F)">
    <!-- Svelte wants an aria role but shoelace has handled this internally -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
      class:selected-tool={tilemapEditorState.fillToolIsActive}
      onclick={() => (tilemapEditorState.fillToolIsActive = !tilemapEditorState.fillToolIsActive)}
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter") {
          tilemapEditorState.fillToolIsActive = !tilemapEditorState.fillToolIsActive;
        }
      }}
      ><sl-icon library="pixelarticons" name="paint-bucket" 
      ></sl-icon></sl-button
    >
  </sl-tooltip>
</sl-button-group>
</div>
<style lang="postcss">

  div {
    display: flex;
    justify-content: space-between;
  }
    
  #erase {
    transform: rotate(45deg);
  }


  .selected-tool::part(base) {
    background-color: rgb(112, 253, 121);
  }
</style>
