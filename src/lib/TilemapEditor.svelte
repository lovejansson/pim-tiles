<script lang="ts">
  import {
    guiState,
    projectState,
    projectStateEvents,
    ProjectStateEventType,
    tilemapEditorState,
  } from "../projectState.svelte";
  import { HistoryStack } from "../history";

  import {
    PaintType,
    Tool,
    type AutoTileAsset,
    type Cell,
    type Object,
    type ObjectLayerId,
    type PaintedAutoTile,
    type PaintedObject,
    type TileAsset,
  } from "../types";
  import TilemapViewport, {
    type SelectionTileRect,
    TilemapViewportMousePosEvent,
    TilemapViewportPaintEvent,
    TilemapViewportRightClickEvent,
    TilemapViewportSelectionChangeEvent,
    TilemapViewportSelectionMoveEvent,
  } from "./TilemapViewport";
  import PaintedTileAttributesDialog from "./attributes/PaintedTileAttributesDialog.svelte";
  import PaintedObjectAttributesDialog from "./attributes/PaintedObjectAttributesDialog.svelte";
  import { onMount } from "svelte";
  import { createCanvas } from "../utils";

  let attributesDialogIsOpen = $state(false);
  let attributesDialogType: PaintType.TILE | PaintType.OBJECT = $state(
    PaintType.TILE,
  );

  let attributesCell: Cell = $state({ row: 0, col: 0 });

  let ctrlKeyIsDown = false;

  const dirtyTiles: Cell[] = [];
  const dirtyObjLayers: ObjectLayerId[] = [];

  let copySelection = false;

  let container!: HTMLElement;
  let tilemapViewport!: TilemapViewport;

  let layerCache: Map<string, CanvasRenderingContext2D> = new Map();

  let selectionHasMovedFirstTime = false;
  let selectionMoveDelta = $state({ row: 0, col: 0 });

  onMount(() => {
    if (container === undefined) return;

    tilemapViewport = new TilemapViewport(container, {
      zoom: { min: 0.5, max: 5.0, speed: 0.25 },
      pan: { key: " " },
      grid: {
        tileSize: projectState.tileSize,
        gridColor: guiState.gridColor,
        showGrid: guiState.showGrid,
        width: projectState.width,
        height: projectState.height,
      },
      draw: draw,
      defaultCursor: "crosshair",
      selection: {
        isActive: tilemapEditorState.selectedTool === Tool.SELECT,
        move: true,
        copy: true,
        delete: true,
      },
    });

    tilemapViewport.addEventListener("paint", handleCanvasPaint);

    tilemapViewport.addEventListener("selection-change", handleSelectionChange);

    tilemapViewport.addEventListener("selection-delete", handleSelectionDelete);

    tilemapViewport.addEventListener("selection-copy", handleSelectionCopy);

    tilemapViewport.addEventListener(
      "selection-move-start",
      handleSelectionMoveStart,
    );

    tilemapViewport.addEventListener("selection-move", handleSelectionMove);

    tilemapViewport.addEventListener(
      "selection-move-end",
      handleSelectionMoveEnd,
    );

    tilemapViewport.addEventListener("right-click", handleCanvasRightClick);

    tilemapViewport.addEventListener("mouse-pos", handleMousePosChange);

    recreateLayerCache(true);

    tilemapViewport.init({ center: true, resize: true });

    projectStateEvents.on(ProjectStateEventType.DIMENSIONS_UPDATE, () => {
      clearLayerCache();
      tilemapViewport.updateGridSize(
        projectState.width,
        projectState.height,
        projectState.tileSize,
        true,
      );
    });

    projectStateEvents.on(ProjectStateEventType.OPEN_FILE, () => {
      recreateLayerCache(true);
      tilemapViewport.updateGridSize(
        projectState.width,
        projectState.height,
        projectState.tileSize,
        true,
      );
    });

    projectStateEvents.on(ProjectStateEventType.NEW_PROJECT, () => {
      recreateLayerCache(false);
      tilemapViewport.updateGridSize(
        projectState.width,
        projectState.height,
        projectState.tileSize,
        true,
      );
    });

    projectStateEvents.on(ProjectStateEventType.AUTO_TILES_UPDATE, () => {
      redrawAutoTileLayers();
    });

    projectStateEvents.on(ProjectStateEventType.OBJECTS_UPDATE, () => {
      redrawObjectLayers();
    });

    projectStateEvents.on(ProjectStateEventType.LAYERS_UPDATE, () => {
      const addedLayers = projectState
        .getLayers()
        .filter((l) => !layerCache.has(l.id));

      const deletedLayers = Array.from(layerCache.keys()).filter(
        (k) => projectState.getLayers().find((l) => l.id === k) === undefined,
      );

      for (const l of addedLayers) {
        const ctx = createCanvas(projectState.width, projectState.height);
        layerCache.set(l.id, ctx);
      }

      for (const l of deletedLayers) {
        layerCache.delete(l);
      }
    });
  });

  $effect(() => {
    tilemapViewport.gridColor = guiState.gridColor;
  });

  $effect(() => {
    tilemapViewport.showGrid = guiState.showGrid;
  });

  $effect(() => {
    if (tilemapEditorState.selectedTool === Tool.SELECT) {
      tilemapViewport.enableSelection();
    } else {
      tilemapViewport.disableSelection();
    }
  });

  function clearLayerCache() {
    layerCache.values().forEach((c) => {
      c.canvas.width = projectState.width;
      c.canvas.height = projectState.height;
      c.imageSmoothingEnabled = false;
    });
  }

  function redrawObjectLayers() {
    let cached: CanvasRenderingContext2D | undefined;
    let y = 0;
    let x = 0;

    for (const l of projectState.getLayers()) {
      if (l.type !== PaintType.OBJECT) continue;

      cached = layerCache.get(l.id);
      if (cached === undefined) throw new Error("Cache for layer not found");

      for (let r = 0; r < projectState.rows; ++r) {
        for (let c = 0; c < projectState.cols; ++c) {
          const paintedObj = projectState.getTileAt(l.id, r, c);
          if (paintedObj !== null) {
            x = c * projectState.tileSize;
            y = r * projectState.tileSize;

            const obj = projectState.getObject(paintedObj.ref.id);
            cached.drawImage(obj.image.bitmap, x, y, obj.width, obj.height);
          }
        }
      }
    }
  }

  function redrawAutoTileLayers() {
    let cached: CanvasRenderingContext2D | undefined;
    let y = 0;
    let x = 0;

    for (const l of projectState.getLayers()) {
      if (l.type !== PaintType.AUTO_TILE) continue;
      cached = layerCache.get(l.id);

      if (cached === undefined) throw new Error("Cache for layer not found");

      for (let row = 0; row < projectState.rows; ++row) {
        for (let col = 0; col < projectState.cols; ++col) {
          y = row * projectState.tileSize;
          x = col * projectState.tileSize;

          const paintedAutoTile = projectState.getTileAt(l.id, row, col);

          if (paintedAutoTile !== null) {
            const autoTile = projectState.getAutoTile(paintedAutoTile.ref.id);
            const tile =
              autoTile.rules.find(
                (tr) => tr.id === paintedAutoTile.selectedTileRuleId?.id,
              )?.tile ?? autoTile.defaultTile;

            const tileset = projectState.getTileset(tile.ref.tilesetId);

            cached.drawImage(
              tileset.spritesheet,
              tile.ref.x,
              tile.ref.y,
              projectState.tileSize,
              projectState.tileSize,
              x,
              y,
              projectState.tileSize,
              projectState.tileSize,
            );
          }
        }
      }
    }
  }

  function recreateLayerCache(draw: boolean = false) {
    // Clear the contents of current cache and create a new entry for each layer and paint current content of the layer

    layerCache.clear();

    for (const l of projectState.getLayers()) {
      const ctx = createCanvas(projectState.width, projectState.height);

      ctx.canvas.width = projectState.width;
      ctx.canvas.height = projectState.height;

      if (draw) {
        let y = 0;
        let x = 0;

        for (let row = 0; row < projectState.rows; ++row) {
          for (let col = 0; col < projectState.cols; ++col) {
            y = row * projectState.tileSize;
            x = col * projectState.tileSize;

            switch (l.type) {
              case PaintType.TILE:
                const paintedTile = projectState.getTileAt(l.id, row, col);

                if (paintedTile !== null) {
                  const tileset = projectState.getTileset(
                    paintedTile.ref.tilesetId,
                  );

                  ctx.drawImage(
                    tileset.spritesheet,
                    paintedTile.ref.x,
                    paintedTile.ref.y,
                    projectState.tileSize,
                    projectState.tileSize,
                    x,
                    y,
                    projectState.tileSize,
                    projectState.tileSize,
                  );
                }

                break;
              case PaintType.AUTO_TILE:
                const paintedAutoTile = projectState.getTileAt(l.id, row, col);

                if (paintedAutoTile !== null) {
                  const autoTile = projectState.getAutoTile(
                    paintedAutoTile.ref.id,
                  );
                  const tile =
                    autoTile.rules.find(
                      (tr) => tr.id === paintedAutoTile.selectedTileRuleId?.id,
                    )?.tile ?? autoTile.defaultTile;

                  const tileset = projectState.getTileset(tile.ref.tilesetId);

                  ctx.drawImage(
                    tileset.spritesheet,
                    tile.ref.x,
                    tile.ref.y,
                    projectState.tileSize,
                    projectState.tileSize,
                    x,
                    y,
                    projectState.tileSize,
                    projectState.tileSize,
                  );
                }

                break;

              case PaintType.OBJECT:
                const paintedObj = projectState.getTileAt(l.id, row, col);

                if (paintedObj !== null) {
                  const obj = projectState.getObject(paintedObj.ref.id);

                  if (obj !== null) {
                    ctx.drawImage(
                      obj.image.bitmap,
                      x,
                      y,
                      obj.width,
                      obj.height,
                    );
                  }
                }

                break;
            }
          }
        }
      }
      layerCache.set(l.id, ctx);
    }
  }

  function getObjectSelection(rect: SelectionTileRect): {
    org: Cell;
    curr: Cell;
    tile: PaintedObject;
  }[] {
    const layerId = tilemapEditorState.selectedLayer as ObjectLayerId;
    const data = projectState.getLayerData(layerId);

    const { minRow, maxRow, minCol, maxCol } = rect;

    const isSingleTileSelection = maxRow === minRow && maxCol === minCol;

    const isIntersectingSelection = (
      objRow: number,
      objCol: number,
      obj: Object,
    ): boolean => {
      const objRows = Math.max(
        1,
        Math.ceil(obj.height / projectState.tileSize),
      );
      const objCols = Math.max(1, Math.ceil(obj.width / projectState.tileSize));

      const objMinRow = objRow;
      const objMaxRow = objRow + objRows - 1;
      const objMinCol = objCol;
      const objMaxCol = objCol + objCols - 1;

      return !(
        objMaxRow < minRow ||
        objMinRow > maxRow ||
        objMaxCol < minCol ||
        objMinCol > maxCol
      );
    };

    const selected: {
      org: Cell;
      curr: Cell;
      tile: PaintedObject;
    }[] = [];

    for (const [key, paintedObj] of data.entries()) {
      const [rowStr, colStr] = key.split(":");
      const row = Number.parseInt(rowStr, 10);
      const col = Number.parseInt(colStr, 10);

      if (Number.isNaN(row) || Number.isNaN(col)) continue;

      const obj = projectState.getObject(paintedObj.ref.id);

      if (isIntersectingSelection(row, col, obj)) {
        selected.push({
          org: { row, col },
          curr: { row, col },
          tile: paintedObj,
        });
      }
    }

    selected.sort((a, b) => {
      if (a.org.row !== b.org.row) return b.org.row - a.org.row;
      return b.org.col - a.org.col;
    });

    if (selected.length > 1 && isSingleTileSelection) {
      let firstRendered = selected[0];

      for (let i = 1; i < selected.length; ++i) {
        const candidate = selected[i];
        const isRenderedAfterCurr =
          candidate.org.row > firstRendered.org.row &&
          candidate.org.col > firstRendered.org.col;

        if (isRenderedAfterCurr) {
          firstRendered = candidate;
        }
      }
      return [firstRendered];
    }

    return selected;
  }

  const handleSelectionChange = (e: Event) => {
    // If previously selected tiles have been moved they are painted to that location
    if (tilemapEditorState.selection.tiles.length > 0) {
      copySelection = false; // Reset copy state for previous selection
      if (selectionHasMovedFirstTime) {
        const tilesInsideGrid = tilemapEditorState.selection.tiles
          .map((t) => ({
            ...t,
            move: {
              row: t.curr.row + selectionMoveDelta.row,
              col: t.curr.col + selectionMoveDelta.col,
            },
          }))
          .filter((t) =>
            projectState.isWithinGridBounds(t.move.row, t.move.col),
          );

        if (tilesInsideGrid.length > 0) {
          switch (tilemapEditorState.type) {
            case PaintType.TILE:
              projectState.paintTiles(
                tilemapEditorState.selectedLayer,
                tilesInsideGrid.map((t) => ({
                  row: t.move.row,
                  col: t.move.col,
                  tileAsset: t.tile as TileAsset,
                })),
              );
              dirtyTiles.push(...tilesInsideGrid.map((t) => t.move));
              break;
            case PaintType.AUTO_TILE:
              const tiles = projectState.paintAutoTiles(
                tilemapEditorState.selectedLayer,
                tilesInsideGrid.map((t) => t.move),
                tilesInsideGrid[0].tile as AutoTileAsset,
              );
              dirtyTiles.push(...tiles);
              break;
            case PaintType.OBJECT:
              projectState.paintObjects(
                tilemapEditorState.selectedLayer,
                tilesInsideGrid.map((t) => ({
                  row: t.move.row,
                  col: t.move.col,
                  objectAsset: t.tile as PaintedObject,
                })),
              );
              dirtyObjLayers.push(tilemapEditorState.selectedLayer);
              break;
          }
        }
      }

      selectionHasMovedFirstTime = false;
      selectionMoveDelta.row = 0;
      selectionMoveDelta.col = 0;
      tilemapEditorState.selection.tiles = [];
    }

    const selectionRect = (e as TilemapViewportSelectionChangeEvent).rect;

    // Delete selected tiles from project and add them to the selected arr

    if (selectionRect !== null) {
      const { minRow, maxRow, minCol, maxCol } = selectionRect;

      switch (tilemapEditorState.type) {
        case PaintType.TILE:
          for (let row = minRow; row <= maxRow; ++row) {
            for (let col = minCol; col <= maxCol; ++col) {
              const tile = projectState.getTileAt(
                tilemapEditorState.selectedLayer,
                row,
                col,
              );

              if (tile !== null) {
                tilemapEditorState.selection.tiles.push({
                  org: { row, col },
                  curr: { row, col },
                  tile,
                });
              }
            }
          }
          break;
        case PaintType.AUTO_TILE:
          for (let row = minRow; row <= maxRow; ++row) {
            for (let col = minCol; col <= maxCol; ++col) {
              const tile = projectState.getTileAt(
                tilemapEditorState.selectedLayer,
                row,
                col,
              );

              if (tile !== null) {
                tilemapEditorState.selection.tiles.push({
                  org: { row, col },
                  curr: { row, col },
                  tile,
                });
              }
            }
          }
          break;
        case PaintType.OBJECT:
          tilemapEditorState.selection.tiles =
            getObjectSelection(selectionRect);
          break;
      }
    }
  };

  const handleCanvasRightClick = (e: Event) => {
    const { row, col } = (e as TilemapViewportRightClickEvent).cell;

    if (tilemapEditorState.type === PaintType.OBJECT) {
      const layerId = tilemapEditorState.selectedLayer as ObjectLayerId;
      const data = projectState.getLayerData(layerId);

      let foundObjCell: Cell | null = null;

      for (const [key, paintedObj] of data.entries()) {
        const [rowStr, colStr] = key.split(":");
        const objRow = Number.parseInt(rowStr, 10);
        const objCol = Number.parseInt(colStr, 10);
        if (Number.isNaN(objRow) || Number.isNaN(objCol)) continue;

        const obj = projectState.getObject(paintedObj.ref.id);
        const objRows = Math.max(
          1,
          Math.floor(obj.height / projectState.tileSize),
        );
        const objCols = Math.max(
          1,
          Math.floor(obj.width / projectState.tileSize),
        );

        if (
          row >= objRow &&
          row <= objRow + objRows - 1 &&
          col >= objCol &&
          col <= objCol + objCols - 1
        ) {
          foundObjCell = { row: objRow, col: objCol };
          break;
        }
      }

      if (foundObjCell !== null) {
        attributesCell = foundObjCell;
        attributesDialogType = PaintType.OBJECT;
        attributesDialogIsOpen = true;
      }
    } else {
      attributesCell = { row, col };

      attributesDialogType = PaintType.TILE;
      attributesDialogIsOpen = true;
    }
  };

  const handleSelectionMoveStart = () => {
    /**
     * When user starts moving the selection the first time, the original tiles should be either deleted from state (if not copy) or just left there (if copy)
     *
     * When user starts moving all other times, the tiles should be copied (update state) to the current pos (if copy) or otherwise nothing will happen here
     *
     */

    if (selectionHasMovedFirstTime) {
      if (copySelection) {
        switch (tilemapEditorState.type) {
          case PaintType.TILE: {
            const tilesInsideGrid = tilemapEditorState.selection.tiles.filter(
              (t) =>
                projectState.isWithinGridBounds(
                  t.curr.row + selectionMoveDelta.row,
                  t.curr.col + selectionMoveDelta.col,
                ),
            );
            dirtyTiles.push(
              ...tilesInsideGrid.map((t) => ({
                row: t.curr.row + selectionMoveDelta.row,
                col: t.curr.col + selectionMoveDelta.col,
              })),
            );
            projectState.paintTiles(
              tilemapEditorState.selectedLayer,
              tilesInsideGrid.map((t) => ({
                row: t.curr.row + selectionMoveDelta.row,
                col: t.curr.col + selectionMoveDelta.col,
                tileAsset: t.tile as TileAsset,
              })),
            );

            break;
          }
          case PaintType.AUTO_TILE: {
            const tilesInsideGrid = tilemapEditorState.selection.tiles.filter(
              (t) =>
                projectState.isWithinGridBounds(
                  t.curr.row + selectionMoveDelta.row,
                  t.curr.col + selectionMoveDelta.col,
                ),
            );

            const tiles = projectState.paintAutoTiles(
              tilemapEditorState.selectedLayer,
              tilesInsideGrid.map((t) => ({
                row: t.curr.row + selectionMoveDelta.row,
                col: t.curr.col + selectionMoveDelta.col,
              })),
              tilesInsideGrid[0].tile as AutoTileAsset,
            );
            dirtyTiles.push(...tiles);
            break;
          }
          case PaintType.OBJECT: {
            const tilesInsideGrid = tilemapEditorState.selection.tiles.filter(
              (t) =>
                projectState.isWithinGridBounds(
                  t.curr.row + selectionMoveDelta.row,
                  t.curr.col + selectionMoveDelta.col,
                ),
            );

            projectState.paintObjects(
              tilemapEditorState.selectedLayer,
              tilesInsideGrid.map((t) => ({
                row: t.curr.row + selectionMoveDelta.row,
                col: t.curr.col + selectionMoveDelta.col,
                objectAsset: t.tile as PaintedObject,
              })),
            );

            dirtyObjLayers.push(tilemapEditorState.selectedLayer);
            break;
          }
        }
      }
    } else {
      if (!copySelection) {
        switch (tilemapEditorState.type) {
          case PaintType.TILE:
            projectState.eraseTiles(
              tilemapEditorState.selectedLayer,
              tilemapEditorState.selection.tiles.map((t) => ({
                row: t.org.row,
                col: t.org.col,
              })),
            );
            dirtyTiles.push(
              ...tilemapEditorState.selection.tiles.map((t) => t.org),
            );
            break;
          case PaintType.AUTO_TILE:
            const tiles = projectState.eraseAutoTiles(
              tilemapEditorState.selectedLayer,
              tilemapEditorState.selection.tiles.map((t) => ({
                row: t.org.row,
                col: t.org.col,
              })),
            );

            dirtyTiles.push(...tiles);
            break;
          case PaintType.OBJECT:
            projectState.eraseObjects(
              tilemapEditorState.selectedLayer,
              tilemapEditorState.selection.tiles.map((t) => ({
                row: t.org.row,
                col: t.org.col,
              })),
            );

            dirtyObjLayers.push(tilemapEditorState.selectedLayer);
            break;
        }
      }
    }

    selectionHasMovedFirstTime = true;
    copySelection = false;
    selectionMoveDelta.row = 0;
    selectionMoveDelta.col = 0;
  };

  const handleSelectionMove = (e: Event) => {
    const { rowDelta, colDelta } = e as TilemapViewportSelectionMoveEvent;

    selectionMoveDelta.row = rowDelta;
    selectionMoveDelta.col = colDelta;
  };

  const handleSelectionMoveEnd = () => {
    for (const t of tilemapEditorState.selection.tiles) {
      t.curr.row += selectionMoveDelta.row;
      t.curr.col += selectionMoveDelta.col;
    }

    selectionMoveDelta.row = 0;
    selectionMoveDelta.col = 0;
  };

  const handleSelectionDelete = () => {
    /**
     * When user deletes a selection that hasn't been moved it should be deleted from state, if it has been moved it was either copied or
     * deleted from its original place already and only need to be cleared
     *
     * cache is updated only except for "delete" och "change"
     *
     *
     */

    if (!selectionHasMovedFirstTime) {
      switch (tilemapEditorState.type) {
        case PaintType.TILE:
          projectState.eraseTiles(
            tilemapEditorState.selectedLayer,
            tilemapEditorState.selection.tiles.map((t) => ({
              row: t.org.row,
              col: t.org.col,
            })),
          );
          dirtyTiles.push(
            ...tilemapEditorState.selection.tiles.map((t) => t.org),
          );
          break;
        case PaintType.AUTO_TILE:
          const tiles = projectState.eraseAutoTiles(
            tilemapEditorState.selectedLayer,
            tilemapEditorState.selection.tiles.map((t) => ({
              row: t.org.row,
              col: t.org.col,
            })),
          );

          dirtyTiles.push(...tiles);

          break;
        case PaintType.OBJECT:
          projectState.eraseObjects(
            tilemapEditorState.selectedLayer,
            tilemapEditorState.selection.tiles.map((t) => ({
              row: t.org.row,
              col: t.org.col,
            })),
          );

          dirtyObjLayers.push(tilemapEditorState.selectedLayer);
          break;
      }
    }

    selectionMoveDelta.row = 0;
    selectionMoveDelta.col = 0;
    tilemapEditorState.selection.tiles = [];
  };

  const handleSelectionCopy = () => {
    if (tilemapEditorState.selection.tiles.length > 0) {
      copySelection = true;
    }
  };

  const handleMousePosChange = (e: Event) => {
    const cell = (e as TilemapViewportMousePosEvent).cell;

    guiState.mouseTilePos = cell;
  };

  const tryFloodFill = (
    row: number,
    col: number,
    paint: TileAsset | AutoTileAsset | null,
  ): Cell[] | null => {
    try {
      return projectState.floodFill(
        tilemapEditorState.selectedLayer,
        row,
        col,
        paint,
      );
    } catch (e) {
      guiState.notification = {
        variant: "danger",
        title: "Flood fill failed",
        msg: (e as Error).message,
      };

      return null;
    }
  };

  const handleCanvasPaint = (e: Event) => {
    const { row, col } = (e as TilemapViewportPaintEvent).cell;

    if (guiState.visibleLayers[tilemapEditorState.selectedLayer]) {
      switch (tilemapEditorState.type) {
        case PaintType.TILE:
          if (tilemapEditorState.fillToolIsActive) {
            switch (tilemapEditorState.selectedTool) {
              case Tool.PAINT:
                if (tilemapEditorState.selectedAsset !== null) {
                  const filledTiles = tryFloodFill(
                    row,
                    col,
                    tilemapEditorState.selectedAsset[0], // Flood fill only takes first tile into account
                  );

                  if (filledTiles === null) break;

                  for (const t of filledTiles) {
                    dirtyTiles.push(t);
                  }
                }
                break;
              case Tool.ERASE: {
                const erasedTiles = tryFloodFill(row, col, null);

                if (erasedTiles === null) break;

                for (const t of erasedTiles) {
                  dirtyTiles.push(t);
                }
                break;
              }
            }
          } else {
            switch (tilemapEditorState.selectedTool) {
              case Tool.PAINT:
                if (tilemapEditorState.selectedAsset !== null) {
                  // Calculate which tiles should be painted
                  const minX = Math.min(
                    ...tilemapEditorState.selectedAsset.map((t) => t.ref.x),
                  );
                  const minY = Math.min(
                    ...tilemapEditorState.selectedAsset.map((t) => t.ref.y),
                  );

                  const tiles: {
                    row: number;
                    col: number;
                    tileAsset: TileAsset;
                  }[] = [];

                  for (const t of tilemapEditorState.selectedAsset) {
                    const r =
                      row +
                      Math.floor((t.ref.y - minY) / projectState.tileSize);
                    const c =
                      col +
                      Math.floor((t.ref.x - minX) / projectState.tileSize);

                    if (r >= projectState.rows || c >= projectState.cols)
                      continue; // out of bounds

                    tiles.push({
                      row: r,
                      col: c,
                      tileAsset: $state.snapshot(t),
                    });
                  }

                  const paintedTiles = projectState.paintTiles(
                    tilemapEditorState.selectedLayer,
                    tiles,
                  );

                  for (const t of paintedTiles) {
                    dirtyTiles.push(t);
                  }
                }

                break;
              case Tool.ERASE:
                projectState.eraseTile(
                  tilemapEditorState.selectedLayer,
                  row,
                  col,
                );

                dirtyTiles.push({ row, col });
                break;
            }
          }

          break;
        case PaintType.AUTO_TILE:
          if (tilemapEditorState.fillToolIsActive) {
            switch (tilemapEditorState.selectedTool) {
              case Tool.PAINT:
                if (tilemapEditorState.selectedAsset !== null) {
                  const filledTiles = tryFloodFill(
                    row,
                    col,
                    tilemapEditorState.selectedAsset,
                  );

                  if (filledTiles === null) break;

                  for (const t of filledTiles) {
                    dirtyTiles.push(t);
                  }
                }
                break;
              case Tool.ERASE: {
                const erasedTiles = tryFloodFill(row, col, null);

                if (erasedTiles === null) break;

                for (const t of erasedTiles) {
                  dirtyTiles.push(t);
                }
                break;
              }
            }
          } else {
            switch (tilemapEditorState.selectedTool) {
              case Tool.PAINT: {
                if (tilemapEditorState.selectedAsset !== null) {
                  const tiles = projectState.paintAutoTile(
                    tilemapEditorState.selectedLayer,
                    row,
                    col,
                    tilemapEditorState.selectedAsset,
                  );

                  for (const t of tiles) {
                    dirtyTiles.push(t);
                  }
                }

                break;
              }
              case Tool.ERASE: {
                const tiles = projectState.eraseAutoTile(
                  tilemapEditorState.selectedLayer,
                  row,
                  col,
                );
                for (const t of tiles) {
                  dirtyTiles.push(t);
                }
                break;
              }
            }
          }
          break;
        case PaintType.OBJECT:
          {
            switch (tilemapEditorState.selectedTool) {
              case Tool.PAINT: {
                if (tilemapEditorState.selectedAsset !== null) {
                  projectState.paintObject(
                    tilemapEditorState.selectedLayer,
                    row,
                    col,
                    tilemapEditorState.selectedAsset,
                  );

                  dirtyObjLayers.push(tilemapEditorState.selectedLayer);
                }
                break;
              }
            }
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

    // TODO: looks weird when user is selecting something and at the same time is using Ctrl z since they can see the operation that deleted the selection from the moved place coming back

    if (tilemapEditorState.selection.tiles.length > 1) return;

    switch (e.key.toLowerCase()) {
      case "z":
        if (ctrlKeyIsDown) {
          const update = HistoryStack.undo();

          if (update !== null) {
            switch (update.curr.type) {
              case PaintType.TILE:
              case PaintType.AUTO_TILE:
                for (const t of update.curr.items) {
                  dirtyTiles.push(t.pos);
                }
                break;
              case PaintType.OBJECT:
                dirtyObjLayers.push(update.curr.layerId);
            }
          }

          e.preventDefault();
        }

        break;
      case "y":
        if (ctrlKeyIsDown) {
          const update = HistoryStack.redo();

          if (update !== null) {
            switch (update.curr.type) {
              case PaintType.TILE:
              case PaintType.AUTO_TILE:
                for (const t of update.curr.items) {
                  dirtyTiles.push(t.pos);
                }
                break;
              case PaintType.OBJECT:
                dirtyObjLayers.push(update.curr.layerId);
            }
          }

          e.preventDefault();
        }

        break;
    }
  };

  function drawDirtyTilesToCache() {
    let cached: CanvasRenderingContext2D | undefined;

    let x = 0;
    let y = 0;

    for (const layer of projectState.getLayers()) {
      if (layer.type === PaintType.OBJECT) continue;

      cached = layerCache.get(layer.id);

      if (cached === undefined)
        throw new Error("Cached canvas for layer doesn't exist!");

      for (const { row, col } of dirtyTiles) {
        x = col * projectState.tileSize;
        y = row * projectState.tileSize;

        switch (layer.type) {
          case PaintType.TILE:
            cached.clearRect(
              x,
              y,
              projectState.tileSize,
              projectState.tileSize,
            );
            const paintedTile = projectState.getTileAt(layer.id, row, col);

            if (paintedTile !== null) {
              const tileset = projectState.getTileset(
                paintedTile.ref.tilesetId,
              );

              cached.drawImage(
                tileset.spritesheet,
                paintedTile.ref.x,
                paintedTile.ref.y,
                projectState.tileSize,
                projectState.tileSize,
                x,
                y,
                projectState.tileSize,
                projectState.tileSize,
              );
            }
            break;
          case PaintType.AUTO_TILE:
            const paintedAutoTile = projectState.getTileAt(layer.id, row, col);
            cached.clearRect(
              x,
              y,
              projectState.tileSize,
              projectState.tileSize,
            );
            if (paintedAutoTile !== null) {
              const autoTile = projectState.getAutoTile(paintedAutoTile.ref.id);
              const tile =
                autoTile.rules.find(
                  (tr) => tr.id === paintedAutoTile.selectedTileRuleId?.id,
                )?.tile ?? autoTile.defaultTile;

              const tileset = projectState.getTileset(tile.ref.tilesetId);

              cached.drawImage(
                tileset.spritesheet,
                tile.ref.x,
                tile.ref.y,
                projectState.tileSize,
                projectState.tileSize,
                x,
                y,
                projectState.tileSize,
                projectState.tileSize,
              );
            }

            break;
        }
      }
    }

    for (const id of dirtyObjLayers) {
      cached = layerCache.get(id);

      if (cached === undefined)
        throw new Error("Cached canvas for layer doesn't exist!");

      cached.clearRect(0, 0, cached.canvas.width, cached.canvas.height);

      for (let r = 0; r < projectState.rows; ++r) {
        for (let c = 0; c < projectState.cols; ++c) {
          const paintedObj = projectState.getTileAt(id, r, c);
          if (paintedObj !== null) {
            x = c * projectState.tileSize;
            y = r * projectState.tileSize;

            const obj = projectState.getObject(paintedObj.ref.id);

            cached.drawImage(obj.image.bitmap, x, y, obj.width, obj.height);
          }
        }
      }
    }

    dirtyTiles.length = 0;
    dirtyObjLayers.length = 0;
  }

  function drawMainCanvas(ctx: CanvasRenderingContext2D) {
    let cached: CanvasRenderingContext2D | undefined;

    let x = 0;
    let y = 0;

    for (const l of projectState.getLayers()) {
      cached = layerCache.get(l.id);

      if (cached === undefined)
        throw new Error("Cached canvas for layer doesn't exist!");

      if (guiState.visibleLayers[l.id]) {
        ctx.drawImage(cached.canvas, 0, 0);

        if (
          l.id === tilemapEditorState.selectedLayer &&
          tilemapEditorState.selection.tiles.length > 0
        ) {
          const isSelectionBeingMoved =
            selectionMoveDelta.row !== 0 || selectionMoveDelta.col !== 0;

          // Before first move, selected content is already in layer cache.
          // Skip costly per-tile preview redraw until the selection is actually moved.
          if (selectionHasMovedFirstTime || isSelectionBeingMoved) {
            for (const t of tilemapEditorState.selection.tiles) {
              const drawRow = t.curr.row + selectionMoveDelta.row;
              const drawCol = t.curr.col + selectionMoveDelta.col;

              // if (projectState.isWithinGridBounds(drawRow, drawCol)) {
              x = drawCol * projectState.tileSize;
              y = drawRow * projectState.tileSize;

              switch (t.tile.type) {
                case PaintType.TILE: {
                  const tileset = projectState.getTileset(t.tile.ref.tilesetId);

                  ctx.drawImage(
                    tileset.spritesheet,
                    t.tile.ref.x,
                    t.tile.ref.y,
                    projectState.tileSize,
                    projectState.tileSize,
                    x,
                    y,
                    projectState.tileSize,
                    projectState.tileSize,
                  );
                  break;
                }
                case PaintType.AUTO_TILE: {
                  const autoTile = projectState.getAutoTile(t.tile.ref.id);
                  const tile =
                    autoTile.rules.find(
                      (tr) =>
                        tr.id ===
                        (t.tile as PaintedAutoTile).selectedTileRuleId?.id,
                    )?.tile ?? autoTile.defaultTile;

                  const tileset = projectState.getTileset(tile.ref.tilesetId);

                  ctx.drawImage(
                    tileset.spritesheet,
                    tile.ref.x,
                    tile.ref.y,
                    projectState.tileSize,
                    projectState.tileSize,
                    x,
                    y,
                    projectState.tileSize,
                    projectState.tileSize,
                  );

                  break;
                }
                case PaintType.OBJECT: {
                  const obj = projectState.getObject(t.tile.ref.id);

                  ctx.drawImage(obj.image.bitmap, x, y, obj.width, obj.height);
                  break;
                }
              }
            }
          }
        }
      }
    }

    if (guiState.outlineObjects) {
      ctx.font = "8px Google Sans Code, monospace";
      for (const l of projectState.getLayers()) {
        if (l.type !== PaintType.OBJECT) continue;

        for (const [k, v] of projectState.getLayerData(l.id)) {
          const [row, col] = k.split(":").map(Number);
          const paintedObj = projectState.getTileAt(l.id, row, col);
          if (paintedObj !== null) {
            x = col * projectState.tileSize;
            y = row * projectState.tileSize;

            const obj = projectState.getObject(paintedObj.ref.id);
            ctx.strokeStyle = "lime";
            ctx.strokeRect(x, y, obj.width, obj.height);

            const metrics = ctx.measureText(obj.name);
            const offY = 0;
            const offX = 0;
            const padding = 8;
            const rectWidth =
              metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
            const rectHeight =
              metrics.actualBoundingBoxAscent +
              metrics.actualBoundingBoxDescent;
            ctx.fillStyle = "#ececec";
            ctx.fillRect(
              x - offX,
              y - offY,
              rectWidth + padding * 2,
              rectHeight + padding,
            );
            ctx.strokeStyle = "black";
            ctx.strokeRect(
              x - offX,
              y - offY,
              rectWidth + padding * 2,
              rectHeight + padding,
            );

            ctx.fillStyle = "black";
            ctx.fillText(obj.name, x + padding, y + rectHeight + padding / 4);
          }
        }
      }
    }
  }

  function draw(ctx: CanvasRenderingContext2D) {
    drawDirtyTilesToCache();
    drawMainCanvas(ctx);
  }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<section bind:this={container} id="tilemap-editor"></section>

{#if attributesDialogIsOpen && attributesDialogType === PaintType.TILE}
  <PaintedTileAttributesDialog
    bind:open={attributesDialogIsOpen}
    row={attributesCell.row}
    col={attributesCell.col}
  />
{/if}

{#if attributesDialogIsOpen && attributesDialogType === PaintType.OBJECT}
  <PaintedObjectAttributesDialog
    bind:open={attributesDialogIsOpen}
    row={attributesCell.row}
    col={attributesCell.col}
  />
{/if}

<style lang="postcss">
  #tilemap-editor {
    display: flex;
    flex-direction: column;
    background: var(--color-0);
    flex-grow: 1;
    overflow-x: hidden;
  }
</style>
