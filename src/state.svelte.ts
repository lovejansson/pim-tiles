import {
  type GUIState,
  type TileLayer,
  type AssetRef,
  type AutoTile,
  type HistoryEntry,
  type TileRule,
  type Layer,
  PaintType,
  TileRequirement,
  Tool,
  type PaintedAutoTile,
  type AutoTileHistoryEntryItem,
  type TileAsset,
  type PaintedAsset,
  type Point,
  type ProjectStateJSONExport,
  type Tileset,
  type Cell,
  type PaintedTile,
  type PaintedArea,
  type LayerData,
  type Tile,
  type Area,
} from "./types";
import { getNeighbours, createOffScreenCanvas } from "./utils";

const DEFAULT_TILE_SIZE = 16;
const DEFAULT_ROWS = 90;
const DEFAULT_COLS = 160;
const DEFAULT_WIDTH = DEFAULT_COLS * DEFAULT_TILE_SIZE;
const DEFAULT_HEIGHT = DEFAULT_ROWS * DEFAULT_TILE_SIZE;
const MAX_TILES = 250;

const DEFAULT_LAYER: TileLayer = {
  id: crypto.randomUUID(),
  name: "bg",
  type: PaintType.TILE,
};

// TODO: which needs to be reactive for GUI???
export const guiState: GUIState = $state({
  tilemapEditorState: {
    type: PaintType.TILE,
    selectedLayer: DEFAULT_LAYER.id,
    selectedAsset: null,
    selectedTool: Tool.PAINT,
    fillToolIsActive: false,
  },
  notification: null,
  gridColor: "#000",
  showGrid: true,
  mouseTilePos: { row: 0, col: 0 },
  visibleLayers: {},
});

enum ErrorCode {
  NOT_FOUND = "not-found",
  BAD_REQUEST = "bad-request",
  TYPE_ERROR = "type-error",
  OUT_OF_BOUNDS = "out-of-bounds",
}

class ProjectStateError extends Error {
  constructor(
    msg: string,
    public code: ErrorCode,
  ) {
    super(msg);
    this.name = "ProjectStateError";
    this.code = code;
  }
}

type ProjectStateChangeEvent = { prev: HistoryEntry; next: HistoryEntry };

class ProjectStateEventEmitter extends EventTarget {
  emit(event: ProjectStateChangeEvent) {
    this.dispatchEvent(
      new CustomEvent("project-state-change", { detail: event }),
    );
  }
}

const projectStateChangeEvents = new ProjectStateEventEmitter();

class ProjectState {
  name: string; // Change the name however u like
  private _tileSize: number;
  private _width: number;
  private _height: number;
  private _rows: number;
  private _cols: number;

  private layers: Layer[];
  private tilesets: Tileset[];
  private autoTiles: AutoTile[];
  private areas: Area[];
  private attributes: Map<string, Map<string, string>>;
  private layerData: Map<string, LayerData>;

  constructor() {
    this.name = "My project";
    this._tileSize = $state(DEFAULT_TILE_SIZE);
    this._width = $state(DEFAULT_WIDTH);
    this._height = $state(DEFAULT_HEIGHT);
    this._rows = $derived(this._height / this._tileSize);
    this._cols = $derived(this._width / this._tileSize);

    this.layers = $state([]);
    this.tilesets = $state([]);
    this.autoTiles = $state([]);
    this.areas = $state([]);
    this.attributes = new Map();
    this.layerData = new Map();
  }

  init() {
    this.createDefaultLayers();
  }

  set tileSize(px: number) {
    if (![16, 32, 48, 64].includes(px))
      throw new ProjectStateError(
        "Tile size must be 16, 32, 48 or 64",
        ErrorCode.BAD_REQUEST,
      );

    this._tileSize = px;
  }

  get tileSize() {
    return this._tileSize;
  }

  get height() {
    return this._height;
  }

  set height(px: number) {
    if (px > MAX_TILES)
      throw new ProjectStateError(
        "Maximum allowed height for tilemap is " + MAX_TILES * this.tileSize,
        ErrorCode.BAD_REQUEST,
      );

    this._height = px;
  }

  get width() {
    return this._width;
  }

