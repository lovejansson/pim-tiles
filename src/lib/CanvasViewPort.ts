import { type Point } from "../types";
import { isPointInRect } from "../utils";

type ZoomSettings = {
    min: number;
    max: number;
    speed: number;
};

type PanSettings = {
    key?: string;
};

type GridSettings = {
    showGrid: boolean;
    gridColor: string;
    tileSize: number;
}

export type SelectionRect = {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
};

export type CanvasViewportOptions = {
    zoom?: ZoomSettings;
    pan?: PanSettings;
    selection?: boolean;
    grid: GridSettings;
    drawLoop?: boolean;
    draw: (ctx: CanvasRenderingContext2D) => void;
    defaultCursor?: string;
};

export class CanvasViewPortPaintEvent extends Event {
    pos: Point;

    constructor(pos: Point) {
        super("paint");
        this.pos = pos;
    }
}

export class CanvasViewPortSelectEvent extends Event {
    selection: SelectionRect | null;

    constructor(selection: SelectionRect | null) {
        super("select");
        this.selection = selection;
    }
}

export class CanvasViewPortSelectionDragEvent extends Event {
    delta: Point;

    constructor(delta: Point) {
        super("selection-drag");
        this.delta = delta;
    }
}

export default class CanvasViewport extends EventTarget {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    zoom: number;
    private translation: Point;

    private zoomSettings: ZoomSettings | null;
    private panSettings: PanSettings | null;
    private isSelectionEnabled: boolean;
    private gridSettings: GridSettings;
    private drawLoop: boolean;
    private cursor: string;

    private isPanKeyDown: boolean;
    private dragPos: Point;
    private isMouseDown: boolean;

    private selectionStartPos: Point;
    private selectionRect: SelectionRect | null;

    private isDraggingSelection: boolean;

    private drawFunc: (ctx: CanvasRenderingContext2D) => void;

    constructor(canvas: HTMLCanvasElement, options: CanvasViewportOptions) {
        super();
        this.canvas = canvas;

        const ctx = this.canvas.getContext("2d");
        if (ctx === null) throw new Error("Canvas ctx is null");
        this.ctx = ctx;

        this.ctx.imageSmoothingEnabled = false;

        this.zoom = 1;

        this.translation = { x: 0, y: 0 };

        this.dragPos = { x: 0, y: 0 };

        this.zoomSettings = options.zoom ?? null;

        this.gridSettings = options.grid;

        this.panSettings = options.pan ?? null;

        this.isSelectionEnabled = options.selection ?? false;

        this.drawLoop = options.drawLoop ?? true;

        this.drawFunc = options.draw;

        this.isPanKeyDown = false;
        this.isMouseDown = false;

        this.cursor = options.defaultCursor ?? "default";

        this.selectionStartPos = { x: 0, y: 0 };

        this.selectionRect = null;

        this.isDraggingSelection = false;
    }

    get width(): number {
        return this.canvas.width;
    }

    set width(width: number) {
        const rounded = Math.round(width);
        this.canvas.width = rounded;
        this.ctx.imageSmoothingEnabled = false;
        if (!this.drawLoop) this.draw();
    }

    get height(): number {
        return this.canvas.height;
    }

    set height(height: number) {
        const rounded = Math.round(height);
        this.canvas.height = rounded;
        this.ctx.imageSmoothingEnabled = false;
        if (!this.drawLoop) this.draw();
    }

    set gridColor(gridColor: string) {
        this.gridSettings.gridColor = gridColor;
    }

    set showGrid(showGrid: boolean) {
        this.gridSettings.showGrid = showGrid;
    }

    set tileSize(tileSize: number) {
        this.gridSettings.tileSize = tileSize;
    }

    enableSelection() {
        this.isSelectionEnabled = true;
    }

    disabledSelection() {
        this.isSelectionEnabled = false;
    }

    init() {

        this.addEventListeners();

        this.canvas.style.cursor = this.cursor;

        if (this.drawLoop) {
            this.loop();
        } else {
            this.draw();
        }
    }

