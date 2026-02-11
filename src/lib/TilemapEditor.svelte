<script lang="ts">
  import { guiState, projectState, HistoryStack } from "../state.svelte";
  import { PaintType, Tool, type Cell, type PaintedTile } from "../types";
  import CanvasViewport, {
    CanvasViewPortPaintEvent,
    CanvasViewPortRightClickEvent,
    CanvasViewPortSelectEvent,
    CanvasViewPortSelectionDragEvent,
  } from "./CanvasViewPort";
  import TileAttributesDialog from "./TileAttributesDialog.svelte";

  const { tileSize } = $derived(projectState);
  const { tilemapEditorState } = $derived(guiState);

  let tileAttributesDialogIsOpen = $state(false);
  let tileAttributesCell: Cell = $state({ row: 0, col: 0 });

  let ctrlKeyIsDown = false;

  let mouseTileStart = { row: 0, col: 0 };

  let selectedTiles: { org: Cell; curr: Cell; tile: PaintedTile }[] = [];

  let canvasEl!: HTMLCanvasElement;
  let ctx!: CanvasRenderingContext2D;

  let canvasView!: CanvasViewport;

  const initCanvas = (canvas: HTMLCanvasElement) => {
    canvasEl = canvas;
    ctx = canvasEl.getContext("2d")!;
    canvasEl.width = canvasEl.clientWidth;
    canvasEl.height = canvasEl.clientHeight;

    canvasView = new CanvasViewport(canvas, {
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
      selection: guiState.tilemapEditorState.selectedTool === Tool.SELECT,
    });

    canvasView.addEventListener("paint", handleCanvasPaint);

    canvasView.addEventListener("select", handleCanvasSelection);

    canvasView.addEventListener("selection-drag", handleCanvasSelectionDrag);

    canvasView.addEventListener("right-click", handleCanvasRightClick);

    canvasView.init();
  };

  $effect(() => {
    canvasView.tileSize = projectState.tileSize;
  });

  $effect(() => {
    canvasView.showGrid = guiState.showGrid;
  });

  $effect(() => {
    canvasView.gridColor = guiState.gridColor;
  });

  $effect(() => {
    if (guiState.tilemapEditorState.selectedTool === Tool.SELECT) {
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
            tile: projectState.layers.getTileAt(
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
    console.log("JE", tileAttributesDialogIsOpen)
    const pos = (e as CanvasViewPortRightClickEvent).pos;

    const row = Math.floor(pos.y / projectState.tileSize);
    const col = Math.floor(pos.x / projectState.tileSize);

    tileAttributesCell = { row, col };
    tileAttributesDialogIsOpen = true;
  };

  const handleCanvasSelectionDrag = (e: Event) => {
    const delta = (e as CanvasViewPortSelectionDragEvent).delta;

    const rowDelta = delta.y / projectState.tileSize;
    const colDelta = delta.x / projectState.tileSize;

    for (const t of selectedTiles) {
      t.curr.row += rowDelta;
      t.curr.col += colDelta;
    }
  };

  const handleCanvasPaint = (e: Event) => {
    const pos = (e as CanvasViewPortPaintEvent).pos;

    const col = Math.floor(pos.x / tileSize);
    const row = Math.floor(pos.y / tileSize);

    guiState.mouseTile.row = row;
    guiState.mouseTile.col = col;

    guiState.mouseTileDelta.row = Math.abs(row - mouseTileStart.row);
    guiState.mouseTileDelta.col = Math.abs(col - mouseTileStart.col);

    switch (tilemapEditorState.type) {
      case PaintType.TILE:
        if (tilemapEditorState.fillToolIsActive) break;

        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT:
            if (tilemapEditorState.selectedAsset !== null) {
              projectState.layers.paintTiles(
                row,
                col,
                tilemapEditorState.selectedLayer,
                tilemapEditorState.selectedAsset,
              );
            }
            break;
          case Tool.ERASE:
            projectState.layers.eraseTile(
              row,
              col,
              tilemapEditorState.selectedLayer,
            );
            break;
        }

        break;
      case PaintType.AUTO_TILE:
        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT: {
            if (tilemapEditorState.selectedAsset !== null) {
              projectState.layers.paintWithAutoTile(
                row,
                col,
                tilemapEditorState.selectedAsset.ref.id,
                tilemapEditorState.selectedLayer,
              );
            }

            break;
          }
          case Tool.ERASE: {
            projectState.layers.eraseAutoTile(
              row,
              col,
              tilemapEditorState.selectedLayer,
            );

            break;
          }
        }
        break;
      case PaintType.AREA:
        if (tilemapEditorState.fillToolIsActive) break;

        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT:
            if (tilemapEditorState.selectedAsset !== null) {
              projectState.layers.paintTile(
                row,
                col,
                tilemapEditorState.selectedLayer,
                tilemapEditorState.selectedAsset,
              );
            }
            break;
          case Tool.ERASE:
            projectState.layers.eraseTile(
              row,
              col,
              tilemapEditorState.selectedLayer,
            );

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

  function draw(ctx: CanvasRenderingContext2D) {
    for (const layer of projectState.layers.get()) {
      if (guiState.visibleLayers[layer.id]) {
        switch (layer.type) {
          case PaintType.TILE:
            for (const [key, paintedTile] of layer.data) {
              const tileset = projectState.tilesets.getTileset(
                paintedTile.ref.tile.tilesetId,
              );

              const [row, col] = key.split(":").map(Number);

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
            }

            break;
          case PaintType.AUTO_TILE:
            for (const [key, autoTileAsset] of layer.data) {
              const [row, col] = key.split(":").map(Number);
              const tileset = projectState.tilesets.getTileset(
                autoTileAsset.tile.ref.tile.tilesetId,
              );

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
            }
            break;
          case PaintType.AREA:
            ctx.lineWidth = 2;

            for (const [key, areaAsset] of layer.data) {
              const area = projectState.areas.getArea(areaAsset.ref.id);

              const [row, col] = key.split(":").map(Number);

              ctx.strokeStyle = area.color;

              ctx.strokeRect(
                col * tileSize,
                row * tileSize,
                tileSize,
                tileSize,
              );
            }

            break;
        }
      }

      if (tilemapEditorState.type === PaintType.TILE) {
        for (const t of selectedTiles) {
          if (t.tile) {
            const tileset = projectState.tilesets.getTileset(
              t.tile.ref.tile.tilesetId,
            );

            ctx.drawImage(
              tileset.spritesheet,
              t.tile.ref.tile.tilesetPos.x,
              t.tile.ref.tile.tilesetPos.y,
              tileSize,
              tileSize,
              t.curr.col * tileSize,
              t.curr.row * tileSize,
              tileSize,
              tileSize,
            );

            // ctx.drawImage(
            //   tileset.spritesheet,
            //   t.tile.ref.tile.offsetPos.x,
            //   t.tile.ref.tile.offsetPos.y,
            //   tileSize,
            //   tileSize,
            //   t.curr.col * tileSize,
            //   t.curr.row * tileSize,
            //   tileSize,
            //   tileSize,
            // );
          }
        }
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<section id="tilemap-editor">
  <canvas {@attach initCanvas}></canvas>
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
