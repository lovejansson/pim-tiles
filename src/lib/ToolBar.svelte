<script lang="ts">
  import {
    SlCheckbox,
    SlInput,
    type SlChangeEvent,
    type SlHideEvent,
  } from "@shoelace-style/shoelace";
  import { guiState } from "../state.svelte";
  import { PaintType } from "../types";
  import Areas from "./Areas.svelte";
  import AutoTiles from "./AutoTiles.svelte";
  import Layers from "./Layers.svelte";
  import Tilesets from "./Tilesets.svelte";
  import Tools from "./Tools.svelte";
</script>

<section id="toolbar">
  <Layers />

  <sl-divider></sl-divider>

  {#if guiState.tilemapEditorState.type === PaintType.TILE}
    <Tools />
    <Tilesets />
  {:else if guiState.tilemapEditorState.type === PaintType.AUTO_TILE}
    <Tools />
    <AutoTiles />
  {:else if guiState.tilemapEditorState.type === PaintType.AREA}
    <Tools />
    <Areas />
  {/if}
  <sl-divider></sl-divider>
  <section id="grid-settings">
    <sl-color-picker
      onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()}
      swatches="#000000; #FFFFFF; #2ada64; #bb46eb; #FFD700; #00BFFF;
    "
      value={guiState.gridColor}
      onsl-change={(e: SlChangeEvent) => {
        if (e.target) {
          guiState.gridColor = (e.target as SlInput).value;
        }
        e.stopPropagation();
      }}
      label="Grid color"
      size="small"
    ></sl-color-picker>

    <sl-checkbox
      onsl-change={(e: SlChangeEvent) => {
        if (e.target) {
          guiState.showGrid = (e.target as SlCheckbox).checked;
        }
      }}
      checked={guiState.showGrid}>Show grid</sl-checkbox
    >
  </section>
  <section id="statusbar">
    <div class="stats-wrapper">
      <p>r{guiState.mouseTilePos.row} c{guiState.mouseTilePos.col}</p>
    </div>
  </section>
</section>

<style lang="postcss">
  #toolbar {
    padding: 2rem 1rem;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 500px;
    align-items: stretch;
  }

  #grid-settings {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    margin-top: auto;
  }

  #statusbar {
    display: flex;
    width: 100%;
    gap: 1rem;
    padding: 0.5rem 1rem;
  }

  .stats-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 0.2rem;
    min-width: 4.2rem;
  }

  #statusbar p {
    margin: 0;
  }
  sl-color-picker {
    width: fit-content;
    line-height: 0.8; /** Display block adds height depending on line-height attr*/
  }
  sl-divider {
    --width: 1px;
    --color: var(--color-2);
  }
</style>
