<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import { splitIntoTiles } from "../utils";
  import FilePicker from "./ui/FilePicker.svelte";
  import TilesetTab from "./TilesetTab.svelte";
  import TilesCanvas from "./TilesCanvas.svelte";
    import type { SelectedTiles } from "../types";

  let selectedTilesetIdx = $state(0);

  const loadTileset = async (files: FileList) => {
    try {
      const file = files[0];
      const name = file.name.split(".")[0];
      const bitmap = await createImageBitmap(file);
      const tiles = await splitIntoTiles(bitmap, projectState.tileSize);

      const numSameName = projectState.tilesets
        .get()
        .reduce((count, t) => (t.name === name ? (count += 1) : count), 0);

      projectState.tilesets.add(
        numSameName > 0 ? `${name} (${numSameName})` : name,
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

  const handleOnSelectTiles = (selectedTiles: SelectedTiles) => {
    guiState.tilemapEditorState.selectedAsset = selectedTiles;
  }
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
          <TilesCanvas
            {tileset}
            multipleSelection
            onSelect={handleOnSelectTiles}
          />
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
    height: 400px;
  }
</style>
