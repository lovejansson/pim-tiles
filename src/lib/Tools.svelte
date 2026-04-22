<script lang="ts">
  import { type SlChangeEvent, SlCheckbox } from "@shoelace-style/shoelace";
  import { guiState, tilemapEditorState } from "../projectState.svelte";
  import { PaintType, Tool } from "../types";

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement | null)?.localName === "sl-input") return;

    switch (e.key.toLowerCase()) {
      case "q":
        tilemapEditorState.selectedTool = Tool.PAINT;
        break;
      case "w":
        tilemapEditorState.selectedTool = Tool.SELECT;
        break;
      case "e":
        if (
          tilemapEditorState.type === PaintType.AUTO_TILE ||
          tilemapEditorState.type === PaintType.TILE
        ) {
          tilemapEditorState.selectedTool = Tool.ERASE;
        }
        break;
      case "r":
        if (
          tilemapEditorState.type === PaintType.AUTO_TILE ||
          tilemapEditorState.type === PaintType.TILE
        ) {
          tilemapEditorState.fillToolIsActive =
            !tilemapEditorState.fillToolIsActive;
        }
        break;

        break;
    }
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

<section>
  <sl-button-group label="Tools">
    <sl-tooltip content="Tile paint (Q)">
      <sl-button
        size="large"
        class:selected-tool={tilemapEditorState.selectedTool === Tool.PAINT}
        onclick={() => (tilemapEditorState.selectedTool = Tool.PAINT)}
        ><sl-icon library="pixelarticons" name="edit" label="Paint"
        ></sl-icon></sl-button
      >
    </sl-tooltip>

    <sl-tooltip content="Selection (W)">
      <sl-button
        size="large"
        class:selected-tool={tilemapEditorState.selectedTool === Tool.SELECT}
        onclick={() => (tilemapEditorState.selectedTool = Tool.SELECT)}
        ><sl-icon library="pixelarticons" name="drop-area" label="Select"
        ></sl-icon></sl-button
      >
    </sl-tooltip>
    {#if tilemapEditorState.type === PaintType.AUTO_TILE || tilemapEditorState.type === PaintType.TILE}
      <sl-tooltip content="Erase (E)">
        <sl-button
          size="large"
          class:selected-tool={tilemapEditorState.selectedTool === Tool.ERASE}
          onclick={() => (tilemapEditorState.selectedTool = Tool.ERASE)}
          ><sl-icon
            library="pixelarticons"
            name="layout-sidebar-left"
            label="Erase"
          ></sl-icon></sl-button
        >
      </sl-tooltip>
    {/if}
  </sl-button-group>
  {#if tilemapEditorState.type === PaintType.AUTO_TILE || tilemapEditorState.type === PaintType.TILE}
    <sl-button-group label="Modifiers">
      <sl-tooltip content="Fill tool (R)">
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
  {/if}

  {#if tilemapEditorState.type === PaintType.OBJECT}
    <sl-checkbox
      onsl-change={(e: SlChangeEvent) => {
        if (e.target) {
          guiState.outlineObjects = (e.target as SlCheckbox).checked;
        }
      }}
      checked={guiState.outlineObjects}>Outline objects</sl-checkbox
    >
  {/if}
</section>

<style lang="postcss">
  section {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .selected-tool::part(base) {
    background-color: var(--color-3);
  }
</style>
