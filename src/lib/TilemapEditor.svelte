<script lang="ts">
  import { onMount, tick } from "svelte";
  import { guiState, projectState, HistoryStack } from "../state.svelte";
  import { roundToDecimal } from "../utils";
  import { PaintType, Tool } from "../types";

  const { tileSize } = $derived(projectState);
  const { gridColor, tilemapEditorState } = $derived(guiState);

  let shiftKeyIsDown = $state(false);
  let ctrlKeyIsDown = $state(false);
  let isMousDown = $state(false);
  let translation = $state({ x: 0, y: 0 });
  let zoom = $state(1);
  let zoomPos = $state({ x: 0, y: 0 });
  let mousePosCanvas = $state({ x: 0, y: 0 });

  let canvasEl!: HTMLCanvasElement;
  let ctx!: CanvasRenderingContext2D;

  onMount(async () => {
    ctx = canvasEl.getContext("2d")!;
    await tick();
    canvasEl.width = canvasEl.clientWidth;
    canvasEl.height = canvasEl.clientHeight;
    ctx.imageSmoothingEnabled = false;

    update(0);
  });

  const handleMouseDown = (e: MouseEvent) => {
    isMousDown = true;

    const rect = canvasEl.getBoundingClientRect();

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const { x, y } = getWorldPos(ctx, { x: screenX, y: screenY });

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    switch (tilemapEditorState.type) {
      case PaintType.AUTO_TILE:
        switch (tilemapEditorState.selectedTool) {
          case Tool.PAINT: {
            if (tilemapEditorState.selectedAsset === null) {
              guiState.notification = {
                variant: "neutral",
                title: "No asset",
                msg: "Select an auto tile!",
              };
              break;
            }

            projectState.layers.paintWithAutoTile(
              row,
              col,
              tilemapEditorState.selectedAsset.ref.id,
              tilemapEditorState.selectedLayer.id,
            );

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
            if (tilemapEditorState.selectedAsset === null) {
              guiState.notification = {
                variant: "neutral",
                title: "No asset",
                msg: "Select a tile!",
              };

              break;
            }

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
            if (tilemapEditorState.selectedAsset === null) {
              guiState.notification = {
                variant: "neutral",
                title: "Select area",
                msg: "No area selected!",
              };
              break;
            }

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

    mousePosCanvas.x = canvasX;
    mousePosCanvas.y = canvasY;

    const { x, y } = getWorldPos(ctx, { x: canvasX, y: canvasY });
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if (isMousDown) {
      switch (tilemapEditorState.type) {
        case PaintType.TILE:
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
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement | null)?.localName === "sl-input") return;

    if (e.shiftKey) shiftKeyIsDown = true;
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
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    ctx.translate(translation.x, translation.y);
    ctx.scale(zoom, zoom);

    // Draw grid if not to zoomed out bc of performance
    if (zoom >= 0.5) {
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

    for (const layer of projectState.layers.get()) {
      if (layer.isVisible) {
        switch (layer.type) {
          case PaintType.TILE:
            for (const [key, tileAsset] of layer.data) {
              const [ty, tx] = key.split(":").map(Number);
              const tile = projectState.tilesets.getTile(
                tileAsset.ref.tileset.id,
                tileAsset.ref.tile.id,
              );

              ctx.drawImage(
                tile.bitmap,
                tx * tileSize,
                ty * tileSize,
                tileSize,
                tileSize,
              );
            }
            break;
          case PaintType.AUTO_TILE:
            for (const [key, autoTileAsset] of layer.data) {
              const [ty, tx] = key.split(":").map(Number);
              const autoTile = projectState.autoTiles.getAutoTile(
                autoTileAsset.ref.id,
              );
              const tileRule = autoTile.rules.find(
                (tr) => tr.id === autoTileAsset.tileRule.id,
              );

              if (tileRule?.tile) {
                const tile = projectState.tilesets.getTile(
                  tileRule.tile.ref.tileset.id,
                  tileRule.tile.ref.tile.id,
                );

                ctx.drawImage(
                  tile.bitmap,
                  tx * tileSize,
                  ty * tileSize,
                  tileSize,
                  tileSize,
                );
              }
            }
            break;
          case PaintType.AREA:
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
  }

  function getWorldBounds(ctx: CanvasRenderingContext2D) {
    const m = ctx.getTransform().invertSelf();

    const topLeft = new DOMPoint(0, 0).matrixTransform(m);
    const bottomRight = new DOMPoint(
      canvasEl.width,
      canvasEl.height,
    ).matrixTransform(m);

    return {
      x0: topLeft.x,
      y0: topLeft.y,
      x1: bottomRight.x,
      y1: bottomRight.y,
    };
  }

  function update(elasped: number) {
    draw(ctx);
    requestAnimationFrame((elapsed) => update(elapsed));
  }
</script>

<svelte:window
  onwheel={handleWheel}
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
  onmouseup={handleMouseUp}
/>

<section>
  <canvas
    bind:this={canvasEl}
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
  ></canvas>
</section>

<style lang="postcss">
  section {
    flex: 1;
  }

  canvas {
    cursor: crosshair;
  }

  canvas {
    background-color: var(--color-0);
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
</style>
