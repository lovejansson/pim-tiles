<script lang="ts">
  import { SlCheckbox, type SlChangeEvent } from "@shoelace-style/shoelace";
  import { guiState, tilemapEditorState } from "../projectState.svelte";
  import { PaintType } from "../types";
  import AutoTiles from "./auto-tiles/AutoTiles.svelte";
  import Layers from "./layers/Layers.svelte";
  import Tilesets from "./tilesets/Tilesets.svelte";
  import Tools from "./Tools.svelte";
  import Menu from "./Menu.svelte";
  import Objects from "./objects/Objects.svelte";
</script>

<section id="toolbar">
  <section id="top-bar">
    <Menu />
    <section id="grid-settings">
      <sl-checkbox
        onsl-change={(e: SlChangeEvent) => {
          if (e.target) {
            guiState.showGrid = (e.target as SlCheckbox).checked;
          }
        }}
        checked={guiState.showGrid}>Show grid</sl-checkbox
      >

      <div class="stats-wrapper">
        <p>r{guiState.mouseTilePos.row} c{guiState.mouseTilePos.col}</p>
      </div>
    </section>
  </section>

  <Layers />

  <sl-divider></sl-divider>

  {#if tilemapEditorState.type === PaintType.TILE}
    <Tools />
    <Tilesets />
  {:else if tilemapEditorState.type === PaintType.AUTO_TILE}
    <Tools />
    <AutoTiles />
  {:else if tilemapEditorState.type === PaintType.OBJECT}
    <Tools />
    <Objects />
  {/if}
</section>

<style lang="postcss">
  #toolbar {
    padding: 1rem;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 400px;
    align-items: stretch;
  }

  #grid-settings {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    margin-top: auto;
  }

  #top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .stats-wrapper {
    display: flex;
    gap: 0.2rem;
    align-items: flex-end;

    min-width: 4.2em;
    font-size: smaller;
  }

  sl-divider {
    --width: 1px;
    --color: var(--color-2);
  }
</style>
