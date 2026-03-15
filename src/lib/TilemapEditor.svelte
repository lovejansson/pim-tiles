<script lang="ts">
  import {
    guiState,
    projectState,
    HistoryStack,
    projectStateEvents,
    ProjectStateEventType,
  } from "../state.svelte";
  import {
    PaintType,
    Tool,
    type AutoTileAsset,
    type Cell,
    type PaintedAssetT,
    type PaintedAutoTile,
    type PaintedTile,
    type TileAsset,
  } from "../types";
  import TilemapViewport, {
    TilemapViewportMousePosEvent,
    TilemapViewportPaintEvent,
    TilemapViewportRightClickEvent,
    TilemapViewportSelectionChangeEvent,
    TilemapViewportSelectionMoveEvent,
  } from "./TilemapViewport";
  import AttributesDialog from "./attributes/TileInstanceAttributesDialog.svelte";
  import { onMount } from "svelte";
  import { createCanvas } from "../utils";

  let attributesDialogIsOpen = $state(false);

  let attributesCell: Cell = $state({ row: 0, col: 0 });

  let ctrlKeyIsDown = false;

  const dirtyTiles: Cell[] = [];

  type Selection<T extends PaintType> = {
    type: T;
    tiles: {
      org: Cell;
      prev: Cell;
      curr: Cell;
      tile: PaintedAssetT<T>;
    }[];
  };

  let selection: Selection<PaintType.TILE | PaintType.AUTO_TILE> = {
    type: PaintType.TILE,
    tiles: [],
  };

  let copySelection = false;

  let container!: HTMLElement;
  let tilemapViewport!: TilemapViewport;

  let canvasCache: Map<string, CanvasRenderingContext2D> = new Map();

  $effect(() => {
    // Sync canvasCache with updated layers in project state

    const addedLayers = projectState
      .getLayers()
      .filter((l) => !canvasCache.has(l.id));

    const deletedLayers = Array.from(canvasCache.keys()).filter(
      (k) => projectState.getLayers().find((l) => l.id === k) === undefined,
    );

    for (const l of addedLayers) {
      const ctx = createCanvas(projectState.width, projectState.height);
      canvasCache.set(l.id, ctx);
    }

    for (const l of deletedLayers) {
      canvasCache.delete(l);
    }
  });

  $effect(() => {
    if (projectState.width || projectState.height || projectState.tileSize) {
      clearCache();
    }
  });

  onMount(() => {
    if (container === undefined) return;

    tilemapViewport = new TilemapViewport(container, {
      zoom: { min: 0.25, max: 5.0, speed: 0.125 },
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
        isActive: guiState.tilemapEditorState.selectedTool === Tool.SELECT,
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

    tilemapViewport.init({ center: true, resize: true });

    projectStateEvents.on(ProjectStateEventType.OPEN_FILE, () => {
      // When loading from file we need to remove all of the entries in the canvas cache for each layer and recreate the cache
      recreateCache(true);
    });

    projectStateEvents.on(ProjectStateEventType.DIMENSIONS_CHANGE, () => {
      // When the width, height or tilesize changes we only need to clear the contents of each cached layer
      clearCache();
    });

    projectStateEvents.on(ProjectStateEventType.NEW_PROJECT, () => {
      // When the width, height or tilesize changes we only need to clear the contents of each cached layer
      recreateCache(false);
    });

    projectStateEvents.on(ProjectStateEventType.ASSET_UPDATE, (e) => {
      // When an autotile is updated the layers that is painted with those needs to be updated
      repaintLayers(e.detail.layers);
    });
  });

  function clearCache() {
    canvasCache.values().forEach((c) => {
      c.canvas.width = projectState.width;
      c.canvas.height = projectState.height;
      c.imageSmoothingEnabled = false;
    });
  }

  function repaintLayers(layers: string[]) {
    for (const l of projectState.getLayers()) {
      if (layers.includes(l.id)) {
        const cached = canvasCache.get(l.id);

        if (cached === undefined) throw new Error("Cache for layer not found");

        const data = projectState.getLayerData(l.id);

        let y = 0;
        let x = 0;

        for (let row = 0; row < projectState.rows; ++row) {
          for (let col = 0; col < projectState.cols; ++col) {
            y = row * projectState.tileSize;
            x = col * projectState.tileSize;

            switch (l.type) {
              case PaintType.TILE:
                const paintedTile = data[row][col] as PaintedTile | null;

                if (paintedTile !== null) {
                  const tileset = projectState.getTileset(
                    paintedTile.ref.tilesetId,
                  );

                  cached.drawImage(
                    tileset.spritesheet,
                    paintedTile.ref.tilesetPos.x,
                    paintedTile.ref.tilesetPos.y,
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
                const paintedAutoTile = data[row][
                  col
                ] as PaintedAutoTile | null;

                if (paintedAutoTile !== null) {
                  const autoTile = projectState.getAutoTile(
                    paintedAutoTile.ref.id,
                  );
                  const tile =
                    autoTile.rules.find(
                      (tr) => tr.id === paintedAutoTile.selectedTileRuleId?.id,
                    )?.tile ?? autoTile.defaultTile;

                  const tileset = projectState.getTileset(tile.ref.tilesetId);

                  cached.drawImage(
                    tileset.spritesheet,
                    tile.ref.tilesetPos.x,
                    tile.ref.tilesetPos.y,
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
      }
    }
  }

  function recreateCache(draw: boolean = false) {
    // Clear the contents of current cache and create a new entry for each layer and paint current content of the layer

    canvasCache.clear();

    for (const l of projectState.getLayers()) {
      const ctx = createCanvas(projectState.width, projectState.height);

      ctx.canvas.width = projectState.width;
      ctx.canvas.height = projectState.height;

      if (draw) {
        const data = projectState.getLayerData(l.id);

        let y = 0;
        let x = 0;

        for (let row = 0; row < projectState.rows; ++row) {
          for (let col = 0; col < projectState.cols; ++col) {
            y = row * projectState.tileSize;
            x = col * projectState.tileSize;

            switch (l.type) {
              case PaintType.TILE:
                const paintedTile = data[row][col] as PaintedTile | null;

                if (paintedTile !== null) {
                  const tileset = projectState.getTileset(
                    paintedTile.ref.tilesetId,
                  );

                  ctx.drawImage(
                    tileset.spritesheet,
                    paintedTile.ref.tilesetPos.x,
                    paintedTile.ref.tilesetPos.y,
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
                const paintedAutoTile = data[row][
                  col
                ] as PaintedAutoTile | null;

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
                    tile.ref.tilesetPos.x,
                    tile.ref.tilesetPos.y,
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
      }
      canvasCache.set(l.id, ctx);
    }
  }

  $effect(() => {
    tilemapViewport.updateGridSize(
      projectState.width,
      projectState.height,
      projectState.tileSize,
      true,
    );
  });

  $effect(() => {
    tilemapViewport.gridColor = guiState.gridColor;
  });

  $effect(() => {
    tilemapViewport.showGrid = guiState.showGrid;
  });

  $effect(() => {
    if (guiState.tilemapEditorState.selectedTool === Tool.SELECT) {
      tilemapViewport.enableSelection();
    } else {
      tilemapViewport.disabledSelection();
    }
  });

  const handleSelectionChange = (e: Event) => {
    // If previously selected tiles have been moved they are painted to that location
    if (selection.tiles.length > 0) {
      const hasBeenMoved = selection.tiles.some(
        (t) => t.org.col !== t.curr.col || t.org.row !== t.curr.row,
      );

      if (hasBeenMoved) {
        const tilesInsideGrid = selection.tiles.filter((t) =>
          projectState.isWithinGridBounds(t.curr.row, t.curr.col),
        );

        if (tilesInsideGrid.length > 0) {
          switch (selection.type) {
            case PaintType.TILE:
              projectState.paintTiles(
                guiState.tilemapEditorState.selectedLayer,
                tilesInsideGrid.map((t) => ({
                  row: t.curr.row,
                  col: t.curr.col,
                  tileAsset: t.tile as TileAsset,
                })),
              );
              dirtyTiles.push(...tilesInsideGrid.map((t) => t.curr));
              break;
            case PaintType.AUTO_TILE:
              const tiles = projectState.paintAutoTiles(
                guiState.tilemapEditorState.selectedLayer,
                tilesInsideGrid.map((t) => ({ ...t.curr })),
                tilesInsideGrid[0].tile as AutoTileAsset,
              );
              dirtyTiles.push(...tiles);
              break;
          }
        }
      }

      selection.tiles = [];
    }

    selection.type = guiState.tilemapEditorState.type;

    const tiles = (e as TilemapViewportSelectionChangeEvent).tiles;

    // Delete selected tiles from project and add them to the selected arr

    if (tiles !== null) {
      // Add tile to selected tiles
      for (const { row, col } of tiles) {
        const tile = projectState.getTileAt(
          row,
          col,
          guiState.tilemapEditorState.selectedLayer,
        );

        if (tile !== null) {
          selection.tiles.push({
            org: { row, col },
            prev: { row, col },
            curr: { row, col },
            tile,
          });
        }
      }
    }
  };

  const handleCanvasRightClick = (e: Event) => {
    const { row, col } = (e as TilemapViewportRightClickEvent).cell;

    attributesCell = { row, col };
    attributesDialogIsOpen = true;
  };

  const handleSelectionMoveStart = () => {
    /**
     * When user starts moving the selection the first time, the original tiles should be either deleted from state (if not copy) or just left there (if copy)
     *
     * When user starts moving all other times, the tiles should be copied (update state) to the current pos (if copy) or otherwise nothing will happen here
     *
     */

    const hasBeenMoved = selection.tiles.some(
      (t) => t.org.col !== t.curr.col || t.org.row !== t.curr.row,
    );

    if (hasBeenMoved) {
      if (copySelection) {
        switch (selection.type) {
          case PaintType.TILE:
            projectState.paintTiles(
              guiState.tilemapEditorState.selectedLayer,
              selection.tiles.map((t) => ({
                row: t.curr.row,
                col: t.curr.col,
                tileAsset: t.tile as TileAsset,
              })),
            );
            dirtyTiles.push(...selection.tiles.map((t) => t.curr));
            break;
          case PaintType.AUTO_TILE:
            const tiles = projectState.paintAutoTiles(
              guiState.tilemapEditorState.selectedLayer,
              selection.tiles.map((t) => ({
                row: t.curr.row,
                col: t.curr.col,
              })),
              selection.tiles[0].tile as AutoTileAsset,
            );
            dirtyTiles.push(...tiles);
            break;
        }
      }
    } else {
      if (!copySelection) {
        switch (selection.type) {
          case PaintType.TILE:
            projectState.eraseTiles(
              selection.tiles.map((t) => ({ row: t.org.row, col: t.org.col })),
              guiState.tilemapEditorState.selectedLayer,
            );
            dirtyTiles.push(...selection.tiles.map((t) => t.org));
            break;
          case PaintType.AUTO_TILE:
            const tiles = projectState.eraseAutoTiles(
              selection.tiles.map((t) => ({ row: t.org.row, col: t.org.col })),
              guiState.tilemapEditorState.selectedLayer,
            );

            dirtyTiles.push(...tiles);
            break;
        }
      }
    }

    copySelection = false;
  };

  const handleSelectionMove = (e: Event) => {
    const delta = (e as TilemapViewportSelectionMoveEvent).delta;

    const rowDelta = delta.y / projectState.tileSize;
    const colDelta = delta.x / projectState.tileSize;

    for (const t of selection.tiles) {
      t.curr.row = t.prev.row + rowDelta;
      t.curr.col = t.prev.col + colDelta;
    }
  };

  const handleSelectionMoveEnd = () => {
    for (const t of selection.tiles) {
      t.prev.row = t.curr.row;
      t.prev.col = t.curr.col;
    }
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

    const hasBeenMoved = selection.tiles.some(
      (t) => t.org.col !== t.curr.col || t.org.row !== t.curr.row,
    );

    if (!hasBeenMoved) {
      switch (selection.type) {
        case PaintType.TILE:
          projectState.eraseTiles(
            selection.tiles.map((t) => ({ row: t.org.row, col: t.org.col })),
            guiState.tilemapEditorState.selectedLayer,
          );
          dirtyTiles.push(...selection.tiles.map((t) => t.org));
          break;
        case PaintType.AUTO_TILE:
          const tiles = projectState.eraseAutoTiles(
            selection.tiles.map((t) => ({ row: t.org.row, col: t.org.col })),
            guiState.tilemapEditorState.selectedLayer,
          );

          dirtyTiles.push(...tiles);

          break;
      }
    }

    selection.tiles = [];
  };

  const handleSelectionCopy = () => {
    if (selection.tiles.length > 0) {
      copySelection = true;
    }

    // 1. selection ändras ( om selection har flyttats från org så ska de ritas in (state udpate))
    // 2. move start -> kolla om selection ska kopieras eller ej, om det ska deletas så ska det uppdater state
    // 3. uppdatera bara pos
    // 4. copy sätter bara copy state så när en move påbörjas igen
    // 4. listen for delete (just deletes it) // deletes selection, if not moved, delete state, if moved to new place reset selected tiles
  };

  const handleMousePosChange = (e: Event) => {
    const cell = (e as TilemapViewportMousePosEvent).cell;

    guiState.mouseTilePos = cell;
  };

  const handleCanvasPaint = (e: Event) => {
    const { row, col } = (e as TilemapViewportPaintEvent).cell;

    if (guiState.visibleLayers[guiState.tilemapEditorState.selectedLayer]) {
      switch (guiState.tilemapEditorState.type) {
        case PaintType.TILE:
          if (guiState.tilemapEditorState.fillToolIsActive) {
            switch (guiState.tilemapEditorState.selectedTool) {
              case Tool.PAINT:
                if (guiState.tilemapEditorState.selectedAsset !== null) {
                  const filledTiles = projectState.floodFill(
                    guiState.tilemapEditorState.selectedLayer,
                    row,
                    col,
                    guiState.tilemapEditorState.selectedAsset[0], // Flood fill only takes first tile into account
                  );

                  for (const t of filledTiles) {
                    dirtyTiles.push({ ...t });
                  }
                }
                break;
              case Tool.ERASE: {
                const erasedTiles = projectState.floodFill(
                  guiState.tilemapEditorState.selectedLayer,
                  row,
                  col,
                  null,
                );

                for (const t of erasedTiles) {
                  dirtyTiles.push({ ...t });
                }
                break;
              }
            }
          } else {
            switch (guiState.tilemapEditorState.selectedTool) {
              case Tool.PAINT:
                if (guiState.tilemapEditorState.selectedAsset !== null) {
                  // Calculate which tiles should be painted
                  const minX = Math.min(
                    ...guiState.tilemapEditorState.selectedAsset.map(
                      (t) => t.ref.tilesetPos.x,
                    ),
                  );
                  const minY = Math.min(
                    ...guiState.tilemapEditorState.selectedAsset.map(
                      (t) => t.ref.tilesetPos.y,
                    ),
                  );

                  const tiles: { row: number, col: number, tileAsset: TileAsset }[] = [];

                  for (const t of guiState.tilemapEditorState.selectedAsset) {
                    const r =
                      row +
                      Math.floor(
                        (t.ref.tilesetPos.y - minY) / projectState.tileSize,
                      );
                    const c =
                      col +
                      Math.floor(
                        (t.ref.tilesetPos.x - minX) / projectState.tileSize,
                      );

                    if (r >= projectState.rows || c >= projectState.cols)
                      continue; // out of bounds

                    tiles.push({ row: r, col: c, tileAsset: t });
                  }

                  const paintedTiles = projectState.paintTiles(
                    guiState.tilemapEditorState.selectedLayer,
                    tiles,
                  );

                  for (const t of paintedTiles) {
                    dirtyTiles.push({ ...t });
                  }
                }

                break;
              case Tool.ERASE:
                projectState.eraseTile(
                  row,
                  col,
                  guiState.tilemapEditorState.selectedLayer,
                );

                dirtyTiles.push({ row, col });
                break;
            }
          }

          break;
        case PaintType.AUTO_TILE:
          switch (guiState.tilemapEditorState.selectedTool) {
            case Tool.PAINT: {
              if (guiState.tilemapEditorState.selectedAsset !== null) {
                const tiles = projectState.paintAutoTile(
                  row,
                  col,
                  guiState.tilemapEditorState.selectedLayer,
                  guiState.tilemapEditorState.selectedAsset,
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
                guiState.tilemapEditorState.selectedLayer,
              );
              for (const t of tiles) {
                dirtyTiles.push({ ...t });
              }
              break;
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

    // If some selection is beeing moved, don't trigger state updates since it makes it look weird
    if (
      selection.tiles.some(
        (t) => t.curr.col !== t.org.col || t.org.row !== t.curr.row,
      )
    )
      return;

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

  function drawDirtyTilesToCache() {
    let cached: CanvasRenderingContext2D | undefined;

    for (const layer of projectState.getLayers()) {
      const data = projectState.getLayerData(layer.id);

      cached = canvasCache.get(layer.id);

      if (cached === undefined)
        throw new Error("Cached canvas for layer doesn't exist!");

      let x = 0;
      let y = 0;
      for (const { row, col } of dirtyTiles) {
        x = col * projectState.tileSize;
        y = row * projectState.tileSize;

        switch (layer.type) {
          case PaintType.TILE:
            const paintedTile = data[row][col] as PaintedTile | null;

            cached.clearRect(
              x,
              y,
              projectState.tileSize,
              projectState.tileSize,
            );

            if (paintedTile !== null) {
              const tileset = projectState.getTileset(
                paintedTile.ref.tilesetId,
              );

              cached.drawImage(
                tileset.spritesheet,
                paintedTile.ref.tilesetPos.x,
                paintedTile.ref.tilesetPos.y,
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
            const paintedAutoTile = data[row][col] as PaintedAutoTile | null;
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
                tile.ref.tilesetPos.x,
                tile.ref.tilesetPos.y,
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

    dirtyTiles.length = 0;
  }

  function drawMainCanvas(ctx: CanvasRenderingContext2D) {
    let cached: CanvasRenderingContext2D | undefined;

    let x = 0;
    let y = 0;

    for (const l of projectState.getLayers()) {
      cached = canvasCache.get(l.id);

      if (cached === undefined)
        throw new Error("Cached canvas for layer doesn't exist!");

      if (guiState.visibleLayers[l.id]) {
        ctx.drawImage(cached.canvas, 0, 0);
      }

      if (
        l.id === guiState.tilemapEditorState.selectedLayer &&
        selection.tiles.length > 0
      ) {
        for (const t of selection.tiles) {
          if (projectState.isWithinGridBounds(t.curr.row, t.curr.col)) {
            x = t.curr.col * projectState.tileSize;
            y = t.curr.row * projectState.tileSize;

            switch (t.tile.type) {
              case PaintType.TILE: {
                const tileset = projectState.getTileset(t.tile.ref.tilesetId);

                ctx.drawImage(
                  tileset.spritesheet,
                  t.tile.ref.tilesetPos.x,
                  t.tile.ref.tilesetPos.y,
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
                  tile.ref.tilesetPos.x,
                  tile.ref.tilesetPos.y,
                  projectState.tileSize,
                  projectState.tileSize,
                  x,
                  y,
                  projectState.tileSize,
                  projectState.tileSize,
                );

                break;
              }
            }
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

{#if attributesDialogIsOpen}
  <AttributesDialog bind:open={attributesDialogIsOpen} row={attributesCell.row} col={attributesCell.col} />
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
