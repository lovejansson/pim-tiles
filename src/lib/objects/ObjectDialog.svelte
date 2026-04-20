<script lang="ts">
  import {
    SlInput,
    SlSelect,
    type SlChangeEvent,
  } from "@shoelace-style/shoelace";
  import TilesetCanvas from "../tilesets/TilesetCanvas.svelte";
  import { projectState, tilemapEditorState } from "../../projectState.svelte";
  import type {
    Object as ProjectObject,
    ObjectCategory,
    Tile,
    TileAsset,
  } from "../../types";
  import { createCanvas } from "../../utils";

  type ObjectDialogProps = {
    open: boolean;
    object: ProjectObject | null;
    onSave: (object: ProjectObject) => void;
  };

  let { open = $bindable(), object, onSave }: ObjectDialogProps = $props();

  let name = $state("");
  let category: ObjectCategory = $state("other");
  let image: { bitmap: ImageBitmap; tiles: Tile[] } | null = $state(null);
  let width = $state(0);
  let height = $state(0);
  let selectedTilesetIdx = $state(0);

  let imageCanvas: HTMLCanvasElement | null = $state(null);

  const resetForm = () => {
    name = object?.name ?? "";
    category = object?.category ?? "other";
    image = object?.image ?? null;
    width = object?.width ?? 0;
    height = object?.height ?? 0;
    image = object?.image ?? null;

    if (image !== null) {
      const tilesets = projectState.getTilesets();
      const firstTilesetId = image.tiles[0].tilesetId;
      const idx = tilesets.findIndex((t) => t.id === firstTilesetId);
      selectedTilesetIdx = idx === -1 ? 0 : idx;
      drawObjectImage();
    } else {
      selectedTilesetIdx = 0;
    }
  };

  const handleSelectTiles = async (selectedTiles: TileAsset[]) => {
    const tiles = selectedTiles
      .slice()
      .sort((a, b) => a.ref.y - b.ref.y || a.ref.x - b.ref.x)
      .map((tile) => tile.ref);

    const { w, h } = computeDimensions(tiles);

    width = w;
    height = h;

    const bitmap = await createObjectImage(tiles);

    image = { bitmap, tiles };

    drawObjectImage();
  };

  async function createObjectImage(tiles: Tile[]): Promise<ImageBitmap> {
    const ctx = createCanvas(width, height);

    const minX = Math.min(...tiles.map((t) => t.x));
    const minY = Math.min(...tiles.map((t) => t.y));

    for (const t of tiles) {
      const tileset = projectState.getTileset(t.tilesetId);
      ctx.drawImage(
        tileset.spritesheet,
        t.x,
        t.y,
        projectState.tileSize,
        projectState.tileSize,
        t.x - minX,
        t.y - minY,
        projectState.tileSize,
        projectState.tileSize,
      );
    }

    return await createImageBitmap(ctx.canvas);
  }

  function drawObjectImage() {
    if (image === null) throw new Error("Image is null");
    if (imageCanvas === null) throw new Error("Image canvas is null");
    imageCanvas.width = width;
    imageCanvas.height = height;
    const ctx = imageCanvas!.getContext("2d");
    if (ctx === null) throw new Error("ctx for image canvas is null");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image.bitmap, 0, 0, image.bitmap.width, image.bitmap.height);
  }

  function computeDimensions(tiles: Tile[]): { w: number; h: number } {
    const tileSize = projectState.tileSize;
    const cols = tiles.map((tile) => tile.x / tileSize);
    const rows = tiles.map((tile) => tile.y / tileSize);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);

    return {
      w: (maxCol - minCol + 1) * tileSize,
      h: (maxRow - minRow + 1) * tileSize,
    };
  }

  const hide = () => {
    open = false;
  };

  const save = () => {
    if (!(name.trim().length > 0 && width > 0 && height > 0 && image !== null))
      return;
    onSave({
      id: object?.id ?? "",
      name: name.trim(),
      category,
      width,
      height,
      image,
    });
    hide();
  };

  const isValid = $derived.by(() => {
    return name.trim().length > 0 && width > 0 && height > 0 && image !== null;
  });
