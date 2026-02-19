import { type Cell, type Point } from "../types";
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
  width: number;
  height: number;
};

export type SelectionRect = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export type TilemapViewportOptions = {
  zoom?: ZoomSettings;
  pan?: PanSettings;
  selection?: boolean;
  grid: GridSettings;
  draw: (ctx: CanvasRenderingContext2D) => void;
  defaultCursor?: string;
};

export class TilemapViewportPaintEvent extends Event {
  cell: Cell;

  constructor(cell: Cell) {
    super("paint");
    this.cell = cell;
  }
}

export class TilemapViewportSelectEvent extends Event {
  selection: SelectionRect | null;

  constructor(selection: SelectionRect | null) {
    super("select");
    this.selection = selection;
  }
}

export class TilemapViewportSelectionDragEvent extends Event {
  delta: Point;

  constructor(delta: Point) {
    super("selection-drag");
    this.delta = delta;
  }
}

export class TilemapViewportRightClickEvent extends Event {
  pos: Point;

  constructor(pos: Point) {
    super("right-click");
    this.pos = pos;
  }
}

export class TilemapViewportMousePosEvent extends Event {
  pos: Point;

  constructor(pos: Point) {
    super("mouse-pos");
    this.pos = pos;
  }
}

/**
 * @class TilemapViewport
 * 
 * Handles:   
 * 
 * - Pan
 * - Zoom
 * - Selection
 * - Grid
 */
export default class TilemapViewport extends EventTarget {
  private canvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ctxOverlay: CanvasRenderingContext2D;


  zoom: number;
  private translation: Point;

  private zoomSettings: ZoomSettings | null;
  private panSettings: PanSettings | null;
  private isSelectionEnabled: boolean;
  private gridSettings: GridSettings;
  private cursor: string;

  private isPanKeyDown: boolean;
  private panPos: Point;
  private isMouseDown: boolean;

  private selectionStartPos: Point;
  private selectionRect: SelectionRect | null;

  private isDraggingSelection: boolean;

  private lastPaint: Cell;

  private drawCb: (ctx: CanvasRenderingContext2D, clear: boolean) => void;

  constructor(container: HTMLElement, options: TilemapViewportOptions) {
    super();

    container.style.position = "relative";

    this.canvas = document.createElement("canvas");
    this.overlayCanvas = document.createElement("canvas");

    this.canvas.style.imageRendering = "pixelated";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.background = container.style.background;

    this.canvas.style.position = "absolute";
    this.canvas.style.zIndex = this.overlayCanvas.style.imageRendering =
      "pixelated";
    this.overlayCanvas.style.width = "100%";
    this.overlayCanvas.style.height = "100%";
 this.overlayCanvas.style.background = container.style.background;
    this.overlayCanvas.style.position = "absolute";
    this.overlayCanvas.style.zIndex = "1";

    container.appendChild(this.overlayCanvas);
    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext("2d", {alpha: false});
    if (ctx === null) throw new Error("Canvas ctx is null");
    const ctxOverlay = this.overlayCanvas.getContext("2d");
    if (ctxOverlay === null) throw new Error("Canvas ctx is null");
    this.ctx = ctx;
    this.ctxOverlay = ctxOverlay;
    this.ctx.imageSmoothingEnabled = false;


    this.panPos = { x: 0, y: 0 };

    this.zoomSettings = options.zoom ?? null;
    this.gridSettings = options.grid;
    this.panSettings = options.pan ?? null;

    this.zoom = 1;
    this.translation = { x: 0, y: 0 };

    this.isSelectionEnabled = options.selection ?? false;

    this.drawCb = options.draw;

    this.isPanKeyDown = false;
    this.isMouseDown = false;

    this.cursor = options.defaultCursor ?? "default";

    this.selectionStartPos = { x: 0, y: 0 };

    this.selectionRect = null;

    this.isDraggingSelection = false;

    this.lastPaint = { row: 0, col: 0 };

  }

  get width(): number {
    return this.canvas.width;
  }

  set width(width: number) {
    const rounded = Math.round(width);
    this.canvas.width = rounded;
    this.overlayCanvas.width = rounded;
    this.ctx.imageSmoothingEnabled = false;
    this.ctxOverlay.imageSmoothingEnabled = false;

  }

