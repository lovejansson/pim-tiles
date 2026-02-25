<script lang="ts">
  import { guiState, projectState, HistoryStack } from "../state.svelte";
  import {
    PaintType,
    Tool,
    type Cell,
    type PaintedArea,
    type PaintedAsset,
    type PaintedAutoTile,
    type PaintedTile,
  } from "../types";
  import TilemapViewport, {
    TilemapViewportMousePosEvent,
    TilemapViewportPaintEvent,
    TilemapViewportRightClickEvent,
    TilemapViewportSelectionChangeEvent,
    TilemapViewportSelectionMoveEvent,
  } from "./TilemapViewport";
  import TileAttributesDialog from "./TileAttributesDialog.svelte";
  import { onMount } from "svelte";
  const { tileSize } = $derived(projectState);
  const { tilemapEditorState, gridColor, showGrid } = $derived(guiState);

  let tileAttributesDialogIsOpen = $state(false);
  let tileAttributesCell: Cell = $state({ row: 0, col: 0 });

  let ctrlKeyIsDown = false;

  const dirtyTiles: Cell[] = [];

  let selectedTiles: { org: Cell; curr: Cell; tile: PaintedAsset }[] = [];

  let container!: HTMLElement;
  let tilemapViewport!: TilemapViewport;

  let canvasCache: Map<
    string,
    { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
  > = new Map();

  const clearCache = () => {
    canvasCache.values().forEach((c) => {
      c.canvas.width = projectState.width;
      c.canvas.height = projectState.height;
      c.ctx.imageSmoothingEnabled = false;
    });
  };

  $effect(() => {
    // Reset cache whenever dimensions of project change
    if (
      projectState.width ||
      projectState.height ||
      projectState.tileSize ||
      projectState.getAutoTiles()
    ) {
      clearCache();
    }
  });

  $effect(() => {
    // Sync canvasCache with update layers

    const addedLayers = projectState
      .getLayers()
      .filter((l) => !canvasCache.has(l.id));

    const deletedLayers = Array.from(canvasCache.keys()).filter(
      (k) => projectState.getLayers().find((l) => l.id === k) === undefined,
    );

    for (const l of addedLayers) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx === null) throw new Error("Ctx is null");

      canvas.width = projectState.width;
      canvas.height = projectState.height;
      canvasCache.set(l.id, { canvas, ctx });
    }

    for (const l of deletedLayers) {
      canvasCache.delete(l);
    }
  });

  onMount(() => {
    if (container === undefined) return;

    tilemapViewport = new TilemapViewport(container, {
      zoom: { min: 0.25, max: 5.0, speed: 0.125 },
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
      selection: {
        isActive:
          tilemapEditorState.selectedTool === Tool.SELECT &&
          tilemapEditorState.type === PaintType.TILE,
        move: true,
        copy: true,
        delete: true,
      },
    });

    tilemapViewport.addEventListener("paint", handleCanvasPaint);

    tilemapViewport.addEventListener("selection-change", handleSelectionChange);

    tilemapViewport.addEventListener("selection-delete", handleSelectionDelete);

    tilemapViewport.addEventListener("selection-copy", handleSelectionCopy);

    tilemapViewport.addEventListener("selection-move", handleSelectionMove);

    tilemapViewport.addEventListener(
      "selection-move-end",
      handleSelectionMoveEnd,
    );

    tilemapViewport.addEventListener("right-click", handleCanvasRightClick);

    tilemapViewport.addEventListener("mouse-pos", handleMousePosChange);

    tilemapViewport.init(true);
  });

  $effect(() => {
    tilemapViewport.tileSize = tileSize;
    tilemapViewport.gridWidth = projectState.width;
    tilemapViewport.gridHeight = projectState.height;
    tilemapViewport.gridColor = gridColor;
  });

  $effect(() => {
    tilemapViewport.showGrid = showGrid;
  });

  $effect(() => {
    if (
      tilemapEditorState.selectedTool === Tool.SELECT &&
      tilemapEditorState.type === PaintType.TILE
    ) {
      tilemapViewport.enableSelection();
    } else {
      tilemapViewport.disabledSelection();
    }
  });

  const handleSelectionChange = (e: Event) => {
    // If we have previously selected tiles we will paint them back to the tilemap wherever they are currently placed
    if (selectedTiles.length > 0) {
      for (const t of selectedTiles) {
        if (t.tile.type !== PaintType.TILE)
          throw new Error("Selection only implemented for tile layers");

        projectState.paintTile(
          t.curr.row,
          t.curr.col,
          tilemapEditorState.selectedLayer,
          t.tile,
        );
        if (
          t.curr.row <= projectState.rows &&
          t.curr.col <= projectState.cols
        ) {
          dirtyTiles.push({ ...t.curr });
        }
      }
    }

    const selection = (e as TilemapViewportSelectionChangeEvent).selection;

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

          const tile = projectState.getTileAt(
            row,
            col,
            tilemapEditorState.selectedLayer,
          );

          if (tile !== null) {
            if (tile.type !== PaintType.TILE)
              throw new Error("Selection only implemented for tile layers");

            projectState.eraseTile(row, col, tilemapEditorState.selectedLayer);
            dirtyTiles.push({ row, col });

            selectedTiles.push({
              org: { row, col },
              curr: { row, col },
              tile,
            });
          }
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

  const handleSelectionMove = (e: Event) => {
    const delta = (e as TilemapViewportSelectionMoveEvent).delta;

    const rowDelta = delta.y / tileSize;
    const colDelta = delta.x / tileSize;

    for (const t of selectedTiles) {
      t.curr.row = t.org.row + rowDelta;
      t.curr.col = t.org.col + colDelta;
    }
  };

  const handleSelectionMoveEnd = () => {
    for (const t of selectedTiles) {
      t.org.row = t.curr.row;
      t.org.col = t.curr.col;
    }
  };

  const handleSelectionDelete = () => {
    selectedTiles = [];
  };

  const handleSelectionCopy = () => {
    // If we have selected tiles they will be copied, i.e. painted where they are currently placed
    if (selectedTiles.length > 0) {
      for (const t of selectedTiles) {
        if (t.tile.type !== PaintType.TILE)
          throw new Error("Selection only implemented for tile layers");

        projectState.paintTile(
          t.curr.row,
          t.curr.col,
          tilemapEditorState.selectedLayer,
          t.tile,
        );
        if (
          t.curr.row <= projectState.rows &&
          t.curr.col <= projectState.cols
        ) {
          dirtyTiles.push({ ...t.curr });
        }
      }
    }
  };

  const handleMousePosChange = (e: Event) => {
    const cell = (e as TilemapViewportMousePosEvent).cell;

    guiState.mouseTilePos = cell;
  };

  const handleCanvasPaint = (e: Event) => {
    const { row, col } = (e as TilemapViewportPaintEvent).cell;

    console.log("PAINT");

    if (guiState.visibleLayers[tilemapEditorState.selectedLayer]) {
      switch (tilemapEditorState.type) {
        case PaintType.TILE:
          if (tilemapEditorState.fillToolIsActive) {
            switch (tilemapEditorState.selectedTool) {
              case Tool.PAINT:
                if (tilemapEditorState.selectedAsset !== null) {
                  const filledTiles = projectState.floodFill(
                    tilemapEditorState.selectedLayer,
                    row,
                    col,
                    tilemapEditorState.selectedAsset[0], // Flood fill only takes first tile into account
                  );

                  for (const t of filledTiles) {
                    dirtyTiles.push({ ...t });
                  }
                }
                break;
              case Tool.ERASE:
                const filledTiles = projectState.floodFill(
                  tilemapEditorState.selectedLayer,
                  row,
                  col,
                  null,
                );

                for (const t of filledTiles) {
                  dirtyTiles.push({ ...t });
                }
                break;
            }
            break;
          }

          switch (tilemapEditorState.selectedTool) {
            case Tool.PAINT:
              if (tilemapEditorState.selectedAsset !== null) {
                const tiles = projectState.paintTiles(
                  row,
                  col,
                  tilemapEditorState.selectedLayer,
                  tilemapEditorState.selectedAsset,
                );

                for (const t of tiles) {
                  dirtyTiles.push({ ...t });
                }
              }

              break;
            case Tool.ERASE:
              projectState.eraseTile(
                row,
                col,
                tilemapEditorState.selectedLayer,
              );

              dirtyTiles.push({ row, col });
              break;
          }

          break;
        case PaintType.AUTO_TILE:
          switch (tilemapEditorState.selectedTool) {
            case Tool.PAINT: {
              if (tilemapEditorState.selectedAsset !== null) {
                const tiles = projectState.paintAutoTile(
                  row,
                  col,
                  tilemapEditorState.selectedAsset.ref.id,
                  tilemapEditorState.selectedLayer,
                );

                for (const t of tiles) {
                  dirtyTiles.push({ ...t });
                }
              }

              break;
            }
            case Tool.ERASE: {
              const tiles = projectState.eraseAutoTile(
                row,
                col,
                tilemapEditorState.selectedLayer,
              );
              for (const t of tiles) {
                dirtyTiles.push({ ...t });
              }
              break;
            }
          }
          break;
        case PaintType.AREA:
          switch (tilemapEditorState.selectedTool) {
            case Tool.PAINT:
              if (tilemapEditorState.selectedAsset !== null) {
                projectState.paintTile(
                  row,
                  col,
                  tilemapEditorState.selectedLayer,
                  tilemapEditorState.selectedAsset,
                );

                dirtyTiles.push({ row, col });
              }
              break;
            case Tool.ERASE:
              projectState.eraseTile(
                row,
                col,
                tilemapEditorState.selectedLayer,
              );

              dirtyTiles.push({ row, col });
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
        if (ctrlKeyIsDown) {
          const tiles = HistoryStack.undo();
          if (tiles !== undefined) {
            for (const t of tiles) {
              dirtyTiles.push(t);
            }
          }
          e.preventDefault();
        }

        break;
      case "y":
        if (ctrlKeyIsDown) {
          const tiles = HistoryStack.redo();
          if (tiles !== undefined) {
            for (const t of tiles) {
              dirtyTiles.push(t);
            }
          }
          e.preventDefault();
        }

        break;
    }
  };

  function draw(ctx: CanvasRenderingContext2D) {
    let cached:
      | {
          canvas: HTMLCanvasElement;
          ctx: CanvasRenderingContext2D;
        }
      | undefined;

    for (const layer of projectState.getLayers()) {
      const data = projectState.getLayerData(layer.id);
      cached = canvasCache.get(layer.id);

      if (cached === undefined)
        throw new Error("Cached canvas for layer doesn't exist!");
      let x = 0;
      let y = 0;
      for (const { row, col } of dirtyTiles) {
        x = col * tileSize;
        y = row * tileSize;

        // Om inte tile finns i lager men i dirty tiles

        switch (layer.type) {
          case PaintType.TILE:
            const paintedTile = data[row][col] as PaintedTile | null;

            if (paintedTile !== null) {
              const tileset = projectState.getTileset(
                paintedTile.ref.tile.tilesetId,
              );

              cached.ctx.drawImage(
                tileset.spritesheet,
                paintedTile.ref.tile.tilesetPos.x,
                paintedTile.ref.tile.tilesetPos.y,
                tileSize,
                tileSize,
                x,
                y,
                tileSize,
                tileSize,
              );
            } else {
              cached.ctx.clearRect(x, y, tileSize, tileSize);
            }

            break;
          case PaintType.AUTO_TILE:
            const paintedAutoTile = data[row][col] as PaintedAutoTile | null;

            if (paintedAutoTile !== null) {
              const tileset = projectState.getTileset(
                paintedAutoTile.tile.ref.tile.tilesetId,
              );

              cached.ctx.drawImage(
                tileset.spritesheet,
                paintedAutoTile.tile.ref.tile.tilesetPos.x,
                paintedAutoTile.tile.ref.tile.tilesetPos.y,
                tileSize,
                tileSize,
                x,
                y,
                tileSize,
                tileSize,
              );
            } else {
              cached.ctx.clearRect(x, y, tileSize, tileSize);
            }

            break;
          case PaintType.AREA:
            const paintedArea = data[row][col] as PaintedArea | null;

            if (paintedArea !== null) {
              const area = projectState.getArea(paintedArea.ref.id);

              // TODO: fix lines of areas when I know if I want areas

              cached.ctx.lineWidth = 1;

              cached.ctx.strokeStyle = area.color;

              cached.ctx.strokeRect(
                x - 0.5,
                y - 0.5,
                tileSize + 0.5,
                tileSize + 0.5,
              );
            } else {
              cached.ctx.clearRect(
                x - 0.5,
                y - 0.5,
                tileSize + 0.5,
                tileSize + 0.5,
              );
            }

            break;
        }
      }

      if (guiState.visibleLayers[layer.id]) {
        ctx.drawImage(cached.canvas, 0, 0);

        if (
          layer.id === guiState.tilemapEditorState.selectedLayer &&
          selectedTiles.length > 0
        ) {
          for (const t of selectedTiles) {
            x = t.curr.col * tileSize;
            y = t.curr.row * tileSize;
            switch (t.tile.type) {
              case PaintType.TILE:
                const tileset = projectState.getTileset(
                  t.tile.ref.tile.tilesetId,
                );

                ctx.drawImage(
                  tileset.spritesheet,
                  t.tile.ref.tile.tilesetPos.x,
                  t.tile.ref.tile.tilesetPos.y,
                  tileSize,
                  tileSize,
                  x,
                  y,
                  tileSize,
                  tileSize,
                );
                break;
              case PaintType.AREA:
                const area = projectState.getArea(t.tile.ref.id);

                ctx.lineWidth = 1;
                ctx.strokeStyle = area.color;

                ctx.strokeRect(
                  x + 4 - 0.5,
                  y + 4 - 0.5,
                  tileSize - 8,
                  tileSize - 8,
                );
                break;
              case PaintType.AUTO_TILE:
                break;
            }
          }
        }
      }
    }

    dirtyTiles.length = 0;
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