  set width(px: number) {
    if (px > MAX_TILES)
      throw new ProjectStateError(
        "Maximum allowed width for tilemap is " + MAX_TILES * this.tileSize,
        ErrorCode.BAD_REQUEST,
      );

    this._width = px;
  }

  get rows() {
    return this._rows;
  }

  get cols() {
    return this._cols;
  }

  getTilesets() {
    return this.tilesets;
  }

  getTileset(id: string) {
    const tileset = this.tilesets.find((t) => t.id === id);
    if (tileset === undefined)
      throw new ProjectStateError("Tileset not found", ErrorCode.NOT_FOUND);
    return tileset;
  }

  getTileDataUrl(tile: Tile): string {
    const tileset = this.tilesets.find((ts) => ts.id === tile.tilesetId);

    if (tileset === undefined)
      throw new ProjectStateError("Tileset not found", ErrorCode.NOT_FOUND);

    if (
      tile.tilesetPos.x < 0 ||
      tile.tilesetPos.x > tileset.width - this.tileSize ||
      tile.tilesetPos.y < 0 ||
      tile.tilesetPos.y > tileset.height - this.tileSize
    )
      throw new ProjectStateError(
        "Tile pos out of bounds",
        ErrorCode.OUT_OF_BOUNDS,
      );

    const ctxTile = createOffScreenCanvas(this.tileSize, this.tileSize);
    ctxTile.drawImage(
      tileset.spritesheet,
      tile.tilesetPos.x,
      tile.tilesetPos.y,
      this.tileSize,
      this.tileSize,
      0,
      0,
      this.tileSize,
      this.tileSize,
    );

    return ctxTile.canvas.toDataURL();
  }

  addTileset(name: string, bitmap: ImageBitmap) {
    const tileset: Tileset = {
      id: this.generateId(),
      name,
      width: bitmap.width,
      height: bitmap.height,
      spritesheet: bitmap,
    };

    this.tilesets.push(tileset);
  }

  deleteTileset(id: string) {
    const idx = this.tilesets.findIndex((t) => t.id === id);

    if (idx === -1)
      throw new ProjectStateError("Tileset not found", ErrorCode.NOT_FOUND);

    const tileset = this.tilesets[idx];

    const isUsedInTileLayer =
      this.layers.find((l) => {
        if (l.type === PaintType.TILE) {
          const data = this.getLayerData(l.id);
          if (
            data.find(
              (r) =>
                r.find(
                  (c) =>
                    c !== null &&
                    c.type === PaintType.TILE &&
                    c.ref.tile.tilesetId === tileset.id,
                ) !== undefined,
            ) !== undefined
          )
            return true;
        }
        return false;
      }) !== undefined;

    const isUsedInAutoTile =
      this.autoTiles.find(
        (a) =>
          a.rules.find((r) => r.tile?.ref.tile.tilesetId === tileset.id) !==
          undefined,
      ) !== undefined;

    if (isUsedInTileLayer || isUsedInAutoTile)
      throw new ProjectStateError(
        "Tileset is referenced in project",
        ErrorCode.BAD_REQUEST,
      );

    this.tilesets.splice(idx, 1);
  }

  getAreas() {
    return this.areas;
  }

  getArea(id: string) {
    const area = this.areas.find((a) => a.id === id);
    if (area === undefined)
      throw new ProjectStateError("Area not found", ErrorCode.NOT_FOUND);
    return area;
  }

  addArea(name: string, color: string, isWalkable: boolean) {
    this.areas.push({
      id: this.generateId(),
      name,
      color,
      isWalkable,
    });
  }

  updateArea(area: Area) {
    const idx = this.areas.findIndex((a) => a.id === area.id);
    if (idx === -1)
      throw new ProjectStateError("Area not found", ErrorCode.NOT_FOUND);
    this.areas[idx] = area;
  }

