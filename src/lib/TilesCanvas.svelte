<script lang="ts">
    import { onMount } from "svelte";
    import type { Cell, Tile, Tileset } from "../types";
    import { guiState, projectState } from "../state.svelte";

    type TilesCanvasProps = {
        tileset: Tileset;
    };

    let { tileset }: TilesCanvasProps = $props();

    let tiles: (Tile & Cell)[] = $state(
        tileset.tiles.map((t, i) => ({
            row: Math.floor(i / 10),
            col: i % 10,
            ...t,
        })),
    );

    let selection: null | {
        row: number;
        col: number;
        rows: number;
        cols: number;
    } = $state(null);

    let canvasEl!: HTMLCanvasElement;
    let ctx!: CanvasRenderingContext2D;

    let isMousDown = $state(false);
    let translation = $state({ x: 0, y: 0 });
    let zoom = $state(1);
    let zoomPos = $state({ x: 0, y: 0 });
    let mousePosCanvas = $state({ x: 0, y: 0 });

    onMount(() => {
        if (!canvasEl) return;
        ctx = canvasEl.getContext("2d")!;

        const ro = new ResizeObserver(([entry]) => {
            if (entry.contentRect.width === 0) return;
            canvasEl.width = entry.contentRect.width;
            canvasEl.height = entry.contentRect.height;
            ctx.imageSmoothingEnabled = false;

            ro.disconnect();
        });

        ro.observe(canvasEl);

        update(0);

        return () => ro.disconnect();
    });

    const handleMouseDown = (e: MouseEvent) => {
        isMousDown = true;

        const rect = canvasEl.getBoundingClientRect();

        const tileSize = projectState.tileSize;

        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        const { x, y } = getWorldPos(ctx, { x: canvasX, y: canvasY });

        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);

        selection = { row, col, rows: 1, cols: 1 };
    };

    const handleMouseUp = () => {
        if (isMousDown) {
            isMousDown = false;
    
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!canvasEl) return;

        const rect = canvasEl.getBoundingClientRect();
        const tileSize = projectState.tileSize;
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        mousePosCanvas.x = canvasX;
        mousePosCanvas.y = canvasY;

        const { x, y } = getWorldPos(ctx, { x: canvasX, y: canvasY });


        if(isMousDown && selection !== null) {

            const col = Math.ceil(x / tileSize);
            const row = Math.ceil(y / tileSize);

            selection.rows = row - selection.row;
            selection.cols = col - selection.col;


        }
    };

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
        if (!canvasEl || !ctx) return;
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

        ctx.translate(translation.x, translation.y);
        ctx.scale(zoom, zoom);

        const tileSize = projectState.tileSize;

        for (const tile of tiles) {
            ctx.drawImage(
                tile.bitmap,
                tile.col * tileSize,
                tile.row * tileSize,
                tileSize,
                tileSize,
            );
        }

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
                selection.col * tileSize,
                selection.row * tileSize,
                selection.cols   * tileSize ,
                selection.rows * tileSize,
            );
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

    function roundToDecimal(num: number, decimalPlaces: number) {
        const factor = Math.pow(10, decimalPlaces);
        return Math.round(num * factor) / factor;
    }
</script>

<svelte:window onwheel={handleWheel} onmouseup={handleMouseUp} />

<canvas
    bind:this={canvasEl}
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
></canvas>

<style>
    canvas {
        width: 100%;
        height: 100%;
        display: block;
        image-rendering: pixelated;
    }
</style>
