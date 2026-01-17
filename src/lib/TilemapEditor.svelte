<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { guiState, projectState, HistoryStack } from "../state.svelte";
  import { roundToDecimal } from "../utils";
  import { PaintType, Tool } from "../types";

  const { tileSize } = $derived(projectState);
  const { gridColor, tilemapEditorState } = $derived(guiState);

  let shiftKeyIsDown = false;
  let ctrlKeyIsDown = false;
  let spaceKeyIsDown = $state(false);
  let isMousDown = false;
  let translation = { x: 0, y: 0 };
  let zoom = 1;
  let zoomPos = { x: 0, y: 0 };
  let mousePosCanvas = { x: 0, y: 0 };

  let mouseTileStart = { row: 0, col: 0 };

  let canvasEl!: HTMLCanvasElement;
  let ctx!: CanvasRenderingContext2D;
  let requestedAnimationFrameID = $state(0);

  onMount(() => {
    if (!canvasEl) return;
    ctx = canvasEl.getContext("2d")!;

    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === 0) return;
      canvasEl.width = entry.contentRect.width;
      canvasEl.height = entry.contentRect.height;
      ctx.imageSmoothingEnabled = false;
      update();
      ro.disconnect();
    });

    ro.observe(canvasEl);

    return () => ro.disconnect();
  });

  onDestroy(() => {
    cancelAnimationFrame(requestedAnimationFrameID);
  });

  const handleMouseDown = (e: MouseEvent) => {
    isMousDown = true;

    const rect = canvasEl.getBoundingClientRect();

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const { x, y } = getWorldPos(ctx, { x: screenX, y: screenY });

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    mouseTileStart.row = row;
    mouseTileStart.col = col;

    if (spaceKeyIsDown) return;

    switch (tilemapEditorState.type) {
      case PaintType.AUTO_TILE:
        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT: {
            if (tilemapEditorState.selectedAsset !== null) {
              projectState.layers.paintWithAutoTile(
                row,
                col,
                tilemapEditorState.selectedAsset.ref.id,
                tilemapEditorState.selectedLayer.id,
              );
            }

            break;
          }
          case Tool.ERASE: {
            projectState.layers.eraseAutoTile(
              row,
              col,
              tilemapEditorState.selectedLayer.id,
            );

            break;
          }
        }
        break;
      case PaintType.TILE:
        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT:
            if (tilemapEditorState.selectedAsset !== null) {
              if (
                tilemapEditorState.fillToolIsActive &&
                tilemapEditorState.selectedAsset.length === 1
              ) {
                projectState.layers.floodFill(
                  tilemapEditorState.selectedLayer.id,
                  row,
                  col,
                  tilemapEditorState.selectedAsset[0],
                );
              } else {
             
                projectState.layers.paintTiles(
                  row,
                  col,
                  tilemapEditorState.selectedLayer.id,
                  tilemapEditorState.selectedAsset,
                );
              }
            }

            break;
          case Tool.ERASE:
            if (tilemapEditorState.fillToolIsActive) {
              projectState.layers.floodFill(
                tilemapEditorState.selectedLayer.id,
                row,
                col,
                null,
              );
            } else {
              projectState.layers.eraseTile(
                row,
                col,
                tilemapEditorState.selectedLayer.id,
              );
            }
            break;
        }

        break;
      case PaintType.AREA:
        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT:
            if (tilemapEditorState.selectedAsset !== null) {
              if (tilemapEditorState.fillToolIsActive) {
                projectState.layers.floodFill(
                  tilemapEditorState.selectedLayer.id,
                  row,
                  col,
                  tilemapEditorState.selectedAsset,
                );
              } else {
                projectState.layers.paintTile(
                  row,
                  col,
                  tilemapEditorState.selectedLayer.id,
                  tilemapEditorState.selectedAsset,
                );
              }
            }
            break;
          case Tool.ERASE:
            if (tilemapEditorState.fillToolIsActive) {
              projectState.layers.floodFill(
                tilemapEditorState.selectedLayer.id,
                row,
                col,
                null,
              );
            } else {
              projectState.layers.eraseTile(
                row,
                col,
                tilemapEditorState.selectedLayer.id,
              );
            }
            break;
        }
    }
  };

  const handleMouseUp = () => {
    if (isMousDown) isMousDown = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    const { x, y } = getWorldPos(ctx, { x: canvasX, y: canvasY });
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    guiState.mouseTile.row = row;
    guiState.mouseTile.col = col;

    const deltaX = canvasX - mousePosCanvas.x;
    const deltaY = canvasY - mousePosCanvas.y;

    mousePosCanvas.x = canvasX;
    mousePosCanvas.y = canvasY;

    if (isMousDown) {
      if (spaceKeyIsDown) {
        translation.x += deltaX;
        translation.y += deltaY;
        return;
      }

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
                  tilemapEditorState.selectedLayer.id,
                  tilemapEditorState.selectedAsset,
                );
              }
              break;
            case Tool.ERASE:
              projectState.layers.eraseTile(
                row,
                col,
                tilemapEditorState.selectedLayer.id,
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
                  tilemapEditorState.selectedLayer.id,
                );
              }
              break;
            }
            case Tool.ERASE: {
              projectState.layers.eraseAutoTile(
                row,
                col,
                tilemapEditorState.selectedLayer.id,
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
                  tilemapEditorState.selectedLayer.id,
                  tilemapEditorState.selectedAsset,
                );
              }
              break;
            case Tool.ERASE:
              projectState.layers.eraseTile(
                row,
                col,
                tilemapEditorState.selectedLayer.id,
              );

              break;
          }
          break;
      }
    }
  };

  function getWorldPos(
    ctx: CanvasRenderingContext2D,
    pos: { x: number; y: number },
  ) {
    const inv = ctx.getTransform().invertSelf();

    const worldX = inv.a * pos.x + inv.c * pos.y + inv.e;
    const worldY = inv.b * pos.x + inv.d * pos.y + inv.f;

    return { x: worldX, y: worldY };
  }

  const handleWheel = (e: WheelEvent) => {
    if (e.target !== canvasEl) return;

    const delta = Math.sign(e.deltaY);
    const zoomFactor = 0.25;

    if (delta < 0) {
      if (zoom < 4.0) {
        zoom = roundToDecimal(zoom + zoomFactor, 3);
        zoomPos = getWorldPos(ctx, {
          x: mousePosCanvas.x,
          y: mousePosCanvas.y,
        });

        // Update current translation to account for zoompoint
        translation.x = mousePosCanvas.x - zoomPos.x * zoom;
        translation.y = mousePosCanvas.y - zoomPos.y * zoom;
      }
    } else {
      if (zoom >= 0.5) {
        zoom = roundToDecimal(zoom - zoomFactor, 3);
        zoomPos = getWorldPos(ctx, {
          x: mousePosCanvas.x,
          y: mousePosCanvas.y,
        });

        // Update current translation to account for zoompoint
        translation.x = mousePosCanvas.x - zoomPos.x * zoom;
        translation.y = mousePosCanvas.y - zoomPos.y * zoom;
      }
    }

    e.stopPropagation();
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "shift") shiftKeyIsDown = false;
    if (e.key.toLowerCase() === "meta" || e.key.toLowerCase() === "control")
      ctrlKeyIsDown = false;
    if (e.key === " ") spaceKeyIsDown = false;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement | null)?.localName === "sl-input") return;

    if (e.shiftKey) shiftKeyIsDown = true;
    if (e.ctrlKey || e.metaKey) ctrlKeyIsDown = true;
    if (e.key === " ") spaceKeyIsDown = true;

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
    ctx.resetTransform();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.translate(translation.x, translation.y);
    ctx.scale(zoom, zoom);

    for (const layer of projectState.layers.get()) {
      if (guiState.visibleLayers[layer.id]) {
        switch (layer.type) {
          case PaintType.TILE:
            for (const [key, paintedTile] of layer.data) {
              const tileset = projectState.tilesets.getTileset(
                paintedTile.ref.tile.tilesetID,
              );

              const [row, col] = key.split(":").map(Number);

              ctx.drawImage(
                tileset.bitmap,
                paintedTile.ref.tile.offsetPos.x,
                paintedTile.ref.tile.offsetPos.y,
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
                autoTileAsset.tile.ref.tile.tilesetID,
              );

              ctx.drawImage(
                tileset.bitmap,
                autoTileAsset.tile.ref.tile.offsetPos.x,
                autoTileAsset.tile.ref.tile.offsetPos.y,
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
    }
    ctx.lineWidth = 1;

    // Draw grid if not to zoomed out bc of performance
    if (zoom >= 0.5 && guiState.showGrid) {
      const { x0, x1, y0, y1 } = getWorldBounds(ctx);

      const startX = Math.floor(x0 / tileSize) * tileSize;
      const startY = Math.floor(y0 / tileSize) * tileSize;
      ctx.beginPath();

      ctx.strokeStyle = gridColor;

      for (let y = startY; y <= y1; y += tileSize) {
        for (let x = startX; x <= x1; x += tileSize) {
          ctx.rect(x, y, tileSize, tileSize);
        }
      }

      ctx.stroke();
    }
  }

  function getWorldBounds(ctx: CanvasRenderingContext2D) {
    const m = ctx.getTransform().invertSelf();

    const topLeft = new DOMPoint(0, 0).matrixTransform(m);
    const bottomRight = new DOMPoint(
      ctx.canvas.width,
      ctx.canvas.height,
    ).matrixTransform(m);

    return {
      x0: topLeft.x,
      y0: topLeft.y,
      x1: bottomRight.x,
      y1: bottomRight.y,
    };
  }

  function update() {
    draw(ctx);
    requestedAnimationFrameID = requestAnimationFrame(update);
  }
</script>

<svelte:window
  onwheel={handleWheel}
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
  onmouseup={handleMouseUp}
/>

<section id="tilemap-editor">
  <canvas
    bind:this={canvasEl}
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
    class:crosshair={!spaceKeyIsDown}
    class:grab={spaceKeyIsDown}
  ></canvas>
</section>

<style lang="postcss">
  #tilemap-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .crosshair {
    cursor: crosshair;
  }

  .grab {
    cursor: grab;
  }

  canvas {
    flex: 1;
    background-color: var(--color-0);
    image-rendering: pixelated;
  }
</style>
