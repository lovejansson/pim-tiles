<script lang="ts">
  import { onMount } from "svelte";
  import {
    PaintType,
    type Cell,
    type Tile,
    type TileAsset,
    type Tileset,
  } from "../../types";
  import { guiState, projectState } from "../../state.svelte";
  import TilemapViewport, {
    TilemapViewportRightClickEvent,
    TilemapViewportSelectionChangeEvent,
  } from "../TilemapViewport";
  import TileAttributesDialog from "../attributes/TileAttributesDialog.svelte";

  type TilesCanvasProps = {
    tileset: Tileset;
    multipleSelection?: boolean;
    onSelect: (selectedTiles: TileAsset[]) => void;
  };

  let { tileset, onSelect, multipleSelection }: TilesCanvasProps = $props();

  let container!: HTMLDivElement;
  let tilemapViewport!: TilemapViewport;

  let attributesDialogIsOpen = $state(false);

  let attributesTile: Tile | null = $state(null);

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

      tilemapViewport.addEventListener("right-click", handleCanvasRightClick);
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

  const handleCanvasRightClick = (e: Event) => {
    const { row, col } = (e as TilemapViewportRightClickEvent).cell;

    attributesTile = {
      tilesetId: tileset.id,
      tilesetPos: {
        x: col * projectState.tileSize,
        y: row * projectState.tileSize,
      },
    };
    attributesDialogIsOpen = true;
  };

  function draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(tileset.spritesheet, 0, 0);
  }
</script>

<div bind:this={container}></div>

{#if attributesTile !== null}
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
