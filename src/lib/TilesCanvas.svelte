<script lang="ts">
    import { onMount } from "svelte";
    import {
        PaintType,
        type Point,
        type TileAsset,
        type Tileset,
    } from "../types";
    import { guiState, projectState } from "../state.svelte";
    import { roundToDecimal } from "../utils";

    type TilesCanvasProps = {
        tileset: Tileset;
        multipleSelection?: boolean;
        onSelect: (selectedTiles: TileAsset[]) => void;
    };

    type Selection = {
        x1: number;
        x2: number;
        y1: number;
        y2: number;
    };

    let { tileset, onSelect, multipleSelection }: TilesCanvasProps = $props();

    let tileSize = $derived(projectState.tileSize);

    let selection: Selection | null = $state(null);

    let canvasEl!: HTMLCanvasElement;
    let ctx!: CanvasRenderingContext2D;

    let spaceKeyIsDown = $state(false); //  $state needed for UI

    let translation = { x: 0, y: 0 };
    let zoom = 1;
    let zoomPos = { x: 0, y: 0 };

    let mousePosCanvas = { x: 0, y: 0 };
    let isMousDown = false;

    let selectionStartPos: Point = { x: 0, y: 0 };

    onMount(() => {
        if (!canvasEl) return;
        ctx = canvasEl.getContext("2d")!;

        const ro = new ResizeObserver(([entry]) => {
            if (entry.contentRect.width === 0) return;
            canvasEl.width = entry.contentRect.width;
            canvasEl.height = entry.contentRect.height;
            ctx.imageSmoothingEnabled = false;
            ro.disconnect();
            update();
        });

        ro.observe(canvasEl);

        return () => {
            ro.disconnect();
        };
    });

    function update() {
        draw(ctx);
        requestAnimationFrame(update);
    }

    const updateSelectedTiles = (selection: Selection) => {
        const selectedTiles: TileAsset[] = [];

        const minX = Math.min(selection.x1, selection.x2);
        const maxX = Math.max(selection.x1, selection.x2);
        const minY = Math.min(selection.y1, selection.y2);
        const maxY = Math.max(selection.y1, selection.y2);

        for (let y = minY; y < maxY; y += tileSize) {
            for (let x = minX; x < maxX; x += tileSize) {
                const tile = tileset.tiles.find(
                    (t) => t.offsetPos.x === x && t.offsetPos.y === y,
                );

                if (tile !== undefined) {
                    selectedTiles.push({
                        type: PaintType.TILE,
                        ref: {
                            tile: tile,
                        },
                    });
                }
            }
        }
        console.log("MKFLSm");
        onSelect(selectedTiles);
    };

    const handleMouseDown = (e: MouseEvent) => {
        isMousDown = true;

        if (!spaceKeyIsDown) {
            const rect = canvasEl.getBoundingClientRect();

            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;

            const { x, y } = getWorldPos(ctx, { x: canvasX, y: canvasY });

            selectionStartPos = { x, y };

            selection = getSelectionRect({ x, y }, { x, y });
        }
    };

    function getSelectionRect(
        startPos: { x: number; y: number },
        mousePos: { x: number; y: number },
    ) {
        let rect: Selection = { x1: 0, y1: 0, x2: 0, y2: 0 };

        if (startPos.x <= mousePos.x) {
            rect.x1 = Math.floor(startPos.x / tileSize) * tileSize;
            rect.x2 = Math.ceil(mousePos.x / tileSize) * tileSize;
        } else {
            rect.x1 = Math.ceil(startPos.x / tileSize) * tileSize;
            rect.x2 = Math.floor(mousePos.x / tileSize) * tileSize;
        }

        if (startPos.y <= mousePos.y) {
            rect.y1 = Math.floor(startPos.y / tileSize) * tileSize;
            rect.y2 = Math.ceil(mousePos.y / tileSize) * tileSize;
        } else {
            rect.y1 = Math.ceil(startPos.y / tileSize) * tileSize;
            rect.y2 = Math.floor(mousePos.y / tileSize) * tileSize;
        }

        return rect;
    }

    const handleMouseUp = (e: MouseEvent) => {
        if (e.target !== canvasEl) return;
        if (isMousDown) isMousDown = false;

        if (selection) {
            updateSelectedTiles(selection);
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (e.target !== canvasEl) return;

        const rect = canvasEl.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

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

            if (multipleSelection && selection !== null) {
                const { x, y } = getWorldPos(ctx, {
                    x: canvasX,
                    y: canvasY,
                });

                selection = getSelectionRect(selectionStartPos, { x, y });
            }
        }
    };

    const handleWheel = (e: WheelEvent) => {
        if (e.target !== canvasEl) return;

        const delta = Math.sign(e.deltaY);
        const zoomFactor = 0.375;

        if (delta < 0) {
            if (zoom < 6.0) {
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
        if (e.key === " ") spaceKeyIsDown = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement | null)?.localName === "sl-input") return;

        if (e.key === " ") spaceKeyIsDown = true;
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

    function draw(ctx: CanvasRenderingContext2D) {
        ctx.resetTransform();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.translate(translation.x, translation.y);
        ctx.scale(zoom, zoom);
        ctx.drawImage(tileset.bitmap, 0, 0);

        // Draw grid if not to zoomed out bc of performance
        if (zoom >= 0.5 && guiState.showGrid) {
            const { x0, x1, y0, y1 } = getWorldBounds(ctx);

            const startX = Math.floor(x0 / tileSize) * tileSize;
            const startY = Math.floor(y0 / tileSize) * tileSize;

            ctx.beginPath();

            ctx.strokeStyle = guiState.gridColor;

            for (let y = startY; y <= y1; y += tileSize) {
                for (let x = startX; x <= x1; x += tileSize) {
                    ctx.rect(x, y, tileSize, tileSize);
                }
            }

            ctx.stroke();
        }

        if (selection !== null) {
            ctx.strokeStyle = "aqua";
            ctx.strokeRect(
                selection.x1,
                selection.y1,
                selection.x2 - selection.x1,
                selection.y2 - selection.y1,
            );
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
</script>

<svelte:window
    onwheel={handleWheel}
    onmouseup={handleMouseUp}
    onkeydown={handleKeyDown}
    onkeyup={handleKeyUp}
/>

<canvas
    bind:this={canvasEl}
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
    class:crosshair={!spaceKeyIsDown}
    class:grab={spaceKeyIsDown}
></canvas>

<style>
    .crosshair {
        cursor: crosshair;
    }

    .grab {
        cursor: grab;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
        image-rendering: pixelated;
    }
</style>
