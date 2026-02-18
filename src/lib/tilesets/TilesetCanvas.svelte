<script lang="ts">
  import { onMount } from "svelte";
  import { PaintType, type TileAsset, type Tileset } from "../../types";
  import { guiState, projectState } from "../../state.svelte";
  import CanvasViewport, {
    CanvasViewPortSelectEvent,
    type SelectionRect,
  } from "../CanvasViewPort";

  type TilesCanvasProps = {
    tileset: Tileset;
    multipleSelection?: boolean;
    onSelect: (selectedTiles: TileAsset[]) => void;
  };

  let { tileset, onSelect, multipleSelection }: TilesCanvasProps = $props();

  let container!: HTMLDivElement;
  let canvasView!: CanvasViewport;

  onMount(() => {
    if (container === undefined) return;

    canvasView = new CanvasViewport(container, {
      zoom: { min: 0.5, max: 4.0, speed: 0.375 },
      pan: { key: " " },
      grid: {
        tileSize: projectState.tileSize,
        gridColor: guiState.gridColor,
        showGrid: guiState.showGrid,
      },
      drawLoop: true,
      draw: draw,
      defaultCursor: "crosshair",
      selection: multipleSelection,

    });

    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === 0) return;
      canvasView.width = entry.contentRect.width;
      canvasView.height = entry.contentRect.height;
      ro.disconnect();
      canvasView.init();

      if (multipleSelection) {
        canvasView.addEventListener("select", (e) => {
          updateSelectedTiles((e as CanvasViewPortSelectEvent).selection);
        });
      }
    });

    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  });

  $effect(() => {
    canvasView.tileSize = projectState.tileSize;
  });

  $effect(() => {
    canvasView.showGrid = guiState.showGrid;
  });

  $effect(() => {
    canvasView.gridColor = guiState.gridColor;
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
