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
    type Cell,
    type PaintedArea,
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
  import { createCanvas } from "../utils";

  let tileAttributesDialogIsOpen = $state(false);

  let tileAttributesCell: Cell = $state({ row: 0, col: 0 });

  let ctrlKeyIsDown = false;

  const dirtyTiles: Cell[] = [];

  let selectedTiles: { org: Cell; curr: Cell; tile: PaintedTile }[] = [];

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
        isActive:
          guiState.tilemapEditorState.selectedTool === Tool.SELECT &&
          guiState.tilemapEditorState.type === PaintType.TILE,
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

    projectStateEvents.on(ProjectStateEventType.LOAD_FROM_FILE, () => {
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
      // When an autotile or area is updated the layers that is painted with those needs to be updated
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
              case PaintType.AREA:
                const paintedArea = data[row][col] as PaintedArea | null;

                if (paintedArea !== null) {
                  const area = projectState.getArea(paintedArea.ref.id);

                  cached.lineWidth = 1;

                  cached.strokeStyle = area.color;

                  cached.strokeRect(
                    x - 0.5,
                    y - 0.5,
                    projectState.tileSize + 0.5,
                    projectState.tileSize + 0.5,
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
              case PaintType.AREA:
                const paintedArea = data[row][col] as PaintedArea | null;

                if (paintedArea !== null) {
                  const area = projectState.getArea(paintedArea.ref.id);

                  ctx.lineWidth = 1;

                  ctx.strokeStyle = area.color;

                  ctx.strokeRect(
                    x - 0.5,
                    y - 0.5,
                    projectState.tileSize + 0.5,
                    projectState.tileSize + 0.5,
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
    if (
      guiState.tilemapEditorState.selectedTool === Tool.SELECT &&
      guiState.tilemapEditorState.type === PaintType.TILE
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
          guiState.tilemapEditorState.selectedLayer,
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

    const tiles = (e as TilemapViewportSelectionChangeEvent).tiles;

    selectedTiles = [];

    if (tiles !== null) {
      for (const { row, col } of tiles) {
        const tile = projectState.getTileAt(
          row,
          col,
          guiState.tilemapEditorState.selectedLayer,
        );

        if (tile !== null) {
          if (tile.type !== PaintType.TILE)
            throw new Error("Selection only implemented for tile layers");

          projectState.eraseTile(
            row,
            col,
            guiState.tilemapEditorState.selectedLayer,
          );

          dirtyTiles.push({ row, col });

          selectedTiles.push({
            org: { row, col },
            curr: { row, col },
            tile,
          });
        }
      }
    }
  };

  const handleCanvasRightClick = (e: Event) => {
    const pos = (e as TilemapViewportRightClickEvent).pos;

    const row = Math.floor(pos.y / projectState.tileSize);
    const col = Math.floor(pos.x / projectState.tileSize);

    if (projectState.isTilePainted({ row, col })) {
      tileAttributesCell = { row, col };
      tileAttributesDialogIsOpen = true;
    }
  };

  const handleSelectionMove = (e: Event) => {
    const delta = (e as TilemapViewportSelectionMoveEvent).delta;

    const rowDelta = delta.y / projectState.tileSize;
    const colDelta = delta.x / projectState.tileSize;

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
          guiState.tilemapEditorState.selectedLayer,
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
              case Tool.ERASE:
                const filledTiles = projectState.floodFill(
                  guiState.tilemapEditorState.selectedLayer,
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

          switch (guiState.tilemapEditorState.selectedTool) {
            case Tool.PAINT:
              if (guiState.tilemapEditorState.selectedAsset !== null) {
                const tiles = projectState.paintTiles(
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
            case Tool.ERASE:
              projectState.eraseTile(
                row,
                col,
                guiState.tilemapEditorState.selectedLayer,
              );

              dirtyTiles.push({ row, col });
              break;
          }

          break;
        case PaintType.AUTO_TILE:
          switch (guiState.tilemapEditorState.selectedTool) {
            case Tool.PAINT: {
              if (guiState.tilemapEditorState.selectedAsset !== null) {
                const tiles = projectState.paintAutoTile(
                  row,
                  col,
                  guiState.tilemapEditorState.selectedAsset.ref.id,
                  guiState.tilemapEditorState.selectedLayer,
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
        case PaintType.AREA:
          switch (guiState.tilemapEditorState.selectedTool) {
            case Tool.PAINT:
              if (guiState.tilemapEditorState.selectedAsset !== null) {
                projectState.paintTile(
                  row,
                  col,
                  guiState.tilemapEditorState.selectedLayer,
                  guiState.tilemapEditorState.selectedAsset,
                );

                dirtyTiles.push({ row, col });
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
          case PaintType.AREA:
            const paintedArea = data[row][col] as PaintedArea | null;
            cached.clearRect(
              x,
              y,
              projectState.tileSize + 0.5,
              projectState.tileSize + 0.5,
            );
            if (paintedArea !== null) {
              const area = projectState.getArea(paintedArea.ref.id);

              // TODO: fix lines of areas when I know if I want areas

              cached.lineWidth = 1;

              cached.strokeStyle = area.color;

              cached.strokeRect(
                x - 0.5,
                y - 0.5,
                projectState.tileSize + 0.5,
                projectState.tileSize + 0.5,
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
        selectedTiles.length > 0
      ) {
        for (const t of selectedTiles) {
          x = t.curr.col * projectState.tileSize;
          y = t.curr.row * projectState.tileSize;

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
