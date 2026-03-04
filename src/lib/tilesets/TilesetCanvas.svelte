<script lang="ts">
  import { onMount } from "svelte";
  import {
    PaintType,
    type Cell,
    type TileAsset,
    type Tileset,
  } from "../../types";
  import { guiState, projectState } from "../../state.svelte";
  import TilemapViewport, {
    TilemapViewportSelectionChangeEvent,
    type SelectionRect,
  } from "../TilemapViewport";

  type TilesCanvasProps = {
    tileset: Tileset;
    multipleSelection?: boolean;
    onSelect: (selectedTiles: TileAsset[]) => void;
  };

  let { tileset, onSelect, multipleSelection }: TilesCanvasProps = $props();

  let container!: HTMLDivElement;
  let tilemapViewport!: TilemapViewport;

  onMount(() => {
    if (container === undefined) return;

    tilemapViewport = new TilemapViewport(container, {
      zoom: { min: 0.5, max: 4.0, speed: 0.375 },
      pan: { key: " " },
      grid: {
        tileSize: projectState.tileSize,
        gridColor: guiState.gridColor,
        showGrid: guiState.showGrid,
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
        updateSelectedTiles((e as TilemapViewportSelectionChangeEvent).tiles);
      });
    });

    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  });

  $effect(() => {
    tilemapViewport.tileSize = projectState.tileSize;
  });

  $effect(() => {
    tilemapViewport.showGrid = guiState.showGrid;
  });

  $effect(() => {
    tilemapViewport.gridColor = guiState.gridColor;
  });

  const updateSelectedTiles = (tiles: Cell[] | null) => {
    if (tiles !== null) {
      const selectedTiles: TileAsset[] = [];

      for (const t of tiles) {
        selectedTiles.push({
          type: PaintType.TILE,
          ref: {
            tilesetId: tileset.id,
            tilesetPos: {
              x: t.col * projectState.tileSize,
              y: t.row * projectState.tileSize,
            },
          },
        });
      }

      onSelect(selectedTiles);
    }
  };

  function draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(tileset.spritesheet, 0, 0);
  }
</script>

<div bind:this={container}></div>

<style>
  div {
    width: 100%;
    height: 100%;
    display: block;
    background-color: var(--color-0);
  }
</style>
