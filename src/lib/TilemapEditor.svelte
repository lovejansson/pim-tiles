<script lang="ts">
  import { guiState, projectState, HistoryStack } from "../state.svelte";
  import { PaintType, Tool, type Cell, type PaintedTile } from "../types";
  import CanvasViewport, {
    CanvasViewPortMousePosEvent,
    CanvasViewPortPaintEvent,
    CanvasViewPortRightClickEvent,
    CanvasViewPortSelectEvent,
    CanvasViewPortSelectionDragEvent,
  } from "./CanvasViewPort";
  import TileAttributesDialog from "./TileAttributesDialog.svelte";
  import { onMount } from "svelte";

  const { tileSize, layers, areas, tilesets } = $derived(projectState);
  const { tilemapEditorState, gridColor, showGrid } = $derived(guiState);

  let tileAttributesDialogIsOpen = $state(false);
  let tileAttributesCell: Cell = $state({ row: 0, col: 0 });

  let ctrlKeyIsDown = false;

  const dirtyTiles = new Set();
  let selectedTiles: { org: Cell; curr: Cell; tile: PaintedTile }[] = [];

  let canvas!: HTMLCanvasElement;
  let canvasView!: CanvasViewport;

  onMount(() => {
    if (canvas === undefined) return;

    canvasView = new CanvasViewport(canvas, {
      zoom: { min: 0.5, max: 4.0, speed: 0.375 },
      pan: { key: " " },
      grid: {
        tileSize: tileSize,
        gridColor: gridColor,
        showGrid: showGrid,
      },
      drawLoop: true,
      draw: draw,
      defaultCursor: "crosshair",
      selection: tilemapEditorState.selectedTool === Tool.SELECT,
    });

    canvasView.addEventListener("paint", handleCanvasPaint);

    canvasView.addEventListener("select", handleCanvasSelection);

    canvasView.addEventListener("selection-drag", handleCanvasSelectionDrag);

    canvasView.addEventListener("right-click", handleCanvasRightClick);

    canvasView.addEventListener("mouse-pos", handleMousePosChange);

    canvasView.init();
  });

  $effect(() => {
    canvasView.tileSize = tileSize;
  });

  $effect(() => {
    canvasView.showGrid = showGrid;
  });

  $effect(() => {
    canvasView.gridColor = gridColor;
  });

  $effect(() => {
    if (tilemapEditorState.selectedTool === Tool.SELECT) {
      canvasView.enableSelection();
    } else {
      canvasView.disabledSelection();
    }
  });

  const handleCanvasSelection = (e: Event) => {
    const selection = (e as CanvasViewPortSelectEvent).selection;

    selectedTiles = [];

    if (selection !== null) {
      const minX = Math.min(selection.x1, selection.x2);
      const maxX = Math.max(selection.x1, selection.x2);
      const minY = Math.min(selection.y1, selection.y2);
      const maxY = Math.max(selection.y1, selection.y2);

      let row = 0;
      let col = 0;

      for (let y = minY; y < maxY; y += tileSize) {
        for (let x = minX; x < maxX; x += tileSize) {
          row = Math.floor(y / tileSize);
          col = Math.floor(x / tileSize);

          selectedTiles.push({
            org: { row, col },
            curr: { row, col },
            tile: layers.getTileAt(
              row,
              col,
              tilemapEditorState.selectedLayer,
            ) as PaintedTile,
          });
        }
      }
    }
  };

  const handleCanvasRightClick = (e: Event) => {
    const pos = (e as CanvasViewPortRightClickEvent).pos;

    const row = Math.floor(pos.y / tileSize);
    const col = Math.floor(pos.x / tileSize);

    tileAttributesCell = { row, col };
    tileAttributesDialogIsOpen = true;
  };

  const handleCanvasSelectionDrag = (e: Event) => {
    const delta = (e as CanvasViewPortSelectionDragEvent).delta;

    const rowDelta = delta.y / tileSize;
    const colDelta = delta.x / tileSize;

    for (const t of selectedTiles) {
      t.curr.row += rowDelta;
      t.curr.col += colDelta;
    }
  };

  const handleMousePosChange = (e: Event) => {
    const pos = (e as CanvasViewPortRightClickEvent).pos;
    const row = Math.floor(pos.y / tileSize);
    const col = Math.floor(pos.x / tileSize);

    guiState.mouseTilePos = { row, col };
  };

  const handleCanvasPaint = (e: Event) => {
    const pos = (e as CanvasViewPortPaintEvent).pos;

    const col = Math.floor(pos.x / tileSize);
    const row = Math.floor(pos.y / tileSize);

    switch (tilemapEditorState.type) {
      case PaintType.TILE:
        if (tilemapEditorState.fillToolIsActive) break;

        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT:
            if (tilemapEditorState.selectedAsset !== null) {
              layers.paintTiles(
                row,
                col,
                tilemapEditorState.selectedLayer,
                tilemapEditorState.selectedAsset,
              );

              const minX = Math.min(
                ...tilemapEditorState.selectedAsset.map(
                  (t) => t.ref.tile.tilesetPos.x,
                ),
              );
              const minY = Math.min(
                ...tilemapEditorState.selectedAsset.map(
                  (t) => t.ref.tile.tilesetPos.y,
                ),
              );

              for (const t of tilemapEditorState.selectedAsset) {
                const r =
                  row + Math.floor((t.ref.tile.tilesetPos.y - minY) / tileSize);
                const c =
                  col + Math.floor((t.ref.tile.tilesetPos.x - minX) / tileSize);
                    dirtyTiles.add(`${r}:${c}`);
              }
            }

            break;
          case Tool.ERASE:
            layers.eraseTile(row, col, tilemapEditorState.selectedLayer);
            break;
        }


        break;
      case PaintType.AUTO_TILE:
        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT: {
            if (tilemapEditorState.selectedAsset !== null) {
              layers.paintWithAutoTile(
                row,
                col,
                tilemapEditorState.selectedAsset.ref.id,
                tilemapEditorState.selectedLayer,
              );
            }

            break;
          }
          case Tool.ERASE: {
            layers.eraseAutoTile(row, col, tilemapEditorState.selectedLayer);

            break;
          }
        }
        break;
      case PaintType.AREA:
        if (tilemapEditorState.fillToolIsActive) break;

        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT:
            if (tilemapEditorState.selectedAsset !== null) {
              layers.paintTile(
                row,
                col,
                tilemapEditorState.selectedLayer,
                tilemapEditorState.selectedAsset,
              );
            }
            break;
          case Tool.ERASE:
            layers.eraseTile(row, col, tilemapEditorState.selectedLayer);

            break;
        }
        break;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "meta" || e.key.toLowerCase() === "control")
      ctrlKeyIsDown = false;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement | null)?.localName === "sl-input") return;

    if (e.ctrlKey || e.metaKey) ctrlKeyIsDown = true;

    switch (e.key.toLowerCase()) {
      case "z":
        ctrlKeyIsDown && HistoryStack.undo();
        break;
      case "y":
        ctrlKeyIsDown && HistoryStack.redo();
        break;
    }
  };

  function draw(ctx: CanvasRenderingContext2D, clear: boolean) {
    for (const layer of layers.get()) {
      if (guiState.visibleLayers[layer.id]) {
        switch (layer.type) {
          case PaintType.TILE:
            for (const [key, paintedTile] of layer.data) {
              const tileset = tilesets.getTileset(
                paintedTile.ref.tile.tilesetId,
              );

              const [row, col] = key.split(":").map(Number);

              if (clear || dirtyTiles.has(key)) {
           
                ctx.drawImage(
                  tileset.spritesheet,
                  paintedTile.ref.tile.tilesetPos.x,
                  paintedTile.ref.tile.tilesetPos.y,
                  tileSize,
                  tileSize,
                  col * tileSize,
                  row * tileSize,
                  tileSize,
                  tileSize,
                );
                dirtyTiles.delete(key);
              }
            }

            break;
          case PaintType.AUTO_TILE:
            for (const [key, autoTileAsset] of layer.data) {
              const [row, col] = key.split(":").map(Number);
              const tileset = tilesets.getTileset(
                autoTileAsset.tile.ref.tile.tilesetId,
              );
              if (clear || dirtyTiles.has(key)) {
                ctx.drawImage(
                  tileset.spritesheet,
                  autoTileAsset.tile.ref.tile.tilesetPos.x,
                  autoTileAsset.tile.ref.tile.tilesetPos.y,
                  tileSize,
                  tileSize,
                  col * tileSize,
                  row * tileSize,
                  tileSize,
                  tileSize,
                );
                dirtyTiles.delete(key);
              }
            }
            break;
          case PaintType.AREA:
            ctx.lineWidth = 2;

            for (const [key, areaAsset] of layer.data) {
              const area = areas.getArea(areaAsset.ref.id);

              const [row, col] = key.split(":").map(Number);

              if (clear || dirtyTiles.has(key)) {
                ctx.strokeStyle = area.color;

                ctx.strokeRect(
                  col * tileSize,
                  row * tileSize,
                  tileSize,
                  tileSize,
                );
                dirtyTiles.delete(key);
              }
            }

            break;
        }
      }

      // if (tilemapEditorState.type === PaintType.TILE) {
      //   for (const t of selectedTiles) {
      //     if (t.tile) {
      //       const tileset = tilesets.getTileset(
      //         t.tile.ref.tile.tilesetId,
      //       );

      //       ctx.drawImage(
      //         tileset.spritesheet,
      //         t.tile.ref.tile.tilesetPos.x,
      //         t.tile.ref.tile.tilesetPos.y,
      //         tileSize,
      //         tileSize,
      //         t.curr.col * tileSize,
      //         t.curr.row * tileSize,
      //         tileSize,
      //         tileSize,
      //       );

      //       // ctx.drawImage(
      //       //   tileset.spritesheet,
      //       //   t.tile.ref.tile.offsetPos.x,
      //       //   t.tile.ref.tile.offsetPos.y,
      //       //   tileSize,
      //       //   tileSize,
      //       //   t.curr.col * tileSize,
      //       //   t.curr.row * tileSize,
      //       //   tileSize,
      //       //   tileSize,
      //       // );
      //     }
      //   }
      // }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<section id="tilemap-editor">
  <canvas bind:this={canvas}></canvas>
</section>

<TileAttributesDialog
  bind:open={tileAttributesDialogIsOpen}
  cell={tileAttributesCell}
/>

<style lang="postcss">
  #tilemap-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  canvas {
    flex: 1;
    background-color: var(--color-0);
    image-rendering: pixelated;
  }
</style>
