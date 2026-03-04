<script lang="ts">
  import { guiState, projectState } from "../../state.svelte";
  import FilePicker from "../common/FilePicker.svelte";
  import TilesetTab from "./TilesetTab.svelte";
  import TilesCanvas from "./TilesetCanvas.svelte";
  import type { TileAsset } from "../../types";
  import { SlTabGroup } from "@shoelace-style/shoelace";

  let selectedTilesetIdx = $state(0);

  let tabGroup!: SlTabGroup;

  const loadTileset = async (files: FileList) => {
    try {
      const file = files[0];
      const name = file.name.split(".")[0];
      const bitmap = await createImageBitmap(file);

      const numSameName = projectState
        .getTilesets()
        .reduce((count, t) => (t.name === name ? (count += 1) : count), 0);

      projectState.createTileset(
        numSameName > 0 ? `${name} (${numSameName})` : name,
        bitmap,
      );

      selectedTilesetIdx = projectState.getTilesets().length - 1;
    } catch (e) {
      console.error(e);
      guiState.notification = {
        variant: "danger",
        title: "Failed to decode image",
        msg: "Accepted image formats are image/png, image/webp",
      };
    }
  };

  const handleOnSelectTiles = (selectedTiles: TileAsset[]) => {
    guiState.tilemapEditorState.selectedAsset = selectedTiles;
  };

  const deleteTileset = (id: string, idx: number) => {
    try {
      projectState.deleteTileset(id);
    } catch (e) {
      const msg = (e as Error).message;
      guiState.notification = {
        msg,
        variant: "danger",
        title: "Failed to delete tileset",
      };
    }

    if (projectState.getTilesets().length === 0) return;

    const nextTabIdx = idx === 0 ? 0 : idx - 1;
    const tabToFocus = projectState.getTilesets()[nextTabIdx].name;
    tabGroup.show(tabToFocus);
  };
</script>

<section id="tilesets">
  <header>
    <h2>Tilesets</h2>
    <FilePicker accept="image/png, image/webp" onFile={loadTileset} />
  </header>

  {#if projectState.getTilesets().length > 0}
    <sl-tab-group bind:this={tabGroup}>
      {#each projectState.getTilesets() as tileset, idx (tileset.id)}
        <sl-tab slot="nav" panel={tileset.name}>
          <TilesetTab
            {tileset}
            onDelete={() => deleteTileset(tileset.id, idx)}
          /></sl-tab
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
    background-color: var(--color-3);
    --padding: 0;
    height: 400px;
  }
</style>
