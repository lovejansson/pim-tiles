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
};

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
  draw: (ctx: CanvasRenderingContext2D, clear: boolean) => void;
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

export class CanvasViewPortRightClickEvent extends Event {
  pos: Point;

  constructor(pos: Point) {
    super("right-click");
    this.pos = pos;
  }
}

export class CanvasViewPortMousePosEvent extends Event {
  pos: Point;

  constructor(pos: Point) {
    super("mouse-pos");
    this.pos = pos;
  }
}

export default class CanvasViewport extends EventTarget {
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
  private drawLoop: boolean;
  private cursor: string;

  private isPanKeyDown: boolean;
  private panPos: Point;
  private isMouseDown: boolean;

  private selectionStartPos: Point;
  private selectionRect: SelectionRect | null;

  private isDraggingSelection: boolean;

  private isDirty: boolean;

  private transformHasChanged: boolean;

  private drawFunc: (ctx: CanvasRenderingContext2D, clear: boolean) => void;

  constructor(container: HTMLElement, options: CanvasViewportOptions) {
    super();

    container.style.position = "relative";

    this.canvas = document.createElement("canvas");
    this.overlayCanvas = document.createElement("canvas");

    this.canvas.style.imageRendering = "pixelated";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    this.canvas.style.position = "absolute";
    this.canvas.style.zIndex = this.overlayCanvas.style.imageRendering =
      "pixelated";
    this.overlayCanvas.style.width = "100%";
    this.overlayCanvas.style.height = "100%";

    this.overlayCanvas.style.position = "absolute";
    this.overlayCanvas.style.zIndex = "1";
    container.appendChild(this.overlayCanvas);
    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext("2d");
    if (ctx === null) throw new Error("Canvas ctx is null");
    const ctxOverlay = this.overlayCanvas.getContext("2d");
    if (ctxOverlay === null) throw new Error("Canvas ctx is null");
    this.ctx = ctx;
    this.ctxOverlay = ctxOverlay;

    this.ctx.imageSmoothingEnabled = false;

    this.zoom = 1;

    this.translation = { x: 0, y: 0 };

    this.panPos = { x: 0, y: 0 };

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

    this.isDirty = true;
    this.transformHasChanged = true;
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

  init() {
    this.addEventListeners();

    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.style.cursor = this.cursor;

    if (this.drawLoop) {
      this.loop();
    } 
  }

  loop() {
    if (this.transformHasChanged) {
      this.clear();
      this.drawFunc(this.ctx, this.transformHasChanged);
      this.drawOverlay();
      this.transformHasChanged = false;
    } else if (this.isDirty) {
      this.drawFunc(this.ctx, false);
      this.drawOverlay();
      this.isDirty = false;
    }

    requestAnimationFrame(() => this.loop());
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

  private drawGrid() {
    // Draw grid if not to zoomed out bc of performance
    if (this.zoom >= 0.25 && this.gridSettings.showGrid) {
      const tileSize = this.gridSettings.tileSize;

      this.ctxOverlay.beginPath();

      this.ctxOverlay.strokeStyle = "white";

      // Draws horisontal lines
      for (let y = 0; y < 256 * tileSize; y += tileSize) {
        this.ctxOverlay.moveTo(0, y);
        this.ctxOverlay.lineTo(256 * tileSize, y);
      }

      // Draws vertical lines
      for (let x = 0; x < 256 * tileSize; x += tileSize) {
        this.ctxOverlay.moveTo(x, 0);
        this.ctxOverlay.lineTo(x, 256 * tileSize);
      }

      this.ctxOverlay.stroke();
    }
  }

  private drawSelection() {
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
        if (e.target !== this.overlayCanvas) return;

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
        this.transformHasChanged = true;
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

        if (this.isPanKeyDown) {
          this.panPos.x = canvasX;
          this.panPos.y = canvasY;
        } else if (this.isSelectionEnabled) {
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
            this.dispatchEvent(new CanvasViewPortSelectEvent(null));
            this.selectionStartPos = { x, y };
            this.selectionRect = this.getSelectionRect({ x, y }, { x, y });
            this.isDirty = true;
          }
        } else if (e.button === 0) {
          this.dispatchEvent(new CanvasViewPortPaintEvent({ x, y }));
          this.isDirty = true;
        }
      });

      this.overlayCanvas.addEventListener("mousemove", (e: MouseEvent) => {
        if (e.target !== this.overlayCanvas) return;

        const rect = this.canvas.getBoundingClientRect();

        const canvasX = Math.round(e.clientX - rect.left);

        const canvasY = Math.round(e.clientY - rect.top);

        const worldPos = this.getWorldPos({ x: canvasX, y: canvasY });

        this.dispatchEvent(new CanvasViewPortMousePosEvent(worldPos));

        if (this.isMouseDown) {
          if (this.isPanKeyDown) {
            this.translation.x += canvasX - this.panPos.x;

            this.translation.y += canvasY - this.panPos.y;

            this.panPos = { x: canvasX, y: canvasY };

            this.transformHasChanged = true;
          } else if (this.isSelectionEnabled && this.selectionRect !== null) {
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
                  new CanvasViewPortSelectionDragEvent({
                    x: deltaX,
                    y: deltaY,
                  }),
                );
              } else if (shouldemitDeltaX) {
                this.dispatchEvent(
                  new CanvasViewPortSelectionDragEvent({ x: deltaX, y: 0 }),
                );
              } else if (shouldemitDeltaY) {
                this.dispatchEvent(
                  new CanvasViewPortSelectionDragEvent({ x: 0, y: deltaY }),
                );
              }
            } else {
              this.selectionRect = this.getSelectionRect(
                this.selectionStartPos,
                worldPos,
              );
              this.isDirty = true;
            }
          } else {
            this.dispatchEvent(new CanvasViewPortPaintEvent(worldPos));
            this.isDirty = true;
          }
        }
      });

      this.overlayCanvas.addEventListener("mouseup", (_: MouseEvent) => {
        this.panPos.x = 0;
        this.panPos.y = 0;
        this.isMouseDown = false;
        this.isDraggingSelection = false;

        if (this.selectionRect !== null) {
          this.dispatchEvent(new CanvasViewPortSelectEvent(this.selectionRect));
        }
      });

      this.overlayCanvas.addEventListener("click", (e: MouseEvent) => {
        if (e.target !== this.overlayCanvas) return;

        const rect = this.canvas.getBoundingClientRect();

        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        const worldPos = this.getWorldPos({
          x,
          y,
        });

        this.dispatchEvent(
          new CustomEvent("click", { detail: { pos: worldPos } }),
        );
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

        this.dispatchEvent(new CanvasViewPortRightClickEvent(worldPos));

        e.preventDefault();
        e.stopPropagation();
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
