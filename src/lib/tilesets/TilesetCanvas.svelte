<script lang="ts">
  import { onMount } from "svelte";
  import { PaintType, type TileAsset, type Tileset } from "../../types";
  import { guiState, projectState } from "../../state.svelte";
  import TilemapViewport, {
    TilemapViewportSelectEvent,
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
        height: tileset.height
      },
      draw: draw,
      defaultCursor: "crosshair",
      selection: multipleSelection,

    });

    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === 0) return;
      tilemapViewport.width = entry.contentRect.width;
      tilemapViewport.height = entry.contentRect.height;
      ro.disconnect();
      tilemapViewport.init();

      if (multipleSelection) {
        tilemapViewport.addEventListener("select", (e) => {
          updateSelectedTiles((e as TilemapViewportSelectEvent).selection);
        });
      }
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

  const updateSelectedTiles = (selection: SelectionRect | null) => {
    if (selection !== null) {
      const selectedTiles: TileAsset[] = [];

      const minX = Math.min(selection.x1, selection.x2);
      const maxX = Math.max(selection.x1, selection.x2);
      const minY = Math.min(selection.y1, selection.y2);
      const maxY = Math.max(selection.y1, selection.y2);

      for (let y = minY; y < maxY; y += projectState.tileSize) {
        for (let x = minX; x < maxX; x += projectState.tileSize) {
          selectedTiles.push({
            type: PaintType.TILE,
            ref: {
              tile: { tilesetId: tileset.id, tilesetPos: { x, y } },
            },
          });
        }
      }

      onSelect(selectedTiles);
    }
  };

  function draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(tileset.spritesheet,0, 0);
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
