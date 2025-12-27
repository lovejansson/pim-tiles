<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    guiState,
    projectState,
    HistoryStack,
  } from "../state.svelte";
  import { getNeighbours, isPointInRect, roundToDecimal } from "../utils";

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
      case "auto-tile":
        switch (tilemapEditorState.selectedTool) {
          case "paint":
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
               tilemapEditorState.selectedLayer.id
            );

            break;
          case "erase":
            projectState.layers.eraseAutoTile(
              row,
              col,
              tilemapEditorState.selectedLayer.id
            );
            break;
        }
        break;
      case "tile":
        switch (tilemapEditorState.selectedTool) {
          case "paint":
            if (tilemapEditorState.selectedAsset === null) {
              guiState.notification = {
                variant: "neutral",
                title: "No asset",
                msg: "Select a tile!",
              };

              break;
            }

            if (tilemapEditorState.fillToolIsActive) {
              const filledTiles = floodFill(
                tilemapEditorState.selectedLayer.id,
                row,
                col,
              );
              if (filledTiles !== null) {
                for (const tile of filledTiles) {
                  projectState.layers.paintTile(
                    tile.row,
                    tile.col,
                    tilemapEditorState.selectedLayer.id,
                    tilemapEditorState.selectedAsset,
                  );
                }
              } else {
                guiState.notification = {
                  variant: "neutral",
                  title: "Fill error",
                  msg: "You can't fill a non enclosed area",
                };
              }
            } else {
              projectState.layers.paintTile(
                row,
                col,
                tilemapEditorState.selectedLayer.id,
                tilemapEditorState.selectedAsset,
              );
            }

            break;
          case "erase":
            if (tilemapEditorState.fillToolIsActive) {
              const filledTiles = floodFill(
                tilemapEditorState.selectedLayer.id,
                row,
                col,
              );
              if (filledTiles !== null) {
                for (const tile of filledTiles) {
                  projectState.layers.eraseTile(
                    tile.row,
                    tile.col,
                    tilemapEditorState.selectedLayer.id,
                  );
                }
              } else {
                guiState.notification = {
                  variant: "neutral",
                  title: "Fill error",
                  msg: "You can't fill a non enclosed area",
                };
              }
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
      case "area":
        switch (tilemapEditorState.selectedTool) {
          case "paint":
            if (tilemapEditorState.selectedAsset === null) {
              guiState.notification = {
                variant: "neutral",
                title: "Select area",
                msg: "No area selected!",
              };
              break;
            }

            if (tilemapEditorState.fillToolIsActive) {
              const filledTiles = floodFill(
                tilemapEditorState.selectedLayer.id,
                row,
                col,
              );
              if (filledTiles !== null) {
                for (const tile of filledTiles) {
                  projectState.layers.paintTile(
                    tile.row,
                    tile.col,
                    tilemapEditorState.selectedLayer.id,
                    tilemapEditorState.selectedAsset,
                  );
                }
              } else {
                guiState.notification = {
                  variant: "neutral",
                  title: "Fill error",
                  msg: "You can't fill a non enclosed area",
                };
              }
            } else {
              projectState.layers.paintTile(
                row,
                col,
                tilemapEditorState.selectedLayer.id,
                tilemapEditorState.selectedAsset,
              );
            }

            break;
          case "erase":
            projectState.layers.eraseTile(
              row,
              col,
              tilemapEditorState.selectedLayer.id,
            );
            break;
        }

        break;
      case "image":
        if (ctrlKeyIsDown) {
          for (const i of tilemapEditorState.selectedLayer.data.toReversed()) {
            const image = projectState.images.getImage(i.ref.id);

            if (image === undefined) {
              throw new Error("Image not found");
            }

            if (
              isPointInRect(
                { x, y },
                { x: i.x, y: i.y, width: image.width, height: image.height },
              )
            ) {
              i.isSelected = true;
              break;
            }
          }
        } else if (
          tilemapEditorState.selectedLayer.data.find((i) => i.isSelected)
        ) {
          for (const i of tilemapEditorState.selectedLayer.data) {
            i.isSelected = false;
          }
        } else {
          if (tilemapEditorState.selectedAsset === null) {
            guiState.notification = {
              variant: "neutral",
              title: "Select image",
              msg: "No image selected!",
            };
            break;
          }

          tilemapEditorState.selectedLayer.data.push({
            ...tilemapEditorState.selectedAsset,
            x,
            y,
            isSelected: false,
          });
        }
        break;
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
        case "tile":
          if (tilemapEditorState.fillToolIsActive) break;

          switch (tilemapEditorState.selectedTool) {
            case "paint":
              if (tilemapEditorState.selectedAsset !== null) {
                tilemapEditorState.selectedLayer.data.set(`${row}:${col}`, {
                  ...tilemapEditorState.selectedAsset,
                });
              }
              break;
            case "erase":
              tilemapEditorState.selectedLayer.data.delete(`${row}:${col}`);
              break;
          }

          break;
        case "area":
          if (tilemapEditorState.fillToolIsActive) break;

          switch (tilemapEditorState.selectedTool) {
            case "paint":
              if (tilemapEditorState.selectedAsset !== null) {
                tilemapEditorState.selectedLayer.data.set(`${row}:${col}`, {
                  ...tilemapEditorState.selectedAsset,
                });
              }
              break;
            case "erase":
              tilemapEditorState.selectedLayer.data.delete(`${row}:${col}`);
              break;
          }
          break;
        case "image":
          if (ctrlKeyIsDown) {
            for (const i of tilemapEditorState.selectedLayer.data) {
              if (i.isSelected) {
                i.x += e.movementX * (1 / zoom);
                i.y += e.movementY * (1 / zoom);
              }
            }
          }

          break;
      }
    }
  };

  function floodFill(
    layerID: string,
    row: number,
    col: number,
  ): { row: number; col: number }[] | null {
    const clickedTile = projectState.layers.getTileAt(row, col, layerID);
    const BOUNDARY = 100;
    const minRow = row - BOUNDARY;
    const maxRow = row + BOUNDARY;
    const minCol = col - BOUNDARY;
    const maxCol = col + BOUNDARY;

    const stack = [{ row, col }];

    const visited = new Set();

    visited.add(`${row}:${col}`);

    const filledTiles: { row: number; col: number }[] = [];

    while (stack.length > 0) {
      const tile = stack.pop()!;

      if (
        tile.row < minRow ||
        tile.row > maxRow ||
        tile.col < minCol ||
        tile.col > maxCol
      ) {
        return null;
      }

      const neighbours = getNeighbours({ row: tile.row, col: tile.col });

      for (const n of neighbours) {
        const visitedKey = `${n.row}:${n.col}`;

        if (
          !visited.has(visitedKey) &&
          projectState.utils.isSameAsset(
            clickedTile,
            projectState.layers.getTileAt(n.row, n.col, layerID),
          )
        ) {
          visited.add(`${n.row}:${n.col}`);
          stack.push(n);
        }
      }

      filledTiles.push(tile);
    }

    return filledTiles;
  }

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
    const zoomFactor = 0.125;

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
      case "arrowup":
      case "w":
        translation.y += tileSize;
        break;
      case "arrowdown":
      case "s":
        translation.y -= tileSize;
        break;
      case "arrowleft":
      case "a":
        translation.x += tileSize;
        break;
      case "arrowright":
      case "d":
        translation.x -= tileSize;
        break;
      case "+":
        if (zoom <= 5.0) {
          zoom += 0.1;
          zoomPos = getWorldPos(ctx, {
            x: mousePosCanvas.x,
            y: mousePosCanvas.y,
          });
          // Update current translation to account for zoompoint
          translation.x = mousePosCanvas.x - zoomPos.x * zoom;
          translation.y = mousePosCanvas.y - zoomPos.y * zoom;
        }
        break;
      case "-":
        if (zoom > 0.5) {
          zoom -= 0.1;
          zoomPos = getWorldPos(ctx, {
            x: mousePosCanvas.x,
            y: mousePosCanvas.y,
          });
          // Update current translation to account for zoompoint
          translation.x = mousePosCanvas.x - zoomPos.x * zoom;
          translation.y = mousePosCanvas.y - zoomPos.y * zoom;
        }
        break;
      case "del":
      case "backspace":
        if (tilemapEditorState.type === "image")
          tilemapEditorState.selectedLayer.data =
            tilemapEditorState.selectedLayer.data.filter((l) => !l.isSelected);
        break;
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

    for (const layer of projectState.layers.get()) {
      if (layer.isVisible) {
        switch (layer.type) {
          case "tile":
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
          case "auto-tile":
            for (const [key, autoTileAsset] of layer.data) {
              const [ty, tx] = key.split(":").map(Number);
              const autoTile = projectState.autoTiles.getAutoTile(
                autoTileAsset.ref.id,
              );
              const tileRule = autoTile.rules.find(
                (tr) => tr.id === autoTileAsset.tileRule.ref.id,
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

          case "image":
            for (const i of layer.data) {
              const image = projectState.images.getImage(i.ref.id);

              ctx.drawImage(image.bitmap, i.x, i.y, image.width, image.height);

              if (i.isSelected) {
                ctx.strokeStyle = "lime";
                ctx.strokeRect(i.x, i.y, image.width, image.height);
              }
            }
            break;
          case "area":
            for (const [key, areaAsset] of layer.data) {
              const area = projectState.areas.getArea(areaAsset.ref.id);

              const [ty, tx] = key.split(":").map(Number);

              ctx.strokeStyle = area.color;

              ctx.strokeRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
            }

            break;
        }
      }
    }

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

<canvas
  bind:this={canvasEl}
  onmousemove={handleMouseMove}
  onmousedown={handleMouseDown}
  class:cursor-crosshair={["area", "tile", "auto-tile"].includes(
    tilemapEditorState.type,
  )}
></canvas>

<style lang="postcss">
  .cursor-crosshair {
    cursor: crosshair;
  }
  canvas {
    background-color: var(--color-0);
    width: 100%;
    height: 100%;
  }
</style>