  deleteArea(id: string) {
    const idx = this.areas.findIndex((a) => a.id === id);
    if (idx === -1)
      throw new ProjectStateError("Area not found", ErrorCode.NOT_FOUND);
    const area = this.areas[idx];

    const isUsed =
      this.layers.find((l) => {
        if (l.type === PaintType.AREA) {
          const data = this.getLayerData(l.id);
          if (
            data.find(
              (r) =>
                r.find(
                  (c) =>
                    c !== null &&
                    c.type === PaintType.AREA &&
                    c.ref.id === area.id,
                ) !== undefined,
            ) !== undefined
          )
            return true;
        }
        return false;
      }) !== undefined;

    if (isUsed)
      throw new ProjectStateError(
        "Area is referenced in project",
        ErrorCode.BAD_REQUEST,
      );

    this.areas.splice(idx, 1);
  }

  getAutoTiles() {
    return this.autoTiles;
  }

  getAutoTile(id: string) {
    const autoTile = this.autoTiles.find((at) => at.id === id);
    if (autoTile === undefined)
      throw new ProjectStateError("Autotile not found", ErrorCode.NOT_FOUND);
    return autoTile;
  }

  addAutoTile(name: string, rules: TileRule[], defaultTile: TileAsset) {
    this.autoTiles.push({
      id: this.generateId(),
      name: name,
      rules: rules,
      defaultTile,
    });
  }
  updateAutoTile(autoTile: AutoTile) {
    const idx = this.autoTiles.findIndex((at) => at.id === autoTile.id);
    if (idx === -1)
      throw new ProjectStateError("Autotile not found", ErrorCode.NOT_FOUND);
    this.autoTiles[idx] = autoTile;
  }

  deleteAutoTile(id: string) {
    const idx = this.autoTiles.findIndex((at) => at.id === id);
    if (idx === -1)
      throw new ProjectStateError("Autotile not found", ErrorCode.NOT_FOUND);

    const autoTile = this.autoTiles[idx];

    const isUsed =
      this.layers.find((l) => {
        if (l.type === PaintType.AUTO_TILE) {
          const data = this.getLayerData(l.id);
          if (
            data.find((r) =>
              r.find(
                (c) =>
                  c !== null &&
                  c.type === PaintType.AUTO_TILE &&
                  c.ref.id === autoTile.id,
              ),
            )
          )
            return true;
        }
        return false;
      }) !== undefined;
    if (isUsed)
      throw new ProjectStateError(
        "Autotile is referenced in project",
        ErrorCode.BAD_REQUEST,
      );
    this.autoTiles.splice(idx, 1);
  }

  getAttributes() {
    return this.attributes;
  }

  getTileAttributes(cell: Cell) {
    const attributes = this.attributes.get(`${cell.row}:${cell.col}`);
    if (attributes === undefined)
      throw new ProjectStateError("Attributes not found", ErrorCode.NOT_FOUND); // TODO: errors????

    return attributes;
  }

  updateTileAttributes(cell: Cell, attributes: Map<string, string>) {
    this.attributes.set(`${cell.row}:${cell.col}`, attributes);
  }

  deleteTileAttributes(cell: Cell) {
    this.attributes.delete(`${cell.row}:${cell.col}`); // TODO not found?
  }

  getLayers() {
    return this.layers;
  }

  setReorderedLayers(layers: Layer[]) {
    //TODO:  Make sure that the new layers are identical to existing layers

    this.layers = layers;
  }

  getLayer(id: string): Layer {
    const layer = this.layers.find((l) => l.id === id);
    if (layer === undefined)
      throw new ProjectStateError("Layer not found", ErrorCode.NOT_FOUND);
    return layer;
  }
  getLayerData(id: string): LayerData {
    const data = this.layerData.get(id);

    if (data === undefined)
      throw new ProjectStateError("Layer not found", ErrorCode.NOT_FOUND);

    return data;
  }
  addLayer(name: string, type: PaintType) {
    const id = this.generateId();

    this.layerData.set(
      id,
      new Array(DEFAULT_ROWS)
        .fill(null)
        .map((_) => new Array(DEFAULT_COLS).fill(null)),
    );

    switch (type) {
      case PaintType.TILE:
        this.layers.push({
          id,
          name,
          type,
        });
        break;
      case PaintType.AUTO_TILE:
        this.layers.push({
          id,
          name,
          type,
        });
        break;
      case PaintType.AREA:
        this.layers.push({
          id,
          name,
          type,
        });
        break;
    }
  }

