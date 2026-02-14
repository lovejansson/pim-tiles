<script lang="ts">
  import { guiState } from "../state.svelte";
  import {
    PaintType,
    Tool,
    type AreaLayerState,
    type AutoTileLayerState,
    type TileLayerState,
  } from "../types";

  const tilemapEditorState = $derived.by(
    (): TileLayerState | AreaLayerState | AutoTileLayerState => {
      if (guiState.tilemapEditorState.type === PaintType.TILE)
        return guiState.tilemapEditorState;
      if (guiState.tilemapEditorState.type === PaintType.AREA)
        return guiState.tilemapEditorState;
      if (guiState.tilemapEditorState.type === PaintType.AUTO_TILE)
        return guiState.tilemapEditorState;

      throw new Error("Invalid UI state");
    },
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement | null)?.localName === "sl-input") return;

    switch (e.key.toLowerCase()) {
      case "e":
        tilemapEditorState.selectedTool = Tool.ERASE;
        break;
      case "t":
        tilemapEditorState.selectedTool = Tool.PAINT;
        break;
      case "s":
        tilemapEditorState.selectedTool = Tool.SELECT;
        break;
      case "f":
        tilemapEditorState.fillToolIsActive =
          !tilemapEditorState.fillToolIsActive;
        break;
    }
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

<div>
  <sl-button-group label="Tools">
    <sl-tooltip content="Tile paint (T)">
      <!-- Svelte wants an aria role but shoelace has handled this internally -->
      
     
      <sl-button
        class:selected-tool={tilemapEditorState.selectedTool === Tool.PAINT}
        onclick={() => (tilemapEditorState.selectedTool = Tool.PAINT)}
        ><sl-icon library="pixelarticons" name="edit" label="Tile paint"
        ></sl-icon></sl-button
      >
    </sl-tooltip>

    <sl-tooltip content="Erase (E)">
      <!-- Svelte wants an aria role   but shoelace has handled this internally -->
      
     
      <sl-button
        class:selected-tool={tilemapEditorState.selectedTool === Tool.ERASE}
        onclick={() => (tilemapEditorState.selectedTool = Tool.ERASE)}
        ><sl-icon
          library="pixelarticons"
          name="layout-sidebar-left"
          label="Erase"
        ></sl-icon></sl-button
      >
    </sl-tooltip>

    <sl-tooltip content="Selection (S)">
      <!-- Svelte wants an aria role   but shoelace has handled this internally -->
      
     
      <sl-button
        class:selected-tool={tilemapEditorState.selectedTool === Tool.SELECT}
        onclick={() => (tilemapEditorState.selectedTool = Tool.SELECT)}
        ><sl-icon library="pixelarticons" name="drop-area" label="Select"
        ></sl-icon></sl-button
      >
    </sl-tooltip>
  </sl-button-group>

  <sl-button-group label="Modifiers">
    <sl-tooltip content="Fill tool (F)">
      <!-- Svelte wants an aria role but shoelace has handled this internally -->
      
     
      <sl-button
        class:selected-tool={tilemapEditorState.fillToolIsActive}
        onclick={() =>
          (tilemapEditorState.fillToolIsActive =
            !tilemapEditorState.fillToolIsActive)}
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
  .selected-tool::part(base) {
    background-color: rgb(112, 253, 121);
  }
</style>
