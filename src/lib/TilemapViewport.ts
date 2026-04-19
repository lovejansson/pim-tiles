import { SlInput } from "@shoelace-style/shoelace";
import { type Cell, type Vec2 } from "../types";
import { isPointInRect } from "../utils";

type ZoomSettings = {
  min: number;
  max: number;
  speed: number;
};

type PanSettings = {
  key?: string;
};

type SelectionSettings = {
  isActive: boolean;
  delete?: boolean;
  move?: boolean;
  copy?: boolean;
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
  selection?: SelectionSettings;
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
  tiles: Cell[] | null;

  constructor(tiles: Cell[] | null) {
    super("selection-change");
    this.tiles = tiles;
  }
}

export class TilemapViewportSelectionMoveStartEvent extends Event {
  constructor() {
    super("selection-move-start");
  }
}

export class TilemapViewportSelectionMoveEvent extends Event {
  delta: Vec2;

  constructor(delta: Vec2) {
    super("selection-move");
    this.delta = delta;
  }
}

export class TilemapViewportSelectionMoveEndEvent extends Event {
  constructor() {
    super("selection-move-end");
  }
}

export class TilemapViewportSelectionCopyEvent extends Event {
  constructor() {
    super("selection-copy");
  }
}

export class TilemapViewportSelectionDeleteEvent extends Event {
  constructor() {
    super("selection-delete");
  }
}

export class TilemapViewportRightClickEvent extends Event {
  cell: Cell;

  constructor(cell: Cell) {
    super("right-click");
    this.cell = cell;
  }
}

export class TilemapViewportMousePosEvent extends Event {
  cell: Cell;

  constructor(cell: Cell) {
    super("mouse-pos");
    this.cell = cell;
  }
}

enum MouseActionType {
  SELECT,
  MOVE_SELECTION,
  PAN,
  PAINT,
}

type MouseActionData<T> = T extends MouseActionType.SELECT
  ? { pos: Vec2; selection: SelectionRect }
  : T extends MouseActionType.PAN
    ? { startPos: Vec2; startTranslation: Vec2 }
    : T extends MouseActionType.PAINT
      ? { lastPaintedTile: Cell }
      : T extends MouseActionType.MOVE_SELECTION
        ? {
            startPos: Vec2;
            selection: SelectionRect;
            startSelection: SelectionRect;
          }
        : never;

type MouseActionT<T> = {
  type: T;
  data: MouseActionData<T>;
};