  get height(): number {
    return this.canvas.height;
  }

  set height(height: number) {
    const rounded = Math.round(height);
    this.canvas.height = rounded;
    this.overlayCanvas.height = rounded;
    this.ctx.imageSmoothingEnabled = false;
    this.ctxOverlay.imageSmoothingEnabled = false;

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

  init(center: boolean = false) {
    this.addEventListeners();
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.style.cursor = this.cursor;
    this.overlayCanvas.style.cursor = this.cursor;
    if (center) this.translation = { x: this.canvas.clientWidth / 2 - this.gridSettings.width / 2, y: this.canvas.clientHeight / 2 - this.gridSettings.height / 2 };

    this.update();

  }

  update() {
    this.clear();
    this.drawCb(this.ctx, false);
    this.drawOverlay();
    requestAnimationFrame(() => this.update());
  }

  private clear() {
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.translate(this.translation.x, this.translation.y);
    this.ctx.scale(this.zoom, this.zoom);
  }

  private drawOverlay() {

    this.ctxOverlay.resetTransform();
    this.ctxOverlay.clearRect(0, 0, this.width, this.height);
    this.ctxOverlay.translate(this.translation.x, this.translation.y);
    this.ctxOverlay.scale(this.zoom, this.zoom);

    this.drawGrid();
    this.drawSelectionRect();
  }

  private drawGrid() {
    // Draw grid if not to zoomed out bc of performance
    if (this.gridSettings.showGrid) {
      const tileSize = this.gridSettings.tileSize;

      this.ctxOverlay.beginPath();

      this.ctxOverlay.strokeStyle = "white";

      this.ctxOverlay.lineWidth = 1;

      // Draws horisontal lines
      for (let y = -0.5; y <= this.gridSettings.height; y += tileSize) {
        this.ctxOverlay.moveTo(0, y);
        this.ctxOverlay.lineTo(this.gridSettings.width, y);
      }

      // Draws vertical lines
      for (let x = -0.5; x <= this.gridSettings.width; x += tileSize) {
        this.ctxOverlay.moveTo(x, 0);
        this.ctxOverlay.lineTo(x, this.gridSettings.height);
      }

      this.ctxOverlay.stroke();
    } else {
      this.ctxOverlay.strokeRect(0, 0, this.gridSettings.width, this.gridSettings.height);
    }
  }

  private drawSelectionRect() {
    if (this.selectionRect !== null) {
      this.ctxOverlay.strokeStyle = "lime";
      this.ctxOverlay.setLineDash([4, 4]);
      this.ctxOverlay.strokeRect(
        this.selectionRect.x1,
        this.selectionRect.y1,
        this.selectionRect.x2 - this.selectionRect.x1,
        this.selectionRect.y2 - this.selectionRect.y1,
      );
      this.ctxOverlay.setLineDash([]);
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
        if (e.target !== this.overlayCanvas) {
          e.stopPropagation();
          return;
        }

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

      this.overlayCanvas.addEventListener("mousedown", (e: MouseEvent) => {
        if (e.target !== this.overlayCanvas) return;

        this.isMouseDown = true;

        const rect = this.canvas.getBoundingClientRect();

        const canvasX = Math.round(e.clientX - rect.left);

        const canvasY = Math.round(e.clientY - rect.top);

        const { x, y } = this.getWorldPos({ x: canvasX, y: canvasY });

        const isWithinGridBounds = x >= 0 && x <= this.gridSettings.width && y >= 0 && y <= this.gridSettings.height;

        if (this.isPanKeyDown) {
          this.panPos.x = canvasX;
          this.panPos.y = canvasY;
        }
        else if (isWithinGridBounds) {

          if (this.isSelectionEnabled) {
            if (
              this.selectionRect !== null &&
              isPointInRect(
                { x, y },
                {
                  x: this.selectionRect.x1,
                  y: this.selectionRect.y1,
                  height: this.selectionRect.y2 - this.selectionRect.y1,
                  width: this.selectionRect.x2 - this.selectionRect.x1,
                },
              )
            ) {
              this.isDraggingSelection = true;
              this.panPos.x = canvasX;
              this.panPos.y = canvasY;
            } else {
              this.dispatchEvent(new TilemapViewportSelectEvent(null));
              this.selectionStartPos = { x, y };
              this.selectionRect = this.getSelectionRect({ x, y }, { x, y });
            }
          } else if (e.button === 0) {
            const row = Math.floor(y / this.gridSettings.tileSize);
            const col = Math.floor(x / this.gridSettings.tileSize);
            this.lastPaint = { row, col };
            this.dispatchEvent(new TilemapViewportPaintEvent({ row, col }));
          }
        }
      });

      this.overlayCanvas.addEventListener("mousemove", (e: MouseEvent) => {
        if (e.target !== this.overlayCanvas) return;

        const rect = this.canvas.getBoundingClientRect();

        const canvasX = Math.round(e.clientX - rect.left);

        const canvasY = Math.round(e.clientY - rect.top);

        const worldPos = this.getWorldPos({ x: canvasX, y: canvasY });

        const row = Math.floor(worldPos.y / this.gridSettings.tileSize);
        const col = Math.floor(worldPos.x / this.gridSettings.tileSize);

        this.dispatchEvent(new TilemapViewportMousePosEvent(worldPos));

        const isWithinGridBounds = worldPos.x >= 0 && worldPos.x <= this.gridSettings.width && worldPos.y >= 0 && worldPos.y <= this.gridSettings.height;

        if (this.isMouseDown) {
          if (this.isPanKeyDown) {
            this.translation.x += canvasX - this.panPos.x;

            this.translation.y += canvasY - this.panPos.y;

            this.panPos = { x: canvasX, y: canvasY };

          } else if (isWithinGridBounds) {

            if (this.isSelectionEnabled && this.selectionRect !== null) {
              if (this.isDraggingSelection) {
                const deltaX = canvasX - this.panPos.x;
                const deltaY = canvasY - this.panPos.y;

                let shouldemitDeltaX = false;
                let shouldemitDeltaY = false;

                if (Math.abs(deltaX) >= this.gridSettings.tileSize) {
                  this.selectionRect.x1 += deltaX;
                  this.selectionRect.x2 += deltaX;
                  this.panPos.x = canvasX;
                  shouldemitDeltaX = true;
                }

                if (Math.abs(deltaY) >= this.gridSettings.tileSize) {
                  this.selectionRect.y1 += deltaY;
                  this.selectionRect.y2 += deltaY;
                  this.panPos.y = canvasY;
                  shouldemitDeltaY = true;
                }

                if (shouldemitDeltaX && shouldemitDeltaY) {
                  this.dispatchEvent(
                    new TilemapViewportSelectionDragEvent({
                      x: deltaX,
                      y: deltaY,
                    }),
                  );
                } else if (shouldemitDeltaX) {
                  this.dispatchEvent(
                    new TilemapViewportSelectionDragEvent({ x: deltaX, y: 0 }),
                  );
                } else if (shouldemitDeltaY) {
                  this.dispatchEvent(
                    new TilemapViewportSelectionDragEvent({ x: 0, y: deltaY }),
                  );
                }
              } else {
                this.selectionRect = this.getSelectionRect(
                  this.selectionStartPos,
                  worldPos,
                );
              }
            } else if (row !== this.lastPaint.row || col !== this.lastPaint.col) {

              this.dispatchEvent(new TilemapViewportPaintEvent({ row, col }));
              this.lastPaint = { row, col };
            }
          }
        }
      });

      this.overlayCanvas.addEventListener("mouseup", (_: MouseEvent) => {
        this.panPos.x = 0;
        this.panPos.y = 0;
        this.isMouseDown = false;
        this.isDraggingSelection = false;

        if (this.selectionRect !== null) {
          this.dispatchEvent(new TilemapViewportSelectEvent(this.selectionRect));
        }
      });

      this.overlayCanvas.addEventListener("contextmenu", (e: MouseEvent) => {
        if (e.target !== this.overlayCanvas) return;

        const rect = this.canvas.getBoundingClientRect();

        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        const worldPos = this.getWorldPos({
          x,
          y,
        });

        this.dispatchEvent(new TilemapViewportRightClickEvent(worldPos));

        e.preventDefault();
        e.stopPropagation();
      });
    }
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
