<script lang="ts">
  import { guiState, projectState, HistoryStack } from "../state.svelte";
  import { PaintType, Tool, type Cell, type PaintedTile } from "../types";
  import TilemapViewport, {
    TilemapViewportPaintEvent,
    TilemapViewportRightClickEvent,
    TilemapViewportSelectEvent,
    TilemapViewportSelectionDragEvent,
  } from "./TilemapViewport";
  import TileAttributesDialog from "./TileAttributesDialog.svelte";
  import { onMount } from "svelte";
  const { tileSize, layers, areas, tilesets } = $derived(projectState);
  const { tilemapEditorState, gridColor, showGrid } = $derived(guiState);

  let tileAttributesDialogIsOpen = $state(false);
  let tileAttributesCell: Cell = $state({ row: 0, col: 0 });

  let ctrlKeyIsDown = false;

  const dirtyTiles = new Set();
  let selectedTiles: { org: Cell; curr: Cell; tile: PaintedTile }[] = [];

  let container!: HTMLElement;
  let tilemapViewport!: TilemapViewport;

  let layerCache: Map<
    string,
    { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
  > = new Map();

  $effect(() => {
    // Sync layerCache with layers

    const addedLayers = projectState.layers
      .get()
      .filter((l) => !layerCache.has(l.id));
    const deletedLayers = layerCache
      .keys()
      .filter(
        (k) => projectState.layers.get().find((l) => l.id === k) === undefined,
      );

    for (const l of addedLayers) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx === null) throw new Error("Ctx is null");

      canvas.width = projectState.width;
      canvas.height = projectState.height;
      layerCache.set(l.id, { canvas, ctx });
    }

    for (const l of deletedLayers) {
      layerCache.delete(l);
    }
  });

  onMount(() => {
    if (container === undefined) return;

    tilemapViewport = new TilemapViewport(container, {
      zoom: { min: 0.75, max: 5.0, speed: 0.375 },
      pan: { key: " " },
      grid: {
        tileSize: tileSize,
        gridColor: gridColor,
        showGrid: showGrid,
        width: projectState.width,
        height: projectState.height,
      },
      draw: draw,
      defaultCursor: "crosshair",
      selection: tilemapEditorState.selectedTool === Tool.SELECT,
    });

    tilemapViewport.addEventListener("paint", handleCanvasPaint);

    tilemapViewport.addEventListener("select", handleCanvasSelection);

    tilemapViewport.addEventListener(
      "selection-drag",
      handleCanvasSelectionDrag,
    );

    tilemapViewport.addEventListener("right-click", handleCanvasRightClick);

    tilemapViewport.addEventListener("mouse-pos", handleMousePosChange);

    tilemapViewport.init(true);
  });

  $effect(() => {
    tilemapViewport.tileSize = tileSize;
  });

  $effect(() => {
    tilemapViewport.showGrid = showGrid;
  });

  $effect(() => {
    tilemapViewport.gridColor = gridColor;
  });

  $effect(() => {
    if (tilemapEditorState.selectedTool === Tool.SELECT) {
      tilemapViewport.enableSelection();
    } else {
      tilemapViewport.disabledSelection();
    }
  });

  const handleCanvasSelection = (e: Event) => {
    const selection = (e as TilemapViewportSelectEvent).selection;

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
    const pos = (e as TilemapViewportRightClickEvent).pos;

    const row = Math.floor(pos.y / tileSize);
    const col = Math.floor(pos.x / tileSize);

    tileAttributesCell = { row, col };
    tileAttributesDialogIsOpen = true;
  };

  const handleCanvasSelectionDrag = (e: Event) => {
    const delta = (e as TilemapViewportSelectionDragEvent).delta;

    const rowDelta = delta.y / tileSize;
    const colDelta = delta.x / tileSize;

    for (const t of selectedTiles) {
      t.curr.row += rowDelta;
      t.curr.col += colDelta;
    }
  };

  const handleMousePosChange = (e: Event) => {
    const pos = (e as TilemapViewportRightClickEvent).pos;
    const row = Math.floor(pos.y / tileSize);
    const col = Math.floor(pos.x / tileSize);

    guiState.mouseTilePos = { row, col };
  };

  const handleCanvasPaint = (e: Event) => {
    const { row, col } = (e as TilemapViewportPaintEvent).cell;

    if (guiState.visibleLayers[tilemapEditorState.selectedLayer]) {
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
                    row +
                    Math.floor((t.ref.tile.tilesetPos.y - minY) / tileSize);
                  const c =
                    col +
                    Math.floor((t.ref.tile.tilesetPos.x - minX) / tileSize);
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

                dirtyTiles.add(`${row}:${col}`);
              }
              break;
            case Tool.ERASE:
              layers.eraseTile(row, col, tilemapEditorState.selectedLayer);

              break;
          }
          break;
      }
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
    for (const layer of layers.get()) {
      const cached = layerCache.get(layer.id);

      if (cached === undefined)
        throw new Error("Cached canvas for layer doesn't exist!");

      if (dirtyTiles.size > 0) {
        switch (layer.type) {
          case PaintType.TILE:
            for (const [key, paintedTile] of layer.data) {
              const tileset = tilesets.getTileset(
                paintedTile.ref.tile.tilesetId,
              );

              const [row, col] = key.split(":").map(Number);

              if (dirtyTiles.has(key)) {
                cached.ctx.drawImage(
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
            }

            break;
          case PaintType.AUTO_TILE:
            for (const [key, autoTileAsset] of layer.data) {
              const [row, col] = key.split(":").map(Number);
              const tileset = tilesets.getTileset(
                autoTileAsset.tile.ref.tile.tilesetId,
              );

              if (dirtyTiles.has(key)) {
                cached.ctx.drawImage(
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
            }
            break;
          case PaintType.AREA:
          

            for (const [key, areaAsset] of layer.data) {
              const area = areas.getArea(areaAsset.ref.id);

              const [row, col] = key.split(":").map(Number);

                cached.ctx.lineWidth = 1;
                cached.ctx.strokeStyle = area.color;

              if (dirtyTiles.has(key)) {
                cached.ctx.clearRect(
                  col * tileSize,
                  row * tileSize,
                  tileSize,
                  tileSize,
                );

                cached.ctx.strokeRect( col * tileSize + 4 - 0.5,
                  row * tileSize + 4 - 0.5,
                  tileSize - 8,
                  tileSize - 8,)


        
              }
            }

            break;
        }
      }

      if (guiState.visibleLayers[layer.id]) {
        ctx.drawImage(cached.canvas, 0, 0);
      }
    }
    dirtyTiles.clear();
  }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<section bind:this={container} id="tilemap-editor"></section>

<TileAttributesDialog
  bind:open={tileAttributesDialogIsOpen}
  cell={tileAttributesCell}
/>

<style lang="postcss">
  #tilemap-editor {
    display: flex;
    flex-direction: column;
    background: var(--color-0);
    flex-grow: 1;
    overflow-x: hidden;
  }
</style>
