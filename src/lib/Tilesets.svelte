<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import type { TileLayerState } from "../types";
  import { splitIntoTiles } from "../utils";
  import FilePicker from "./ui/FilePicker.svelte";
  import TilesetTab from "./TilesetTab.svelte";

  const tilemapEditorState = $derived.by((): TileLayerState => {
    if (guiState.tilemapEditorState.type === "tile")
      return guiState.tilemapEditorState;

    throw new Error("Invalid UI state");
  });

  const selectedTileRef = $derived(
    tilemapEditorState.selectedAsset?.type === "tile"
      ? tilemapEditorState.selectedAsset.ref
      : null
  );

  let selectedTilesetIdx = $state(0);

  const loadTileset = async (files: FileList) => {
    try {
      const file = files[0];
      const bitmap = await createImageBitmap(file);
      const tiles = await splitIntoTiles(bitmap, projectState.tileSize);
      const numNamedNewTileset = projectState.tilesets.filter((t) =>
        t.name.match(/New tileset(\(\d\))?/)
      ).length;
      projectState.tilesets.push({
        name: `New tileset${numNamedNewTileset === 0 ? "" : "(" + numNamedNewTileset + ")"}`,
        tiles: tiles,
      });
      selectedTilesetIdx = projectState.tilesets.length - 1;
    } catch (e) {
      console.error(e);
      guiState.notification = {
        variant: "danger",
        title: "Failed to decode image",
        msg: "Accepted image formats are image/png, image/jpeg, image/webp, image/bmp, image/svg+xml",
      };
    }
  };

  const selectTile = (tilesetId: number, tileId: number) => {
    tilemapEditorState.selectedAsset = {
      type: "tile",
      ref: { tilesetId, tileId },
    };
  };
</script>

<section id="tilesets">
  <header>
    <h2>Tilesets</h2>
       <FilePicker accept="image/png, image/jpeg" onFile={loadTileset} />
  </header>


  {#if projectState.tilesets.length > 0}
    <sl-tab-group>
      {#each projectState.tilesets as tileset, tilesetIdx}
        <sl-tab slot="nav" panel={tileset.name}>
          <TilesetTab {tilesetIdx} /></sl-tab
        >
        <sl-tab-panel name={tileset.name}>
          <ul class="tiles">
            {#each tileset.tiles as tile, tileIdx}
              <li
                class:selected={selectedTileRef &&
                  selectedTileRef.tilesetId === tilesetIdx &&
                  selectedTileRef.tileId === tileIdx}
              >
              <button class="tile"
              onkeydown={(e) =>  {if(e.key.toLowerCase() === "enter") selectTile(tilesetIdx, tileIdx)}}
            onclick={() => selectTile(tilesetIdx, tileIdx)}>
                <img  src={tile.dataURL} alt="tile" />

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
          <sl-icon library="pixelarticons" name="image"></sl-icon>
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
