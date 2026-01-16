<script lang="ts">
    import { onMount } from "svelte";
    import {
        PaintType,
        type Cell,
        type SelectedTiles,
        type Tile,
        type Tileset,
    } from "../types";
    import { guiState, projectState } from "../state.svelte";
    import { roundToDecimal } from "../utils";

    type TilesCanvasProps = {
        tileset: Tileset;
        multipleSelection?: boolean;
        onSelect: (selectedTiles: SelectedTiles) => void;
    };

    type Selection = {
        row: number;
        col: number;
        rows: number;
        cols: number;
    };

    let { tileset, onSelect, multipleSelection }: TilesCanvasProps = $props();


    let selection: Selection | null = $state(null);

    let canvasEl!: HTMLCanvasElement;
    let ctx!: CanvasRenderingContext2D;

    let spaceKeyIsDown = $state(false);
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
            update();
            ro.disconnect();
        });

        ro.observe(canvasEl);

        return () => {
            ro.disconnect();
        };
    });

    const updateSelectedTiles = (selection: Selection) => {
        const selectedTiles: SelectedTiles = [];

        for (let r = selection.row; r < selection.row + selection.rows; ++r) {
            for (
                let c = selection.col;
                c < selection.col + selection.cols;
                ++c
            ) {
                const tile = tileset.tiles.find((t) => t.row === r && t.col === c);

                if (tile !== undefined) {
                    selectedTiles.push({
                        asset: {
                            type: PaintType.TILE,
                            ref: {
                                tile: { id: tile.id },
                                tileset: { id: tileset.id },
                            },
                        },
                        cell: {
                            row: tile.row - selection.row,
                            col: tile.col - selection.col,
                        },
                    });
                }
            }
        }

        onSelect(selectedTiles);
    };

    const handleMouseDown = (e: MouseEvent) => {
        isMousDown = true;

        const rect = canvasEl.getBoundingClientRect();

        const tileSize = projectState.tileSize;

        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        const { x, y } = getWorldPos(ctx, { x: canvasX, y: canvasY });

        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);

        if(!spaceKeyIsDown) {
                selection = { row, col, rows: 1, cols: 1 };

            updateSelectedTiles(selection);
        }

     
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

            if (multipleSelection) {
                const { x, y } = getWorldPos(ctx, { x: canvasX, y: canvasY });

                if (selection !== null) {
                    const col = Math.ceil(x / tileSize);
                    const row = Math.ceil(y / tileSize);

                    selection.rows = row - selection.row;
                    selection.cols = col - selection.col;

                    updateSelectedTiles(selection);
                }
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

        const tileSize = projectState.tileSize;

        for (const tile of tileset.tiles) {
        
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
                selection.cols * tileSize,
                selection.rows * tileSize,
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

    function update() {
        draw(ctx);
        requestAnimationFrame(update);
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
