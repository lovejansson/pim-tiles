<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import {
    PaintType,
    type AutoTileLayerState,
    type TileLayerState,
  } from "../types";
  import { splitIntoTiles } from "../utils";
  import FilePicker from "./ui/FilePicker.svelte";
  import TilesetTab from "./TilesetTab.svelte";

  const tilemapEditorState = $derived.by(
    (): TileLayerState | AutoTileLayerState => {
      if (guiState.tilemapEditorState.type === PaintType.TILE)
        return guiState.tilemapEditorState;
      if (guiState.tilemapEditorState.type === PaintType.AUTO_TILE)
        return guiState.tilemapEditorState;

      throw new Error("Invalid UI state");
    },
  );

  const selectedTileRef = $derived(
    tilemapEditorState.selectedAsset?.type === PaintType.TILE
      ? tilemapEditorState.selectedAsset.ref
      : null,
  );

  let selectedTilesetIdx = $state(0);

  const loadTileset = async (files: FileList) => {
    try {
      const file = files[0];
      const bitmap = await createImageBitmap(file);
      const tiles = await splitIntoTiles(bitmap, projectState.tileSize);
      const numNamedNewTileset = projectState.tilesets
        .get()
        .filter((t) => t.name.match(/New tileset(\(\d\))?/)).length;

      projectState.tilesets.add(
        `New tileset${numNamedNewTileset === 0 ? "" : "(" + numNamedNewTileset + ")"}`,
        tiles,
      );
      selectedTilesetIdx = projectState.tilesets.get().length - 1;
    } catch (e) {
      console.error(e);
      guiState.notification = {
        variant: "danger",
        title: "Failed to decode image",
        msg: "Accepted image formats are image/png, image/jpeg, image/webp, image/bmp, image/svg+xml",
      };
    }
  };

  const selectTile = (tilesetId: string, tileId: string) => {
    tilemapEditorState.selectedAsset = {
      type: PaintType.TILE,
      ref: { tileset: { id: tilesetId }, tile: { id: tileId } },
    };
  };
</script>

<section id="tilesets">
  <header>
    <h2>Tilesets</h2>
    <FilePicker accept="image/png, image/jpeg" onFile={loadTileset} />
  </header>

  {#if projectState.tilesets.get().length > 0}
    <sl-tab-group>
      {#each projectState.tilesets.get() as tileset}
        <sl-tab slot="nav" panel={tileset.name}>
          <TilesetTab {tileset} /></sl-tab
        >
        <sl-tab-panel name={tileset.name}>
          <ul class="tiles">
            {#each tileset.tiles as tile}
              <li
                class:selected={selectedTileRef &&
                  selectedTileRef.tileset.id === tileset.id &&
                  selectedTileRef.tile.id === tile.id}
              >
                <button
                  class="tile"
                  onkeydown={(e) => {
                    if (e.key.toLowerCase() === "enter")
                      selectTile(tileset.id, tile.id);
                  }}
                  onclick={() => selectTile(tileset.id, tile.id)}
                >
                  <img src={tile.dataURL} alt="tile" />
                </button>
              </li>
            {/each}
          </ul>
        </sl-tab-panel>
      {/each}
    </sl-tab-group>
  {:else}
    <sl-tab-group>
      <sl-tab slot="nav" panel={"empty"}>Load tileset</sl-tab>
      <sl-tab-panel name={"empty"}>
        <div id="div-empty">
          <sl-icon library="pixelarticons" name="chess"></sl-icon>
        </div>
      </sl-tab-panel>
    </sl-tab-group>
  {/if}
</section>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tiles {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 1px;
  }

  .tile {
    width: 100%;
    height: 100%;
    cursor: pointer;
    padding: 0;
    background: none;
    border: none;
  }

  .tile img {
    aspect-ratio: 1/1;
    image-rendering: pixelated;
    width: 100%;
    height: 100%;
  }

  .selected {
    outline: 1px solid lime;
  }

  sl-tab {
    padding: 0;
  }

  #div-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  sl-tab-panel::part(base) {
    height: 100%;
    width: 100%;
  }

  sl-tab-panel {
    background-color: var(--color-4);
    --padding: 0;
    height: 240px;
  }
</style>