</script>

<sl-dialog
  id="object-dialog"
  label={object ? "Edit object" : "Create object"}
  {open}
  onsl-after-hide={(e: Event) => {
    if (e.target === null) return;
    if ((e.target as HTMLElement).id === "object-dialog") {
      hide();
    }
  }}
  onsl-show={(e: Event) => {
    if (e.target === null) return;
    if ((e.target as HTMLElement).id === "object-dialog") resetForm();
  }}
>
  <sl-icon-button
    slot="header-actions"
    library="pixelarticons"
    name="close"
    style="font-size: 1.6rem;"
    onclick={hide}
  >
  </sl-icon-button>
  <div id="wrapper" tabindex="-1">
    <div>
      <section id="section-controls">
        <sl-input
          onsl-change={(e: SlChangeEvent) => {
            if (e.target === null) return;
            name = (e.target as SlInput).value;
          }}
          label="Name"
          type="text"
          value={name}
        >
        </sl-input>

        <sl-select
          onsl-change={(e: SlChangeEvent) => {
            if (e.target === null) return;

            const select = e.target as SlSelect;
            const value = select.value;

            if (Array.isArray(value)) return;
            category = value as ObjectCategory;
          }}
          label="Category"
          value={category}
        >
          <sl-option value="houses">Houses</sl-option>
          <sl-option value="nature">Nature</sl-option>
          <sl-option value="decorations">Decorations</sl-option>
          <sl-option value="other">Other</sl-option>
        </sl-select>

        <div id="info-section">
          <p>Size: {width} x {height}</p>
        </div>
      </section>
      <section id="section-tilesets">
        {#if projectState.getTilesets().length > 0}
          <sl-tab-group>
            {#each projectState.getTilesets() as tileset}
              <sl-tab slot="nav" panel={tileset.id}>{tileset.name}</sl-tab>
              <sl-tab-panel name={tileset.id}>
                <TilesetCanvas
                  {tileset}
                  initialSelection={image?.tiles.filter(
                    (t) => t.tilesetId === tileset.id,
                  )}
                  onSelect={handleSelectTiles}
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
                <p>Load a tileset before creating an object.</p>
              </div>
            </sl-tab-panel>
          </sl-tab-group>
        {/if}
      </section>
    </div>
    <section id="section-image">
      <canvas id="canvas-image" bind:this={imageCanvas}></canvas>
    </section>
  </div>

  <sl-button
    slot="footer"
    variant="primary"
    disabled={!isValid}
    onclick={save}
  >
    Save
  </sl-button>

  <sl-button slot="footer" variant="default" onclick={() => (open = false)}>
    Cancel
  </sl-button>
</sl-dialog>

<style>
  sl-dialog::part(body) {
    display: flex;
    flex-direction: column;
  }

  sl-dialog::part(panel) {
    display: flex;
    flex-direction: column;

    width: fit-content;
  }

  sl-dialog::part(close-button) {
    display: none;
  }

  #canvas-image {
    width: 75%;
    height: auto;
    image-rendering: pixelated;
  }
  #wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    gap: 2.4rem;
  }

  p {
    margin: 0;
  }

  #section-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  #section-tilesets {
    display: grid;
    flex: 1;
  }

  #section-image {
    align-self: center;
    width: 400px;
    display: flex;
    justify-content: center;
  }

  #info-section {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--sl-color-neutral-50);
    border-radius: 0.5rem;
    font-size: 0.9rem;
  }

  #div-empty {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--sl-color-neutral-500);
  }

  sl-tab-group::part(body) {
    height: 100%;
  }
  sl-tab-panel::part(base) {
    height: 100%;
    width: 100%;
  }

  sl-tab-panel {
    background-color: var(--color-3);
    --padding: 0;
    height: 400px;
    width: auto;
    aspect-ratio: 1/1;
  }
</style>
