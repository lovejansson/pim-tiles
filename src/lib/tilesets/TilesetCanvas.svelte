<script lang="ts">
  import { onMount } from "svelte";
  import {
    PaintType,
    type Cell,
    type Tile,
    type TileAsset,
    type Tileset,
  } from "../../types";
  import { guiState, projectState } from "../../projectState.svelte";
  import TilemapViewport, {
    type SelectionTileRect,
    TilemapViewportRightClickEvent,
    TilemapViewportSelectionChangeEvent,
  } from "../TilemapViewport";
  import TileAttributesDialog from "../attributes/TileAttributesDialog.svelte";

  type TilesCanvasProps = {
    tileset: Tileset;
    onSelect: (selectedTiles: TileAsset[]) => void;
    initialSelection?: Tile[];
  };

  let { tileset, onSelect, initialSelection = [] }: TilesCanvasProps = $props();

  let container!: HTMLDivElement;
  let tilemapViewport!: TilemapViewport;

  let attributesDialogIsOpen = $state(false);

  let attributesTile: Tile | null = $state(null);

  function draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(tileset.spritesheet, 0, 0);
  }

  onMount(() => {
    if (container === undefined) return;

    tilemapViewport = new TilemapViewport(container, {
      zoom: { min: 0.5, max: 4.0, speed: 0.25 },
      pan: { key: " " },
      grid: {
        tileSize: projectState.tileSize,
        gridColor: guiState.gridColor,
        showGrid: false,
        width: tileset.width,
        height: tileset.height,
      },
      draw: draw,
      defaultCursor: "crosshair",
      selection: {
        isActive: true,
      },
    });

    const ro = new ResizeObserver(([entry]) => {

      if (entry.contentRect.width === 0) return;
      tilemapViewport.width = entry.contentRect.width;
      tilemapViewport.height = entry.contentRect.height;
      ro.disconnect();

      tilemapViewport.init();

      tilemapViewport.addEventListener("selection-change", (e) => {
        updateSelectedTiles((e as TilemapViewportSelectionChangeEvent).rect);
      });

      tilemapViewport.addEventListener("right-click", handleCanvasRightClick);

      // Set initial selection if provided
      if (initialSelection.length > 0) {
        setInitialSelection(initialSelection);
      }
    });

    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  });

  $effect(() => {
    if (!tilemapViewport) return;
    tilemapViewport.updateGridSize(
      tileset.width,
      tileset.height,
      projectState.tileSize,
    );
  });

  const updateSelectedTiles = (rect: SelectionTileRect | null) => {
    if (rect === null) {
      onSelect([]);
      return;
    }

    const selectedTiles: TileAsset[] = [];

    for (let row = rect.minRow; row <= rect.maxRow; ++row) {
      for (let col = rect.minCol; col <= rect.maxCol; ++col) {
        selectedTiles.push({
          type: PaintType.TILE,
          ref: {
            tilesetId: tileset.id,
            x: col * projectState.tileSize,
            y: row * projectState.tileSize,
          },
        });
      }
    }

    onSelect(selectedTiles);
  };

  const setInitialSelection = (tiles: Tile[]) => {
    if (tiles.length === 0 || !tilemapViewport) return;

    // Convert tiles to cells
    const cells: Cell[] = tiles.map(tile => ({
      col: tile.x / projectState.tileSize,
      row: tile.y / projectState.tileSize
    }));

    // Set the selection on the viewport
    tilemapViewport.setSelection(cells);
  };

  const handleCanvasRightClick = (e: Event) => {
    const { row, col } = (e as TilemapViewportRightClickEvent).cell;

    attributesTile = {
      tilesetId: tileset.id,
      x: col * projectState.tileSize,
      y: row * projectState.tileSize,
    };
    attributesDialogIsOpen = true;
  };
</script>

<div bind:this={container}></div>

{#if attributesDialogIsOpen && attributesTile !== null}
  <TileAttributesDialog
    bind:open={attributesDialogIsOpen}
    tile={attributesTile}
  />
{/if}

<style>
  div {
    width: 100%;
    height: 100%;
    display: block;
    background-color: var(--color-0);
  }
</style>