  updateLayer(id: string, name: string) {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx === -1)
      throw new ProjectStateError("Layer not found", ErrorCode.NOT_FOUND);
    this.layers[idx].name = name;
  }

  deleteLayer(id: string) {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx === -1)
      throw new ProjectStateError("Layer not found", ErrorCode.NOT_FOUND);
    this.layers.splice(idx, 1);
  }

  getTileAt(row: number, col: number, layerID: string): PaintedAsset | null {
    const data = this.getLayerData(layerID);
    return data[row][col];
  }

  paintTile(row: number, col: number, layerID: string, paint: PaintedAsset) {
    const layer = this.getLayer(layerID);

    // TODO: can this be done better with typescript generics?

    if (layer.type !== paint.type)
      throw new ProjectStateError(
        "type mismatch between layer and asset",
        ErrorCode.TYPE_ERROR,
      );

    const data = this.getLayerData(layerID);
    const curr = data[row][col];

    // Don't do anything if the same tile is being painted again
    if (this.isSameAsset(curr, paint)) {
      return;
    }

    data[row][col] = { ...paint };

    projectStateChangeEvents.emit({
      prev: {
        type: paint.type,
        layer: { id: layerID },
        items: [
          { data: curr ? ({ ...curr } as any) : null, pos: { row, col } },
        ],
      },
      next: {
        type: paint.type,
        layer: { id: layerID },
        items: [{ data: { ...paint } as any, pos: { row, col } }],
      },
    });
  }

  paintTiles(row: number, col: number, layerID: string, tiles: TileAsset[]) {
    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);

    if (layer.type !== PaintType.TILE)
      throw new ProjectStateError(
        "type mismatch between layer and asset",
        ErrorCode.TYPE_ERROR,
      );

    const tileSize = this.tileSize;

    const prevTiles = [];
    const nextTiles = [];

    const minX = Math.min(...tiles.map((t) => t.ref.tile.tilesetPos.x));
    const minY = Math.min(...tiles.map((t) => t.ref.tile.tilesetPos.y));

    for (const t of tiles) {
      const r = row + Math.floor((t.ref.tile.tilesetPos.y - minY) / tileSize);
      const c = col + Math.floor((t.ref.tile.tilesetPos.x - minX) / tileSize);

      if (r >= this.rows || c >= this.cols) continue; // out of bounds

      const curr = data[r][c];

      // Don't do anything if the same tile is being painted again
      if (this.isSameAsset(curr, t)) {
        return;
      }

      data[r][c] = { ...t };

      prevTiles.push({
        data: curr ? ({ ...curr } as any) : null,
        pos: { row: r, col: c },
      });
      nextTiles.push({
        data: t !== null ? ({ ...t } as any) : null,
        pos: { row: r, col: c },
      });
    }

    projectStateChangeEvents.emit({
      prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
      next: { type: layer.type, layer: { id: layerID }, items: nextTiles },
    });
  }

  applyPaintTileChange(
    row: number,
    col: number,
    layerID: string,
    paint: PaintedAsset | null,
  ) {
    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);

    // TODO: can this be done better with typescript generics?
    if (paint === null) {
      data[row][col] = null;
    } else {
      if (layer.type !== paint.type)
        throw new ProjectStateError(
          "type mismatch between layer and asset",
          ErrorCode.TYPE_ERROR,
        );
      data[row][col] = { ...paint };
    }
  }

  eraseTile(row: number, col: number, layerID: string) {
    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);
    const curr = data[row][col];

    // Don't do anything if the tile is already erased
    if (this.isSameAsset(curr, null)) {
      return;
    }

    data[row][col] = null;

    projectStateChangeEvents.emit({
      prev: {
        type: layer.type,
        layer: { id: layerID },
        items: [
          { data: curr ? ({ ...curr } as any) : null, pos: { row, col } },
        ],
      },
      next: {
        type: layer.type,
        layer: { id: layerID },
        items: [{ data: null, pos: { row, col } }],
      },
    });
  }

  floodFill(
    layerID: string,
    row: number,
    col: number,
    paint: PaintedAsset | null,
  ) {
    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);

    if (paint !== null && layer.type !== paint.type)
      throw new ProjectStateError(
        "type mismatch between layer and asset",
        ErrorCode.TYPE_ERROR,
      );

    const clickedTile = this.getTileAt(row, col, layerID);

    const stack = [{ row, col }];

    const visited = new Set();

    visited.add(`${row}:${col}`);

    const filledTiles: { row: number; col: number }[] = [];

    while (stack.length > 0) {
      const tile = stack.pop()!;

      const neighbours = getNeighbours(
        { row: tile.row, col: tile.col },
        this.rows,
        this.cols,
      );

      for (const n of neighbours) {
        const visitedKey = `${n.row}:${n.col}`;

        if (
          !visited.has(visitedKey) &&
          this.isSameAsset(clickedTile, this.getTileAt(n.row, n.col, layerID))
        ) {
          visited.add(`${n.row}:${n.col}`);
          stack.push(n);
        }
      }

      filledTiles.push(tile);
    }

    const prevTiles = filledTiles.map((ft) => {
      const curr = data[ft.row][ft.col];
      return {
        data: curr ? ({ ...curr } as any) : null,
        pos: { row: ft.row, col: ft.col },
      };
    });

    const nextItems = filledTiles.map((ft) => {
      return {
        data: paint !== null ? ({ ...paint } as any) : null,
        pos: { row: ft.row, col: ft.col },
      };
    });

    for (const ft of filledTiles) {
      if (paint === null) {
        data[ft.row][ft.col] = null;
      } else {
        data[ft.row][ft.col] = { ...paint };
        // If is auto tile layer, this will have to take into account the same procedure as in auto tile paint
      }
    }

    projectStateChangeEvents.emit({
      prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
      next: { type: layer.type, layer: { id: layerID }, items: nextItems },
    });
  }

  paintWithAutoTile(
    row: number,
    col: number,
    autoTileID: string,
    layerID: string,
  ): void {
    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);

    if (layer.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "paintWithAutoTile only supported for auto-tile layers",
        ErrorCode.TYPE_ERROR,
      );

    const currTile = this.getTileAt(row, col, layerID);

    if (currTile !== null && currTile.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "Painted asset is not of type auto tile",
        ErrorCode.TYPE_ERROR,
      );

    // Don't paint if the tile is already painted with auto tile
    if (currTile !== null && currTile?.ref.id === autoTileID) return;

    const autoTile = this.getAutoTile(autoTileID);

    const tile = this.pickTileFromAutoTile(row, col, autoTile, layerID);

    const prevTiles: AutoTileHistoryEntryItem[] = [];
    const paintedTiles: AutoTileHistoryEntryItem[] = [];

    prevTiles.push({
      pos: { row, col },
      data: currTile as PaintedAutoTile | null,
    });
    paintedTiles.push({
      pos: { row, col },
      data: { type: PaintType.AUTO_TILE, ref: { id: autoTileID }, tile },
    });

    data[row][col] = {
      type: PaintType.AUTO_TILE,
      ref: { id: autoTileID },
      tile,
    };

    const neighbours = getNeighbours({ row, col }, this.rows, this.cols, true);

    for (const n of neighbours) {
      const currTile = this.getTileAt(n.row, n.col, layerID);

      if (
        currTile !== null &&
        currTile.type === PaintType.AUTO_TILE &&
        currTile.ref.id === autoTileID
      ) {
        const tile = this.pickTileFromAutoTile(n.row, n.col, autoTile, layerID);

        prevTiles.push({
          pos: { row: n.row, col: n.col },
          data: currTile as PaintedAutoTile,
        });
        paintedTiles.push({
          pos: { row: n.row, col: n.col },
          data: {
            type: PaintType.AUTO_TILE,
            ref: { id: autoTileID },
            tile,
          },
        });

        data[n.row][n.col] = {
          type: PaintType.AUTO_TILE,
          ref: { id: autoTileID },
          tile,
        };
      }
    }

    projectStateChangeEvents.emit({
      prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
      next: {
        type: layer.type,
        layer: { id: layerID },
        items: paintedTiles,
      },
    });
  }

  eraseAutoTile(row: number, col: number, layerID: string): void {
    const currTile = this.getTileAt(row, col, layerID);
    // Ignore if tile already erased
    if (currTile === null) return;

    if (currTile.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "Tile is not painted with auto tile asset",
        ErrorCode.TYPE_ERROR,
      );

    const autoTile = this.getAutoTile(currTile.ref.id);

    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);

    if (layer.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "eraseAutoTile only supported for auto-tile layers",
        ErrorCode.TYPE_ERROR,
      );

    const prevTiles: AutoTileHistoryEntryItem[] = [];
    const paintedTiles: AutoTileHistoryEntryItem[] = [];

    prevTiles.push({ pos: { row, col }, data: { ...currTile } });

    data[row][col] = null;

    paintedTiles.push({ pos: { row: row, col: col }, data: null });

    const neighbours = getNeighbours({ row, col }, this.rows, this.cols, true);

    for (const n of neighbours) {
      const currTile = this.getTileAt(n.row, n.col, layerID);

      // If painted with same auto tile, update its content
      if (
        currTile !== null &&
        currTile.type === PaintType.AUTO_TILE &&
        currTile.ref.id === autoTile.id
      ) {
        prevTiles.push({
          pos: { row: n.row, col: n.col },
          data: { ...currTile },
        });

        const tile = this.pickTileFromAutoTile(n.row, n.col, autoTile, layerID);

        paintedTiles.push({
          pos: { row: n.row, col: n.col },
          data: { ...currTile, tile },
        });

        data[n.row][n.col] = { ...currTile, tile };
      }
    }

    projectStateChangeEvents.emit({
      prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
      next: {
        type: layer.type,
        layer: { id: layerID },
        items: paintedTiles,
      },
    });
  }

  isSameAsset(a: AssetRef | null, b: AssetRef | null): boolean {
    if (a === null && b === null) return true;

    if (a === null || b === null) return false;

    if (a.type !== b.type) return false;

    switch (a.type) {
      case PaintType.TILE:
        return (
          a.ref.tile.tilesetId === (b as typeof a).ref.tile.tilesetId &&
          a.ref.tile.tilesetPos.y === (b as typeof a).ref.tile.tilesetPos.y &&
          a.ref.tile.tilesetPos.x === (b as typeof a).ref.tile.tilesetPos.x
        );
      case PaintType.AUTO_TILE:
        return a.ref.id === (b as typeof a).ref.id;
      case PaintType.AREA:
        return a.ref.id === (b as typeof a).ref.id;
    }
  }

  getJSONExport(): string {
    const tileSize = this.tileSize;

    const ctx = createOffScreenCanvas(this.width, this.height);

    // Paint tile and auto tile layers on canvas

    for (const layer of this.layers) {
      const data = this.getLayerData(layer.id);
      switch (layer.type) {
        case PaintType.TILE:
          {
            let tile: PaintedTile | null = null;

            for (let r = 0; r < this.rows; ++r) {
              for (let c = 0; c < this.cols; ++c) {
                tile = data[r][c] as PaintedTile | null;
                if (tile !== null) {
                  const tileset = this.getTileset(tile.ref.tile.tilesetId);

                  ctx.drawImage(
                    tileset.spritesheet,
                    tile.ref.tile.tilesetPos.x,
                    tile.ref.tile.tilesetPos.y,
                    tileSize,
                    tileSize,
                    c * tileSize,
                    c * tileSize,
                    tileSize,
                    tileSize,
                  );
                }
              }
            }
          }

          break;
        case PaintType.AUTO_TILE: {
          let autoTileAsset: PaintedAutoTile | null = null;

          for (let r = 0; r < this.rows; ++r) {
            for (let c = 0; c < this.cols; ++c) {
              autoTileAsset = data[r][c] as PaintedAutoTile | null;

              if (autoTileAsset !== null) {
                const tileset = this.getTileset(
                  autoTileAsset.tile.ref.tile.tilesetId,
                );

                ctx.drawImage(
                  tileset.spritesheet,
                  autoTileAsset.tile.ref.tile.tilesetPos.x,
                  autoTileAsset.tile.ref.tile.tilesetPos.y,
                  tileSize,
                  tileSize,
                  c * tileSize,
                  r * tileSize,
                  tileSize,
                  tileSize,
                );
              }
            }
          }
          break;
        }
      }
    }

    // Create areas array based of of areas have been painted

    const areas: { name: string; tiles: Point[] }[] = this.layers
      .filter((l) => l.type === PaintType.AREA)
      .reduce(
        (acc, curr) => {
          let areaAsset: PaintedArea | null = null;
          const data = this.getLayerData(curr.id);
          for (let r = 0; r < this.rows; ++r) {
            for (let c = 0; c < this.cols; ++c) {
              areaAsset = data[r][c] as PaintedArea | null;
              if (areaAsset !== null) {
                const area = this.getArea(areaAsset.ref.id);
                const areaItem = acc.find((a) => a.name === area.name);

                if (areaItem !== undefined) {
                  areaItem.tiles.push({
                    x: c * this.tileSize,
                    y: r * this.tileSize,
                  });
                } else {
                  acc.push({
                    name: area.name,
                    tiles: [
                      {
                        x: c * this.tileSize,
                        y: r * this.tileSize,
                      },
                    ],
                  });
                }
              }
            }
          }

          return acc;
        },
        [] as { name: string; tiles: Point[] }[],
      );

    // Create attributes array

    const attributes: { pos: Point; attributes: { [k: string]: string } }[] =
      Array.from(this.attributes.entries()).map((e) => {
        const [row, col] = e[0].split(":").map(Number);

        return {
          pos: {
            x: col * this.tileSize,
            y: row * this.tileSize,
          },
          attributes: Object.fromEntries(e[1]),
        };
      });

    const data: ProjectStateJSONExport = {
      tilemap: ctx.canvas.toDataURL(),
      areas,
      tileSize: this.tileSize,
      name: this.name,
      attributes,
    };

    return JSON.stringify(data);
  }

  private pickTileFromAutoTile(
    row: number,
    col: number,
    autoTile: AutoTile,
    layerID: string,
  ): TileAsset {
    const n = this.getTileAt(row - 1, col, layerID);
    const ne = this.getTileAt(row - 1, col + 1, layerID);
    const e = this.getTileAt(row, col + 1, layerID);
    const se = this.getTileAt(row + 1, col + 1, layerID);
    const s = this.getTileAt(row + 1, col, layerID);
    const sw = this.getTileAt(row + 1, col - 1, layerID);
    const w = this.getTileAt(row, col - 1, layerID);
    const nw = this.getTileAt(row + 1, col - 1, layerID);

    const connections = {
      n:
        n !== null &&
        n.type === PaintType.AUTO_TILE &&
        n.ref.id === autoTile.id,
      ne:
        ne !== null &&
        ne.type === PaintType.AUTO_TILE &&
        ne.ref.id === autoTile.id,
      e:
        e !== null &&
        e.type === PaintType.AUTO_TILE &&
        e.ref.id === autoTile.id,
      se:
        se !== null &&
        se.type === PaintType.AUTO_TILE &&
        se.ref.id === autoTile.id,
      s:
        s !== null &&
        s.type === PaintType.AUTO_TILE &&
        s.ref.id === autoTile.id,
      sw:
        sw !== null &&
        sw.type === PaintType.AUTO_TILE &&
        sw.ref.id === autoTile.id,
      w:
        w !== null &&
        w.type === PaintType.AUTO_TILE &&
        w.ref.id === autoTile.id,
      nw:
        nw !== null &&
        nw.type === PaintType.AUTO_TILE &&
        nw.ref.id === autoTile.id,
    };

    const rules = autoTile.rules.filter((tr) => {
      return (
        ((tr.connections.n === TileRequirement.REQUIRED && connections.n) ||
          (tr.connections.n === TileRequirement.EXCLUDED && !connections.n) ||
          tr.connections.n === TileRequirement.OPTIONAL) &&
        ((tr.connections.ne === TileRequirement.REQUIRED && connections.ne) ||
          (tr.connections.ne === TileRequirement.EXCLUDED && !connections.ne) ||
          tr.connections.ne === TileRequirement.OPTIONAL) &&
        ((tr.connections.e === TileRequirement.REQUIRED && connections.e) ||
          (tr.connections.e === TileRequirement.EXCLUDED && !connections.e) ||
          tr.connections.e === TileRequirement.OPTIONAL) &&
        ((tr.connections.se === TileRequirement.REQUIRED && connections.se) ||
          (tr.connections.se === TileRequirement.EXCLUDED && !connections.se) ||
          tr.connections.se === TileRequirement.OPTIONAL) &&
        ((tr.connections.s === TileRequirement.REQUIRED && connections.s) ||
          (tr.connections.s === TileRequirement.EXCLUDED && !connections.s) ||
          tr.connections.s === TileRequirement.OPTIONAL) &&
        ((tr.connections.sw === TileRequirement.REQUIRED && connections.sw) ||
          (tr.connections.sw === TileRequirement.EXCLUDED && !connections.sw) ||
          tr.connections.sw === TileRequirement.OPTIONAL) &&
        ((tr.connections.w === TileRequirement.REQUIRED && connections.w) ||
          (tr.connections.w === TileRequirement.EXCLUDED && !connections.w) ||
          tr.connections.w === TileRequirement.OPTIONAL) &&
        ((tr.connections.nw === TileRequirement.REQUIRED && connections.nw) ||
          (tr.connections.nw === TileRequirement.EXCLUDED && !connections.nw) ||
          tr.connections.nw === TileRequirement.OPTIONAL)
      );
    });

    return rules.length > 0
      ? rules[Math.floor(Math.random() * rules.length)].tile
      : autoTile.defaultTile;
  }

  private createDefaultLayers() {
    const layers: Layer[] = [DEFAULT_LAYER];
    this.layerData.set(
      DEFAULT_LAYER.id,
      new Array(DEFAULT_ROWS)
        .fill(null)
        .map((_) => new Array(DEFAULT_COLS).fill(null)),
    );

    for (const { name, type } of [
      { name: "Ground", type: PaintType.AUTO_TILE },
      { name: "Fg", type: PaintType.TILE },
      { name: "Zones", type: PaintType.AREA },
    ]) {
      const id = this.generateId();
      this.layerData.set(
        id,
        new Array(DEFAULT_ROWS)
          .fill(null)
          .map((_) => new Array(DEFAULT_COLS).fill(null)),
      );

      layers.push({
        id,
        name,
        type,
      });
    }
    this.layers = layers;
  }

  private generateId() {
    return crypto.randomUUID();
  }
}

