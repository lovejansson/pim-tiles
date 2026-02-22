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

export class TilemapViewportSelectionChangeEvent extends Event {
  selection: SelectionRect | null;

  constructor(selection: SelectionRect | null) {
    super("selection-change");
    this.selection = selection;
  }
}

export class TilemapViewportSelectionMoveEvent extends Event {
  delta: Point;

  constructor(delta: Point) {
    super("selection-move");
    this.delta = delta;
  }
}

export class TilemapViewportSelectionMoveEndEvent extends Event {

  constructor() {
    super("selection-move-end");
  }
}

export class TilemapViewportSelectionDeleteEvent extends Event {
  constructor() {
    super("selection-delete");
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

enum MouseActionType {
  SELECT,
  MOVE_SELECTION,
  PAN,
  PAINT
}

type MouseActionData<T> = T extends MouseActionType.SELECT ? { pos: Point, selection: SelectionRect }
  : T extends MouseActionType.PAN ? { startPos: Point, startTranslation: Point }
  : T extends MouseActionType.PAINT ? { lastPaintedTile: Cell }
  : T extends MouseActionType.MOVE_SELECTION ? { startPos: Point, selection: SelectionRect, startSelection: SelectionRect }
  : never;

type MouseActionT<T> = {
  type: T,
  data: MouseActionData<T>
}

type MouseAction = MouseActionT<MouseActionType.PAINT> | MouseActionT<MouseActionType.PAN> | MouseActionT<MouseActionType.SELECT> | MouseActionT<MouseActionType.MOVE_SELECTION>;

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

  private zoom: number;
  private translation: Point;

  private zoomSettings: ZoomSettings | null;
  private panSettings: PanSettings | null;
  private isSelectionEnabled: boolean;
  private gridSettings: GridSettings;
  private cursor: string;

  private isPanKeyDown: boolean;
  private mouseAction: MouseAction | null;
  private selection: SelectionRect | null;

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

    const ctx = this.canvas.getContext("2d");
    if (ctx === null) throw new Error("Canvas ctx is null");
    const ctxOverlay = this.overlayCanvas.getContext("2d");
    if (ctxOverlay === null) throw new Error("Canvas ctx is null");
    this.ctx = ctx;
    this.ctxOverlay = ctxOverlay;
    this.ctx.imageSmoothingEnabled = false;




    this.zoomSettings = options.zoom ?? null;
    this.gridSettings = options.grid;
    this.panSettings = options.pan ?? null;

    this.zoom = 1;
    this.translation = { x: 0, y: 0 };
    this.selection = null;
    this.isSelectionEnabled = options.selection ?? false;

    this.drawCb = options.draw;

    this.isPanKeyDown = false;
    this.mouseAction = null;
    this.cursor = options.defaultCursor ?? "default";

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
    this.selection = null;
    this.isSelectionEnabled = false;
  }

  init(center: boolean = false) {
    this.addEventListeners();
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.style.cursor = this.cursor;
    this.overlayCanvas.style.cursor = this.cursor;
    if (this.gridSettings.width > 100) this.zoom = 0.5;
    if (center) this.translation = { x: this.canvas.clientWidth / 2 - this.gridSettings.width / 4, y: this.canvas.clientHeight / 2 - this.gridSettings.height / 4 };



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

      this.ctxOverlay.strokeStyle = "black";

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
    if (this.selection !== null) {
      this.ctxOverlay.strokeStyle = "lime";
      this.ctxOverlay.fillStyle = "rgba(138, 210, 122, 0.25)"
      this.ctxOverlay.lineWidth = 2;
      this.ctxOverlay.setLineDash([4, 4]);
      this.ctxOverlay.strokeRect(
        this.selection.x1,
        this.selection.y1,
        this.selection.x2 - this.selection.x1,
        this.selection.y2 - this.selection.y1,
      );
      this.ctxOverlay.fillRect(this.selection.x1,
        this.selection.y1,
        this.selection.x2 - this.selection.x1,
        this.selection.y2 - this.selection.y1,);
      this.ctxOverlay.setLineDash([]);
    }
  }