    loop() {
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    draw() {

        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.translate(this.translation.x, this.translation.y);
        this.ctx.scale(this.zoom, this.zoom);
        this.drawFunc(this.ctx);

        // Draw grid if not to zoomed out bc of performance
        if (this.zoom >= 0.5 && this.gridSettings.showGrid) {
            const { x0, x1, y0, y1 } = this.getWorldBounds();

            const tileSize = this.gridSettings.tileSize;

            const startX = Math.floor(x0 / tileSize) * tileSize;
            const startY = Math.floor(y0 / tileSize) * tileSize;

            this.ctx.beginPath();

            this.ctx.strokeStyle = this.gridSettings.gridColor;

            for (let y = startY; y <= y1; y += tileSize) {
                for (let x = startX; x <= x1; x += tileSize) {
                    this.ctx.rect(x, y, tileSize, tileSize);
                }
            }

            this.ctx.stroke();
        }

        if (this.selectionRect !== null) {
            this.ctx.strokeStyle = "aqua";
            this.ctx.strokeRect(
                this.selectionRect.x1,
                this.selectionRect.y1,
                this.selectionRect.x2 - this.selectionRect.x1,
                this.selectionRect.y2 - this.selectionRect.y1,
            );
        }
    }

    private isZoomEnabled(
        zoomSettings: ZoomSettings | null,
    ): zoomSettings is ZoomSettings {
        return zoomSettings !== null;
    }

    private isPanEnabled(
        panSettings: PanSettings | null,
    ): panSettings is PanSettings {
        return panSettings !== null;
    }

    private addEventListeners() {

        if (this.isZoomEnabled(this.zoomSettings)) {

            addEventListener("wheel", (e: WheelEvent) => {

                if (e.target !== this.canvas) return;

                if (!this.isZoomEnabled(this.zoomSettings)) return;

                const delta = Math.sign(e.deltaY);

                const rect = this.canvas.getBoundingClientRect();

                const x = e.clientX - rect.x;
                const y = e.clientY - rect.y;

                if (delta < 0) {

                    if (this.zoom < this.zoomSettings.max) {

                        const worldPos = this.getWorldPos({
                            x,
                            y,
                        });

                        this.zoom = roundToDecimal(this.zoom + this.zoomSettings.speed, 3);

                        /**
                         * To calculate:
                         *
                         * Screen/Mouse pos = World pos * zoom + translation
                         *
                         * Now when zoomPos, mousePos and zoom changes we need to update translation values.
                         *
                         * Solve for translation:
                         *
                         * Translation = mouse pos - world pos * zoom
                         *
                         */
                        this.translation.x = Math.round(x - worldPos.x * this.zoom);
                        this.translation.y = Math.round(y - worldPos.y * this.zoom);
                    }
                } else {

                    if (this.zoom >= this.zoomSettings.min) {

                        this.zoom = roundToDecimal(this.zoom - this.zoomSettings.speed, 3);

                        const worldPos = this.getWorldPos({
                            x,
                            y,
                        });

                        this.translation.x = Math.round(x - worldPos.x * this.zoom);
                        this.translation.y = Math.round(y - worldPos.y * this.zoom);
                    }
                }

                e.stopPropagation();

            });
        }

        if (this.isPanEnabled(this.panSettings) || this.isSelectionEnabled) {

            addEventListener("keydown", (e: KeyboardEvent) => {

                if (!this.isPanEnabled(this.panSettings)) return;

                if (e.key === this.panSettings.key) {
                    this.canvas.style.cursor = "grab";
                    this.isPanKeyDown = true;
                }
            });

            addEventListener("keyup", (e: KeyboardEvent) => {

                if (!this.isPanEnabled(this.panSettings)) return;

                if (e.key === this.panSettings.key) {
                    this.canvas.style.cursor = this.cursor;
                    this.isPanKeyDown = false;
                }
            });

            this.canvas.addEventListener("mousedown", (e: MouseEvent) => {

                if (e.target !== this.canvas) return;

                this.isMouseDown = true;

                const rect = this.canvas.getBoundingClientRect();

                const canvasX = Math.round(e.clientX - rect.left);

                const canvasY = Math.round(e.clientY - rect.top);

                const { x, y } = this.getWorldPos({ x: canvasX, y: canvasY });

                if (this.isPanKeyDown) {

                    this.dragPos.x = canvasX;
                    this.dragPos.y = canvasY;

                } else if (this.isSelectionEnabled) {

                    if (this.selectionRect !== null && isPointInRect({ x, y }, { x: this.selectionRect.x1, y: this.selectionRect.y1, height: this.selectionRect.y2 - this.selectionRect.y1, width: this.selectionRect.x2 - this.selectionRect.x1 })) {

                        this.isDraggingSelection = true;
                        this.dragPos.x = canvasX;
                        this.dragPos.y = canvasY;

                    } else {
                        this.dispatchEvent(new CanvasViewPortSelectEvent(null));
                        this.selectionStartPos = { x, y };
                        this.selectionRect = this.getSelectionRect({ x, y }, { x, y });
                    }

                } else {
                    this.dispatchEvent(new CanvasViewPortPaintEvent({ x, y }));
                }
            });

            this.canvas.addEventListener("mousemove", (e: MouseEvent) => {

                if (e.target !== this.canvas) return;

                if (this.isMouseDown) {

                    const rect = this.canvas.getBoundingClientRect();

                    const canvasX = Math.round(e.clientX - rect.left);

                    const canvasY = Math.round(e.clientY - rect.top);

                    const worldPos = this.getWorldPos({ x: canvasX, y: canvasY });

                    if (this.isPanKeyDown) {

                        this.translation.x += (canvasX - this.dragPos.x);

                        this.translation.y += (canvasY - this.dragPos.y);

                        this.dragPos = { x: canvasX, y: canvasY };

                    } else if (this.isSelectionEnabled && this.selectionRect !== null) {

                        if (this.isDraggingSelection) {

                            const deltaX = canvasX - this.dragPos.x;
                            const deltaY = canvasY - this.dragPos.y;

                            let shouldemitDeltaX = false;
                            let shouldemitDeltaY = false;

                            if(Math.abs(deltaX) >= this.gridSettings.tileSize)  {
                                this.selectionRect.x1 += deltaX;
                                this.selectionRect.x2 += deltaX;
                                this.dragPos.x = canvasX;
                                shouldemitDeltaX = true;
                            } 

                            
                            if(Math.abs(deltaY) >= this.gridSettings.tileSize)  {
                                this.selectionRect.y1 += deltaY;
                                this.selectionRect.y2 += deltaY;
                                this.dragPos.y = canvasY;
                                shouldemitDeltaY = true;
                            } 

                            if(shouldemitDeltaX && shouldemitDeltaY) {
                                this.dispatchEvent(new CanvasViewPortSelectionDragEvent({x: deltaX, y: deltaY}))
                            } else if(shouldemitDeltaX) {
                                    this.dispatchEvent(new CanvasViewPortSelectionDragEvent({x: deltaX, y: 0}))
                            } else if (shouldemitDeltaY) {
                                    this.dispatchEvent(new CanvasViewPortSelectionDragEvent({x: 0, y: deltaY}))
                            }


                        } else {

                            this.selectionRect = this.getSelectionRect(this.selectionStartPos, worldPos);
                        }

                    } else {

                        this.dispatchEvent(new CanvasViewPortPaintEvent(worldPos));
                    }
                }

            });

            this.canvas.addEventListener("mouseup", (_: MouseEvent) => {
                this.dragPos.x = 0;
                this.dragPos.y = 0;
                this.isMouseDown = false;
                this.isDraggingSelection = false;

        
                if (this.selectionRect !== null) {
                    this.dispatchEvent(new CanvasViewPortSelectEvent(this.selectionRect));
                }
            });

            this.canvas.addEventListener("click", (e: MouseEvent) => {

                if (e.target !== this.canvas) return;


                const rect = this.canvas.getBoundingClientRect();

                const x = Math.round(e.clientX - rect.left);
                const y = Math.round(e.clientY - rect.top);

                const worldPos = this.getWorldPos({
                    x,
                    y,
                });

                this.dispatchEvent(new CustomEvent("click", { detail: { pos: worldPos } }));

            });
        }
    }

    private getWorldBounds() {

        const m = this.ctx.getTransform().invertSelf();

        const topLeft = new DOMPoint(0, 0).matrixTransform(m);
        const bottomRight = new DOMPoint(
            this.ctx.canvas.width,
            this.ctx.canvas.height,
        ).matrixTransform(m);

        return {
            x0: topLeft.x,
            y0: topLeft.y,
            x1: bottomRight.x,
            y1: bottomRight.y,
        };
    }


    private getSelectionRect(
        startPos: { x: number; y: number },
        mousePos: { x: number; y: number },
    ): SelectionRect {
        let rect: SelectionRect = { x1: 0, y1: 0, x2: 0, y2: 0 };

        const tileSize = this.gridSettings.tileSize;

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

    private getWorldPos(pos: Point) {
        // Uses the inverse translation matrix to convert a position on the canvas/screen to the world.
        const inv = this.ctx.getTransform().invertSelf();
        const p = new DOMPoint(pos.x, pos.y).matrixTransform(inv);
        return { x: p.x, y: p.y };
    }
}

function roundToDecimal(num: number, decmialPlaces: number) {
    return (
        Math.round(num * Math.pow(10, decmialPlaces)) / Math.pow(10, decmialPlaces)
    );
}
