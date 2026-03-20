<script lang="ts">
  import { tilemapEditorState } from "../projectState.svelte";
  import { Tool } from "../types";

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement | null)?.localName === "sl-input") return;

    switch (e.key.toLowerCase()) {
      case "q":
        tilemapEditorState.selectedTool = Tool.PAINT;
        break;
      case "w":
        tilemapEditorState.selectedTool = Tool.ERASE;
        break;
      case "e":
        tilemapEditorState.selectedTool = Tool.SELECT;
        break;
      case "r":
        tilemapEditorState.fillToolIsActive =
          !tilemapEditorState.fillToolIsActive;

        break;
    }
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

<section>
  <sl-button-group label="Tools">
    <sl-tooltip content="Tile paint (Q)">
      <sl-button
        class:selected-tool={tilemapEditorState.selectedTool === Tool.PAINT}
        onclick={() => (tilemapEditorState.selectedTool = Tool.PAINT)}
        ><sl-icon library="pixelarticons" name="edit" label="Tile paint"
        ></sl-icon></sl-button
      >
    </sl-tooltip>

    <sl-tooltip content="Erase (W)">
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

    <sl-tooltip content="Selection (E)">
      <sl-button
        class:selected-tool={tilemapEditorState.selectedTool === Tool.SELECT}
        onclick={() => (tilemapEditorState.selectedTool = Tool.SELECT)}
        ><sl-icon library="pixelarticons" name="drop-area" label="Select"
        ></sl-icon></sl-button
      >
    </sl-tooltip>
  </sl-button-group>

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
</section>

<style lang="postcss">
  section {
    display: flex;
    justify-content: space-between;
  }
  .selected-tool::part(base) {
    background-color: var(--color-3);
  }
</style>