export const projectState = new ProjectState();
projectState.init();

export const HistoryStack = (() => {
  // History management
  // Each action consists of two entries, the previous state and the next state after the action
  // When undoing, we decrement the currIdx and repaint the previous state and then move back one more to point to the previous action
  // When redoing, we increment the currIdx by two to point to the next action and repaint that state
  // The stack listens to project state change events to build the history via the projectStateChangeEvents emitter

  const history: HistoryEntry[] = [];
  let currIdx = 0;

  projectStateChangeEvents.addEventListener("project-state-change", (e) => {
    if (currIdx !== history.length - 1) {
      history.splice(currIdx + 1);
    }

    history.push((e as CustomEvent<ProjectStateChangeEvent>).detail.prev);
    history.push((e as CustomEvent<ProjectStateChangeEvent>).detail.next);
    currIdx = history.length - 1;
  });

  const repaint = () => {
    const entry = history[currIdx];
    if (!entry) return;

    const layer = projectState.getLayer(entry.layer.id);

    if (layer.type !== entry.type)
      throw new Error("type mismatch between layer and entry");
    for (const i of entry.items) {
      projectState.applyPaintTileChange(
        i.pos.row,
        i.pos.col,
        entry.layer.id,
        i.data,
      );
    }
  };

  return {
    undo() {
      if (currIdx === 0) return;
      currIdx--; // First repaint what was previously done
      repaint();
      currIdx--; // Move to the previous state
    },

    redo() {
      if (currIdx === history.length - 1) return;
      currIdx += 2; // Advance by two to redo the next action
      repaint();
    },
  };
})();