  private isMouseDown(
    mouseAction: MouseAction | null,
  ): mouseAction is MouseAction {
    return mouseAction !== null;
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
      });
    }

    if (this.isPanEnabled(this.panSettings) || this.isSelectionEnabled) {
      addEventListener("keydown", (e: KeyboardEvent) => {
        if (!this.isPanEnabled(this.panSettings)) return;

        if (e.key === this.panSettings.key) {
          this.overlayCanvas.style.cursor = "grab";
          this.isPanKeyDown = true;
        } else if ((e.key === "Delete" || e.key === "Backspace") && this.selection !== null) {
          this.dispatchEvent(new TilemapViewportSelectionDeleteEvent());
          this.selection = null;
          this.mouseAction = null
        }
      });

      addEventListener("keyup", (e: KeyboardEvent) => {
        if (!this.isPanEnabled(this.panSettings)) return;

        if (e.key === this.panSettings.key) {
          this.overlayCanvas.style.cursor = this.cursor;
          this.isPanKeyDown = false;
        }
      });

      this.overlayCanvas.addEventListener("mousedown", (e: MouseEvent) => {
        if (e.target !== this.overlayCanvas) return;

        if (e.button === 0) {

          const { canvasPos, worldPos, isWithinGridBounds, tile } = this.getMouseCoordinates(e.clientX, e.clientY)

          if (this.isPanKeyDown) {
            this.mouseAction = { type: MouseActionType.PAN, data: { startPos: { ...canvasPos }, startTranslation: { ...this.translation } } };
          } else {


            if (this.isSelectionEnabled) {

              // If mouse is down on selected rect
              if (
                this.selection !== null &&
                isPointInRect(
                  worldPos,
                  {
                    x: Math.min(this.selection.x1, this.selection.x2),
                    y: Math.min(this.selection.y1, this.selection.y2),
                    height: Math.max(this.selection.y1, this.selection.y2) - Math.min(this.selection.y1, this.selection.y2),
                    width: Math.max(this.selection.x1, this.selection.x2) - Math.min(this.selection.x1, this.selection.x2),
                  },
                )
              ) {
                this.mouseAction = { type: MouseActionType.MOVE_SELECTION, data: { startPos: { ...worldPos }, selection: this.selection, startSelection: { ...this.selection } } }

                // Else start new selection
              } else {
                this.dispatchEvent(new TilemapViewportSelectionChangeEvent(null));
                this.mouseAction = { type: MouseActionType.SELECT, data: { pos: { ...worldPos }, selection: this.getSelectionRect(worldPos, worldPos) } }
                this.selection = this.getSelectionRect(worldPos, worldPos);
              }
            } else {

              if (isWithinGridBounds) {
                this.mouseAction = { type: MouseActionType.PAINT, data: { lastPaintedTile: { ...tile } } };

                this.dispatchEvent(new TilemapViewportPaintEvent(tile));
              }



            }

          }
        }
      });

      this.overlayCanvas.addEventListener("mousemove", (e: MouseEvent) => {
        if (e.target !== this.overlayCanvas) return;

        const { canvasPos, worldPos, isWithinGridBounds, tile } = this.getMouseCoordinates(e.clientX, e.clientY)

        this.dispatchEvent(new TilemapViewportMousePosEvent(worldPos));

        if (this.isMouseDown(this.mouseAction)) {

          switch (this.mouseAction.type) {
            case MouseActionType.SELECT:

              this.selection = this.getSelectionRect(
                this.mouseAction.data.pos,
                worldPos,
              );

              this.mouseAction.data.selection = this.selection;

              break;
            case MouseActionType.MOVE_SELECTION:
              {
                // The deltas is the total deltas since move start!

                const dx = worldPos.x - this.mouseAction.data.startPos.x;
                const dy = worldPos.y - this.mouseAction.data.startPos.y;

                const dxSnapped = Math.round(dx / this.gridSettings.tileSize) * this.gridSettings.tileSize;
                this.mouseAction.data.selection.x1 = this.mouseAction.data.startSelection.x1 + dxSnapped;
                this.mouseAction.data.selection.x2 = this.mouseAction.data.startSelection.x2 + dxSnapped;

                const dySnapped = Math.round(dy / this.gridSettings.tileSize) * this.gridSettings.tileSize;
                this.mouseAction.data.selection.y1 = this.mouseAction.data.startSelection.y1 + dySnapped;
                this.mouseAction.data.selection.y2 = this.mouseAction.data.startSelection.y2 + dySnapped;

                this.dispatchEvent(new TilemapViewportSelectionMoveEvent({ x: dxSnapped, y: dySnapped }))
              }

              break;
            case MouseActionType.PAN:
              const dx = canvasPos.x - this.mouseAction.data.startPos.x;
              const dy = canvasPos.y - this.mouseAction.data.startPos.y;

              this.translation.x = this.mouseAction.data.startTranslation.x + dx;

              this.translation.y = this.mouseAction.data.startTranslation.y + dy;

              break;
            case MouseActionType.PAINT:
              if (isWithinGridBounds && (tile.row !== this.mouseAction.data.lastPaintedTile.row || tile.col !== this.mouseAction.data.lastPaintedTile.col)) {
                this.dispatchEvent(new TilemapViewportPaintEvent(tile));
                this.mouseAction.data.lastPaintedTile = tile;
              }
              break;
          }
        }
      });

      addEventListener("mouseup", (_: MouseEvent) => {

        if (this.isMouseDown(this.mouseAction)) {
          if (this.mouseAction.type === MouseActionType.SELECT) {

            this.dispatchEvent(new TilemapViewportSelectionChangeEvent(this.selection));
          } else if (this.mouseAction.type === MouseActionType.MOVE_SELECTION) {
              this.dispatchEvent(new TilemapViewportSelectionMoveEndEvent());
          }

          this.mouseAction = null;
        }

      });

      this.overlayCanvas.addEventListener("contextmenu", (e: MouseEvent) => {
        if (e.target !== this.overlayCanvas) return;

        const { worldPos, isWithinGridBounds } = this.getMouseCoordinates(e.clientX, e.clientY);

        if (isWithinGridBounds) {
          this.dispatchEvent(new TilemapViewportRightClickEvent(worldPos));
        }

        e.preventDefault();
        e.stopPropagation();
      });


    }
  }

  private getMouseCoordinates(clientX: number, clientY: number): { canvasPos: Point, worldPos: Point, tile: Cell, isWithinGridBounds: boolean } {
    const rect = this.canvas.getBoundingClientRect();

    const x = Math.round(clientX - rect.left);
    const y = Math.round(clientY - rect.top);

    const worldPos = this.getWorldPos({
      x,
      y,
    });

    const row = Math.floor(worldPos.y / this.gridSettings.tileSize);
    const col = Math.floor(worldPos.x / this.gridSettings.tileSize);

    const isWithinGridBounds = worldPos.x >= 0 && worldPos.x <= this.gridSettings.width && worldPos.y >= 0 && worldPos.y <= this.gridSettings.height;

    return {
      canvasPos: { x, y }, worldPos,
      isWithinGridBounds, tile: { row, col }
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