type MouseAction =
  | MouseActionT<MouseActionType.PAINT>
  | MouseActionT<MouseActionType.PAN>
  | MouseActionT<MouseActionType.SELECT>
  | MouseActionT<MouseActionType.MOVE_SELECTION>;

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
  private container: HTMLElement;
  private canvasBg: HTMLCanvasElement;
  private canvas: HTMLCanvasElement;
  private canvasOverlay: HTMLCanvasElement;

  private ctxBg: CanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;
  private ctxOverlay: CanvasRenderingContext2D;

  zoom: number;
  private translation: Vec2;

  private zoomSettings: ZoomSettings | null;
  private panSettings: PanSettings | null;
  private gridSettings: GridSettings;
  private selectionSettings: SelectionSettings | null;
  private cursor: string;

  private isPanKeyDown: boolean;
  private isCtrlKeyDown: boolean;
  private mouseAction: MouseAction | null;
  private selection: SelectionRect | null;

  private drawCb: (ctx: CanvasRenderingContext2D, clear: boolean) => void;

  private transformHasChanged: boolean;

  constructor(container: HTMLElement, options: TilemapViewportOptions) {
    super();

    container.style.position = "relative";

    this.container = container;

    this.canvas = document.createElement("canvas");
    this.canvasOverlay = document.createElement("canvas");
    this.canvasBg = document.createElement("canvas");

    this.canvas.style.imageRendering = "pixelated";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.background = container.style.background;
    this.canvas.style.position = "absolute";

    this.canvasOverlay.style.imageRendering = "pixelated";
    this.canvasOverlay.style.width = "100%";
    this.canvasOverlay.style.height = "100%";
    this.canvasOverlay.style.background = container.style.background;
    this.canvasOverlay.style.position = "absolute";
    this.canvasOverlay.style.zIndex = "1";

    this.canvasBg.style.imageRendering = "pixelated";
    this.canvasBg.style.width = "100%";
    this.canvasBg.style.height = "100%";
    this.canvasBg.style.position = "absolute";
    this.canvasBg.id = "canvas-bg";

    container.appendChild(this.canvasBg);
    container.appendChild(this.canvasOverlay);
    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext("2d");
    if (ctx === null) throw new Error("Canvas ctx is null");
    const ctxOverlay = this.canvasOverlay.getContext("2d");
    if (ctxOverlay === null) throw new Error("Canvas ctx is null");
    const ctxBg = this.canvasBg.getContext("2d");
    if (ctxBg === null) throw new Error("Canvas ctx is null");

    this.ctx = ctx;
    this.ctxOverlay = ctxOverlay;
    this.ctxBg = ctxBg;

    this.ctxBg.imageSmoothingEnabled = false;
    this.ctx.imageSmoothingEnabled = false;
    this.ctxOverlay.imageSmoothingEnabled = false;

    this.isCtrlKeyDown = false;
    this.zoomSettings = options.zoom ?? null;
    this.gridSettings = options.grid;
    this.panSettings = options.pan ?? null;
    this.selectionSettings = options.selection ?? null;

    this.zoom = 1;
    this.translation = { x: 0, y: 0 };
    this.selection = null;

    this.drawCb = options.draw;

    this.isPanKeyDown = false;
    this.mouseAction = null;
    this.cursor = options.defaultCursor ?? "default";

    this.transformHasChanged = true;
  }

  get width(): number {
    return this.canvas.width;
  }

  set width(width: number) {
    const rounded = Math.round(width);
    this.canvas.width = rounded;
    this.canvasOverlay.width = rounded;
    this.canvasBg.width = rounded;

    this.ctx.imageSmoothingEnabled = false;
    this.ctxOverlay.imageSmoothingEnabled = false;
    this.ctxBg.imageSmoothingEnabled = false;
  }

  get height(): number {
    return this.canvas.height;
  }

  set height(height: number) {
    const rounded = Math.round(height);
    this.canvas.height = rounded;
    this.canvasOverlay.height = rounded;
    this.canvasBg.height = rounded;

    this.ctx.imageSmoothingEnabled = false;
    this.ctxOverlay.imageSmoothingEnabled = false;
    this.ctxBg.imageSmoothingEnabled = false;
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

  updateGridSize(
    width: number,
    height: number,
    tileSize: number,
    center: boolean = false,
  ) {
    this.gridSettings.width = width;
    this.gridSettings.height = height;
    this.gridSettings.tileSize = tileSize;

    this.zoom = this.gridSettings.width > 1280 ? 0.25 : 0.5;

    if (center)
      this.translation = {
        x: this.canvas.width / 2 - (this.gridSettings.width * this.zoom) / 2,
        y: this.canvas.height / 2 - (this.gridSettings.height * this.zoom) / 2,
      };
  }

  enableSelection() {
    if (this.isSelectionEnabled(this.selectionSettings)) {
      this.selectionSettings.isActive = true;
    }
  }

  disableSelection() {
    if (this.isSelectionEnabled(this.selectionSettings)) {
      this.selectionSettings.isActive = false;
      this.selection = null;
    }
  }

  setSelection(cells: Cell[]) {
    if (!this.isSelectionEnabled(this.selectionSettings) || cells.length === 0) {
      this.selection = null;
      this.dispatchEvent(new TilemapViewportSelectionChangeEvent(null));
      return;
    }

    // Find bounds of cells
    const minCol = Math.min(...cells.map(c => c.col));
    const maxCol = Math.max(...cells.map(c => c.col));
    const minRow = Math.min(...cells.map(c => c.row));
    const maxRow = Math.max(...cells.map(c => c.row));

    // Convert to world coordinates
    const tileSize = this.gridSettings.tileSize;
    const x1 = minCol * tileSize;
    const y1 = minRow * tileSize;
    const x2 = (maxCol + 1) * tileSize;
    const y2 = (maxRow + 1) * tileSize;

    this.selection = { x1, y1, x2, y2 };
    this.dispatchEvent(new TilemapViewportSelectionChangeEvent(cells));
  }

  init(options?: { center?: boolean; resize?: boolean }) {
    this.addEventListeners();
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    this.canvas.style.cursor = this.cursor;
    this.canvasOverlay.style.cursor = this.cursor;
    this.zoom = this.gridSettings.width > 1280 ? 0.25 : 0.5;

    if (options?.resize) {
      addEventListener("resize", () => {
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
      });
    }

    if (options?.center)
      this.translation = {
        x: this.canvas.width / 2 - (this.gridSettings.width * this.zoom) / 2,
        y: this.canvas.height / 2 - (this.gridSettings.height * this.zoom) / 2,
      };

    this.update();
  }

  update() {
    this.drawBg();
    this.draw();
    this.drawOverlay();
    requestAnimationFrame(() => this.update());
  }

  private draw() {
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.translate(this.translation.x, this.translation.y);
    this.ctx.scale(this.zoom, this.zoom);

    this.drawCb(this.ctx, false);
  }

  private drawBg() {
    if (this.transformHasChanged) {
      this.ctxBg.resetTransform();
      this.ctxBg.clearRect(0, 0, this.width, this.height);

      this.ctxBg.translate(this.translation.x, this.translation.y);
      this.ctxBg.scale(this.zoom, this.zoom);

      for (
        let r = 0;
        r < this.gridSettings.height / this.gridSettings.tileSize;
        ++r
      ) {
        for (
          let c = 0;
          c < this.gridSettings.width / this.gridSettings.tileSize;
          ++c
        ) {
          this.ctxBg.fillStyle = r % 2 === c % 2 ? "#b5b7b9" : "#ececec";
          this.ctxBg.fillRect(
            c * this.gridSettings.tileSize,
            r * this.gridSettings.tileSize,
            this.gridSettings.tileSize,
            this.gridSettings.tileSize,
          );
        }
      }
    }
  }

  private drawOverlay() {
    if (this.transformHasChanged || this.selection !== null) {
      this.ctxOverlay.resetTransform();
      this.ctxOverlay.clearRect(0, 0, this.width, this.height);

      this.ctxOverlay.translate(this.translation.x, this.translation.y);
      this.ctxOverlay.scale(this.zoom, this.zoom);

      this.drawGrid();
      this.drawSelectionRect();
    }
  }

  private drawGrid() {
    // Draw grid if not to zoomed out bc of performance
    if (this.gridSettings.showGrid) {
      const tileSize = this.gridSettings.tileSize;

      this.ctxOverlay.beginPath();

      this.ctxOverlay.strokeStyle = this.gridSettings.gridColor;

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
    }
  }

  private drawSelectionRect() {
    if (this.selection !== null) {
      const gradient = this.ctxOverlay.createLinearGradient(
        this.selection.x1,
        this.selection.y1,
        this.selection.x2,
        this.selection.y2,
      );

      gradient.addColorStop(0, "lime");
      gradient.addColorStop(0.5, "cyan");
      gradient.addColorStop(1, "fuchsia");

      this.ctxOverlay.strokeStyle = gradient;

      this.ctxOverlay.fillStyle = "rgba(138, 210, 122, 0.25)";

      this.ctxOverlay.lineWidth = 1;
      this.ctxOverlay.setLineDash([4, 4]);
      this.ctxOverlay.strokeRect(
        this.selection.x1 - 0.5,
        this.selection.y1 - 0.5,
        this.selection.x2 - this.selection.x1,
        this.selection.y2 - this.selection.y1,
      );
      this.ctxOverlay.fillRect(
        this.selection.x1 - 0.5,
        this.selection.y1 - 0.5,
        this.selection.x2 - this.selection.x1,
        this.selection.y2 - this.selection.y1,
      );
      this.ctxOverlay.setLineDash([]);
    }
  }

  private isMouseDown(
    mouseAction: MouseAction | null,
  ): mouseAction is MouseAction {
    return mouseAction !== null;
  }

  private isSelectionActive() {
    return (
      this.isSelectionEnabled(this.selectionSettings) &&
      this.selectionSettings.isActive
    );
  }

  private isSelectionDeleteEnabled() {
    return (
      this.isSelectionEnabled(this.selectionSettings) &&
      this.selectionSettings.delete
    );
  }

  private isSelectionCopyEnabled() {
    return (
      this.isSelectionEnabled(this.selectionSettings) &&
      this.selectionSettings.copy
    );
  }

  private isSelectionMoveEnabled() {
    return (
      this.isSelectionEnabled(this.selectionSettings) &&
      this.selectionSettings.move
    );
  }

  private isSelectionEnabled(
    selectionSettings: SelectionSettings | null,
  ): selectionSettings is SelectionSettings {
    return selectionSettings !== null;
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
      this.canvasOverlay.addEventListener("wheel", (e: WheelEvent) => {
        if (e.target !== this.canvasOverlay) return;
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

        this.transformHasChanged = true;
        e.stopPropagation();
      });
    }

    if (
      this.isPanEnabled(this.panSettings) ||
      this.isSelectionEnabled(this.selectionSettings)
    ) {
      addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.target instanceof SlInput) return; // Ignore all key downs if user is typing

        if (!this.isPanEnabled(this.panSettings)) return;

        if (e.key === this.panSettings.key) {
          this.canvasOverlay.style.cursor = "grab";
          this.isPanKeyDown = true;
        } else if (
          (e.key === "Delete" || e.key === "Backspace") &&
          this.isSelectionDeleteEnabled() &&
          this.selection !== null
        ) {
          this.dispatchEvent(new TilemapViewportSelectionDeleteEvent());
          this.selection = null;
          this.mouseAction = null;
        } else if (e.key === "Meta" || e.key === "Control") {
          this.isCtrlKeyDown = true;
        } else if (
          e.key.toLocaleLowerCase() === "c" &&
          this.isCtrlKeyDown &&
          this.selection !== null &&
          this.isSelectionCopyEnabled()
        ) {
          this.dispatchEvent(new TilemapViewportSelectionCopyEvent());
        }
      });

      addEventListener("keyup", (e: KeyboardEvent) => {
        if (e.target instanceof SlInput) return; // Ignore all key downs if user is typing
        if (!this.isPanEnabled(this.panSettings)) return;

        if (e.key === this.panSettings.key) {
          this.canvasOverlay.style.cursor = this.cursor;
          this.isPanKeyDown = false;
        } else if (e.key === "Meta" || e.key === "Control") {
          this.isCtrlKeyDown = false;
        }
      });

      this.canvasOverlay.addEventListener("mousedown", (e: MouseEvent) => {
        if (e.button === 0) {
          const { canvasPos, worldPos, isWithinGridBounds, tile } =
            this.getMouseCoordinates(e.clientX, e.clientY);

          if (this.isPanKeyDown) {
            this.mouseAction = {
              type: MouseActionType.PAN,
              data: {
                startPos: canvasPos,
                startTranslation: { ...this.translation },
              },
            };
          } else {
            if (this.isSelectionActive()) {
              // If mouse is down on selected rect, start move it
              if (
                this.isSelectionMoveEnabled() &&
                this.selection !== null &&
                isPointInRect(worldPos, {
                  x: Math.min(this.selection.x1, this.selection.x2),
                  y: Math.min(this.selection.y1, this.selection.y2),
                  height:
                    Math.max(this.selection.y1, this.selection.y2) -
                    Math.min(this.selection.y1, this.selection.y2),
                  width:
                    Math.max(this.selection.x1, this.selection.x2) -
                    Math.min(this.selection.x1, this.selection.x2),
                })
              ) {
                this.mouseAction = {
                  type: MouseActionType.MOVE_SELECTION,
                  data: {
                    startPos: worldPos,
                    selection: this.selection,
                    startSelection: { ...this.selection },
                  },
                };

                this.dispatchEvent(
                  new TilemapViewportSelectionMoveStartEvent(),
                );

                // Else start new selection
              } else {
                this.dispatchEvent(
                  new TilemapViewportSelectionChangeEvent(null),
                );
                this.mouseAction = {
                  type: MouseActionType.SELECT,
                  data: {
                    pos: worldPos,
                    selection: this.getSelectionRect(worldPos, worldPos),
                  },
                };
                this.selection = this.getSelectionRect(worldPos, worldPos);
              }
            } else {
              if (isWithinGridBounds) {
                this.mouseAction = {
                  type: MouseActionType.PAINT,
                  data: { lastPaintedTile: tile },
                };
                this.dispatchEvent(new TilemapViewportPaintEvent(tile));
              }
            }
          }
        }
      });

      this.canvasOverlay.addEventListener("mousemove", (e: MouseEvent) => {
        if (e.target !== this.canvasOverlay) return;

        const { canvasPos, worldPos, isWithinGridBounds, tile } =
          this.getMouseCoordinates(e.clientX, e.clientY);

        this.dispatchEvent(new TilemapViewportMousePosEvent(tile));

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

                const dxSnapped =
                  Math.round(dx / this.gridSettings.tileSize) *
                  this.gridSettings.tileSize;
                this.mouseAction.data.selection.x1 =
                  this.mouseAction.data.startSelection.x1 + dxSnapped;
                this.mouseAction.data.selection.x2 =
                  this.mouseAction.data.startSelection.x2 + dxSnapped;

                const dySnapped =
                  Math.round(dy / this.gridSettings.tileSize) *
                  this.gridSettings.tileSize;
                this.mouseAction.data.selection.y1 =
                  this.mouseAction.data.startSelection.y1 + dySnapped;
                this.mouseAction.data.selection.y2 =
                  this.mouseAction.data.startSelection.y2 + dySnapped;

                this.dispatchEvent(
                  new TilemapViewportSelectionMoveEvent({
                    x: dxSnapped,
                    y: dySnapped,
                  }),
                );
              }

              break;
            case MouseActionType.PAN:
              const dx = canvasPos.x - this.mouseAction.data.startPos.x;
              const dy = canvasPos.y - this.mouseAction.data.startPos.y;

              this.translation.x =
                this.mouseAction.data.startTranslation.x + dx;

              this.translation.y =
                this.mouseAction.data.startTranslation.y + dy;

              this.transformHasChanged = true;

              break;
            case MouseActionType.PAINT:
              if (
                isWithinGridBounds &&
                (tile.row !== this.mouseAction.data.lastPaintedTile.row ||
                  tile.col !== this.mouseAction.data.lastPaintedTile.col)
              ) {
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
            const tiles: Cell[] = [];

            const selection = this.mouseAction.data.selection;

            const minX = Math.max(0, Math.min(selection.x1, selection.x2));
            const maxX = Math.min(
              this.gridSettings.width - 1,
              Math.max(selection.x1, selection.x2),
            );
            const minY = Math.max(0, Math.min(selection.y1, selection.y2));
            const maxY = Math.min(
              this.gridSettings.height - 1,
              Math.max(selection.y1, selection.y2),
            );

            let row = 0;
            let col = 0;

            for (let y = minY; y < maxY; y += this.gridSettings.tileSize) {
              for (let x = minX; x < maxX; x += this.gridSettings.tileSize) {
                row = Math.floor(y / this.gridSettings.tileSize);
                col = Math.floor(x / this.gridSettings.tileSize);

                tiles.push({ row, col });
              }
            }

            this.dispatchEvent(new TilemapViewportSelectionChangeEvent(tiles));
          } else if (this.mouseAction.type === MouseActionType.MOVE_SELECTION) {
            this.dispatchEvent(new TilemapViewportSelectionMoveEndEvent());
          }

          this.mouseAction = null;
        }
      });

      this.canvasOverlay.addEventListener("contextmenu", (e: MouseEvent) => {
        if (e.target !== this.canvasOverlay) return;

        const { isWithinGridBounds, tile } = this.getMouseCoordinates(
          e.clientX,
          e.clientY,
        );

        if (isWithinGridBounds) {
          this.dispatchEvent(new TilemapViewportRightClickEvent(tile));
        }

        e.preventDefault();
        e.stopPropagation();
      });
    }
  }

  private getMouseCoordinates(
    clientX: number,
    clientY: number,
  ): {
    canvasPos: Vec2;
    worldPos: Vec2;
    tile: Cell;
    isWithinGridBounds: boolean;
  } {
    const rect = this.canvas.getBoundingClientRect();

    const x = Math.round(clientX - rect.left);
    const y = Math.round(clientY - rect.top);

    const worldPos = this.getWorldPos({
      x,
      y,
    });

    const row = Math.floor(worldPos.y / this.gridSettings.tileSize);
    const col = Math.floor(worldPos.x / this.gridSettings.tileSize);

    const isWithinGridBounds =
      worldPos.x >= 0 &&
      worldPos.x <= this.gridSettings.width &&
      worldPos.y >= 0 &&
      worldPos.y <= this.gridSettings.height;

    return {
      canvasPos: { x, y },
      worldPos,
      isWithinGridBounds,
      tile: { row, col },
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

    if (rect.x1 === rect.x2) {
      rect.x2 += tileSize;
    }

    if (startPos.y <= mousePos.y) {
      rect.y1 = Math.floor(startPos.y / tileSize) * tileSize;
      rect.y2 = Math.ceil(mousePos.y / tileSize) * tileSize;
    } else {
      rect.y1 = Math.ceil(startPos.y / tileSize) * tileSize;
      rect.y2 = Math.floor(mousePos.y / tileSize) * tileSize;
    }

    if (rect.y1 === rect.y2) {
      rect.y2 += tileSize;
    }

    return rect;
  }

  private getWorldPos(pos: Vec2) {
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
