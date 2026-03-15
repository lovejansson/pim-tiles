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
  type IdRef,
  type PaintedAutoTile,
  type AutoTileHistoryEntryItem,
  type TileAsset,
  type PaintedAsset,
  type Point,
  type ProjectStateJSONExport,
  type Tileset,
  type Cell,
  type PaintedTile,
  type LayerData,
  type Tile,
  type ProjectFile,
  type AutoTileAsset,
  type TileHistoryEntryItem,
  type TypedId,
} from "./types";
import {
  getNeighbours,
  createCanvas,
  canvasToBlob,
  dataURLToImageBitmap,
} from "./utils";

const DEFAULT_LAYER: TileLayer = {
  id: crypto.randomUUID(),
  name: "bg",
  type: PaintType.TILE,
};

export const guiState: GUIState = $state({
  tilemapEditorState: {
    type: PaintType.TILE,
    selectedLayer: DEFAULT_LAYER.id,
    selectedAsset: null,
    selectedTool: Tool.PAINT,
    fillToolIsActive: false,
  },
  notification: null,
  gridColor: "#0217f6",
  showGrid: false,
  mouseTilePos: { row: 0, col: 0 },
  visibleLayers: {},
});

export enum ProjectStateErrorCode {
  NOT_FOUND = "not-found",
  BAD_REQUEST = "bad-request",
  TYPE_ERROR = "type-error",
  OUT_OF_BOUNDS = "out-of-bounds",
  SERVER_ERROR = "server-error",
}

export class ProjectStateError extends Error {
  constructor(
    msg: string,
    public code: ProjectStateErrorCode,
  ) {
    super(msg);
    this.name = "ProjectStateError";
    this.code = code;
  }
}

export enum ProjectStateEventType {
  PAINT = "paint",
  OPEN_FILE = "open-file",
  DIMENSIONS_CHANGE = "dimensions-change",
  NEW_PROJECT = "new-project",
  ASSET_UPDATE = "asset-update",
  AUTO_TILES_UPDATE = "auto-tiles-update",
  TILESETS_UPDATE = "tilesets-update",
  LAYERS_UPDATE = "layers-update",
}

type ProjectStateEventDetail<T extends ProjectStateEventType> =
  T extends ProjectStateEventType.PAINT
    ? { prev: HistoryEntry; next: HistoryEntry }
    : T extends ProjectStateEventType.ASSET_UPDATE
      ? { layers: string[] }
      : null;

type ProjectStateEvent<T extends ProjectStateEventType> = CustomEvent<
  ProjectStateEventDetail<T>
>;

class ProjectStateEventEmitter extends EventTarget {
  emit<T extends ProjectStateEventType>(
    type: T,
    event: ProjectStateEventDetail<T>,
  ) {
    this.dispatchEvent(new CustomEvent(type, { detail: event }));
  }

  on<T extends ProjectStateEventType>(
    type: T,
    listener: (ev: ProjectStateEvent<T>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    super.addEventListener(type, listener as EventListener, options);
    return () =>
      super.removeEventListener(type, listener as EventListener, options);
  }
}

export const projectStateEvents = new ProjectStateEventEmitter();

export class ProjectState {
  static VALID_TILE_SIZES = [16, 32];
  static DEFAULT_TILE_SIZE = 16;
  static DEFAULT_ROWS = 250;
  static DEFAULT_COLS = 250;
  static DEFAULT_WIDTH = 250 * 16;
  static DEFAULT_HEIGHT = 250 * 16;
  static MAX_TILES = 250;

  public name: string; // Change the name however u like
  private _tileSize: number;
  private _width: number;
  private _height: number;
  private _rows: number;
  private _cols: number;

  private layers: Layer[];

  private tilesets: Tileset[];
  private autoTiles: AutoTile[];
  private attributes: Map<string, Map<string, string>>; // Attributes for cells on tilemap least priority
  private tileAttributes: Map<string, Map<string, string>>; // Attributes for a tile highest priority
  private autoTileAttributes: Map<string, Map<string, string>>; // Attributes for an auto tile, will be passed on to each tile painted with this
  private layerData: Map<string, LayerData>;

  constructor() {
    this.name = $state("My project");
    this._tileSize = $state(ProjectState.DEFAULT_TILE_SIZE);
    this._width = $state(ProjectState.DEFAULT_WIDTH);
    this._height = $state(ProjectState.DEFAULT_HEIGHT);
    this._rows = $derived(this._height / this._tileSize);
    this._cols = $derived(this._width / this._tileSize);

    this.layers = $state([]);
    this.tilesets = $state([]);
    this.autoTiles = $state([]);
    this.attributes = new Map();
    this.tileAttributes = new Map();
    this.autoTileAttributes = new Map();
    this.layerData = new Map();
  }

  init() {
    this.createDefaultLayers();
  }

  set tileSize(px: number) {
    if (!ProjectState.VALID_TILE_SIZES.includes(px))
      throw new ProjectStateError(
        "Tile size must be " + ProjectState.VALID_TILE_SIZES.join(","),
        ProjectStateErrorCode.BAD_REQUEST,
      );

    this._tileSize = px;
    this.wipeLayerData();
  }

  get tileSize() {
    return this._tileSize;
  }

  get height() {
    return this._height;
  }

  set height(px: number) {
    if (px > ProjectState.MAX_TILES * this.tileSize)
      throw new ProjectStateError(
        "Maximum allowed height for tilemap is " +
          ProjectState.MAX_TILES * this.tileSize,
        ProjectStateErrorCode.BAD_REQUEST,
      );
    this._height = px;
    this.wipeLayerData();
  }

  get width() {
    return this._width;
  }

  set width(px: number) {
    if (px > ProjectState.MAX_TILES * this.tileSize)
      throw new ProjectStateError(
        "Maximum allowed width for tilemap is " +
          ProjectState.MAX_TILES * this.tileSize,
        ProjectStateErrorCode.BAD_REQUEST,
      );
    this._width = px;
    this.wipeLayerData();
  }

  get rows() {
    return this._rows;
  }

  get cols() {
    return this._cols;
  }

  // Methods tilesets //

  getTilesets() {
    return this.tilesets;
  }

  getTileset(id: string) {
    const tileset = this.getTilesets().find((t) => t.id === id);
    if (tileset === undefined) {
      throw new ProjectStateError(
        `Tileset ${id} not found`,
        ProjectStateErrorCode.NOT_FOUND,
      );
    }

    return tileset;
  }

  getTileDataUrl(tile: Tile): string {
    const tileset = this.tilesets.find((ts) => ts.id === tile.tilesetId);

    if (tileset === undefined)
      throw new ProjectStateError(
        "Tileset not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    if (
      tile.tilesetPos.x < 0 ||
      tile.tilesetPos.x > tileset.width - this.tileSize ||
      tile.tilesetPos.y < 0 ||
      tile.tilesetPos.y > tileset.height - this.tileSize
    )
      throw new ProjectStateError(
        "Tile pos out of bounds",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const ctxTile = createCanvas(this.tileSize, this.tileSize);
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

  createTileset(name: string, bitmap: ImageBitmap) {
    const tileset: Tileset = {
      id: this.generateId(),
      name: name.trim(),
      width: bitmap.width,
      height: bitmap.height,
      spritesheet: bitmap,
    };

    this.tilesets.push(tileset);
  }

  updateTileset(id: string, name: string) {
    const tileset = this.getTileset(id);
    const sameName = this.getTilesets().find((t) => t.name === name);

    if (sameName !== undefined)
      throw new ProjectStateError(
        "Tileset with name already exists",
        ProjectStateErrorCode.BAD_REQUEST,
      );

    tileset.name = name.trim();
  }

  deleteTileset(id: string) {
    const idx = this.tilesets.findIndex((t) => t.id === id);

    if (idx === -1)
      throw new ProjectStateError(
        "Tileset not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

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
                    c.ref.tilesetId === tileset.id,
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
          a.rules.find((r) => r.tile?.ref.tilesetId === tileset.id) !==
          undefined,
      ) !== undefined;

    if (isUsedInTileLayer || isUsedInAutoTile)
      throw new ProjectStateError(
        "Tileset is used in project, can't be deleted",
        ProjectStateErrorCode.BAD_REQUEST,
      );

    this.tilesets.splice(idx, 1);
  }

  // Methods auto-tiles //

  getAutoTiles() {
    return this.autoTiles;
  }

  getAutoTile(id: string) {
    const autoTile = this.autoTiles.find((at) => at.id === id);
    if (autoTile === undefined)
      throw new ProjectStateError(
        "Autotile not found",
        ProjectStateErrorCode.NOT_FOUND,
      );
    return autoTile;
  }

  createAutoTile(
    name: string,
    rules: TileRule[],
    defaultTile: TileAsset,
  ): AutoTile {
    const autoTile = {
      id: this.generateId(),
      name: name,
      rules: rules,
      defaultTile,
    };

    this.autoTiles.push(autoTile);

    return autoTile;
  }

  updateAutoTile(autoTile: AutoTile) {
    const idx = this.autoTiles.findIndex((at) => at.id === autoTile.id);
    if (idx === -1)
      throw new ProjectStateError(
        "Autotile not found",
        ProjectStateErrorCode.NOT_FOUND,
      );
    this.autoTiles[idx] = autoTile;

    const usedInLayers = this.layers.filter((l) => {
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
    });

    projectStateEvents.emit(ProjectStateEventType.ASSET_UPDATE, {
      layers: usedInLayers.map((l) => l.id),
    });
  }

  deleteAutoTile(id: string) {
    const idx = this.autoTiles.findIndex((at) => at.id === id);
    if (idx === -1)
      throw new ProjectStateError(
        "Autotile not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

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
        "Autotile is used in project, can't be deleted.",
        ProjectStateErrorCode.BAD_REQUEST,
      );
    this.autoTiles.splice(idx, 1);
  }

  // Methods attributes //

  getAttributes(row: number, col: number) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const attributes = this.attributes.get(`${row}:${col}`);
    if (attributes === undefined)
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    return attributes;
  }

  updateAttributes(row: number, col: number, attributes: Map<string, string>) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    this.attributes.set(`${row}:${col}`, attributes);
  }

  deleteAttributes(row: number, col: number) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    if (!this.hasAttributes(row, col))
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    this.attributes.delete(`${row}:${col}`);
  }

  hasAttributes(row: number, col: number) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    return this.attributes.has(`${row}:${col}`);
  }

  getAutoTileAttributes(autoTileId: string) {
    const attributes = this.autoTileAttributes.get(autoTileId);

    if (attributes === undefined)
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    return attributes;
  }

  updateAutoTileAttributes(
    autoTileId: string,
    attributes: Map<string, string>,
  ) {
    this.autoTileAttributes.set(autoTileId, attributes);
  }

  deleteAutoTileAttributes(autoTileId: string) {
    if (!this.hasAutoTileAttributes(autoTileId))
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    this.autoTileAttributes.delete(autoTileId);
  }

  hasAutoTileAttributes(autoTileId: string) {
    return this.autoTileAttributes.has(autoTileId);
  }

  getTileAttributes(tile: Tile) {
    const tileAttributes = this.tileAttributes.get(
      `${tile.tilesetId}:${tile.tilesetPos.x}:${tile.tilesetPos.y}`,
    );

    if (tileAttributes === undefined)
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    return tileAttributes;
  }

  updateTileAttributes(tile: Tile, attributes: Map<string, string>) {
    this.tileAttributes.set(
      `${tile.tilesetId}:${tile.tilesetPos.x}:${tile.tilesetPos.y}`,
      attributes,
    );
  }

  deleteTileAttributes(tile: Tile) {
    if (!this.hasTileAttributes(tile))
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    this.tileAttributes.delete(
      `${tile.tilesetId}:${tile.tilesetPos.x}:${tile.tilesetPos.y}`,
    );
  }

  hasTileAttributes(tile: Tile) {
    return this.tileAttributes.has(
      `${tile.tilesetId}:${tile.tilesetPos.x}:${tile.tilesetPos.y}`,
    );
  }

  // Methods layers //

  getLayers() {
    return this.layers;
  }

  setReorderedLayers(layers: Layer[]) {
    this.layers = layers;
  }

  getLayer(id: string): Layer {
    const layer = this.layers.find((l) => l.id === id);
    if (layer === undefined)
      throw new ProjectStateError(
        `Layer ${id} not found`,
        ProjectStateErrorCode.NOT_FOUND,
      );
    return layer;
  }
  getLayerData(id: string): LayerData {
    const data = this.layerData.get(id);

    if (data === undefined) {
      throw new ProjectStateError(
        `Layer data ${id} not found`,
        ProjectStateErrorCode.NOT_FOUND,
      );
    }

    return data;
  }
  createLayer(name: string, type: PaintType) {
    const id = this.generateId<PaintType>();

    this.layerData.set(
      id,
      new Array(this.rows)
        .fill(null)
        .map((_) => new Array(this.cols).fill(null)),
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
    }
  }

  updateLayer(id: string, name: string) {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx === -1)
      throw new ProjectStateError(
        "Layer not found",
        ProjectStateErrorCode.NOT_FOUND,
      );
    this.layers[idx].name = name;
  }

  deleteLayer(id: string) {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx === -1)
      throw new ProjectStateError(
        "Layer not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    this.layerData.delete(id);
    this.layers.splice(idx, 1);
  }

  getTileAt(row: number, col: number, layerID: string): PaintedAsset | null {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );
    const data = this.getLayerData(layerID);
    return data[row][col];
  }

  getTileAtSafe(row: number, col: number, layerID: string) {
    if (!this.isWithinGridBounds(row, col)) {
      return null;
    }

    return this.getTileAt(row, col, layerID);
  }

  // Methods for painting layers //

  paintTile(layerID: string, row: number, col: number, tileAsset: TileAsset) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        `row(${row}) and/or col(${col})`,
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const data = this.getLayerData(layerID);
    const curr = this.getTileAt(row, col, layerID);

    data[row][col] = tileAsset;

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        type: PaintType.TILE,
        layer: { id: layerID },
        items: [{ data: curr as PaintedTile | null, pos: { row, col } }],
      },
      next: {
        type: tileAsset.type,
        layer: { id: layerID },
        items: [{ data: tileAsset, pos: { row, col } }],
      },
    });
  }

  paintTiles(
    layerID: string,
    tiles: { row: number; col: number; tileAsset: TileAsset }[],
  ): Cell[] {
    const layer = this.getLayer(layerID);

    for (const t of tiles) {
      if (!this.isWithinGridBounds(t.row, t.col))
        throw new ProjectStateError(
          "row and/or col is out of bounds for grid",
          ProjectStateErrorCode.OUT_OF_BOUNDS,
        );

      if (layer.type !== t.tileAsset.type)
        throw new ProjectStateError(
          "type mismatch between layer and asset",
          ProjectStateErrorCode.TYPE_ERROR,
        );
    }

    const data = this.getLayerData(layerID);
    const prevTiles: TileHistoryEntryItem[] = [];
    const nextTiles: TileHistoryEntryItem[] = [];

    for (const t of tiles) {
      const curr = this.getTileAt(t.row, t.col, layerID);
      data[t.row][t.col] = t.tileAsset;

      prevTiles.push({
        data: curr as PaintedTile | null,
        pos: { row: t.row, col: t.col },
      });

      nextTiles.push({
        data: t.tileAsset,
        pos: { row: t.row, col: t.col },
      });
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        type: layer.type as PaintType.TILE,
        layer: { id: layerID },
        items: prevTiles,
      },
      next: {
        type: layer.type as PaintType.TILE,
        layer: { id: layerID },
        items: nextTiles,
      },
    });

    return nextTiles.map((t) => t.pos);
  }

  eraseTile(row: number, col: number, layerID: string) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );
    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);
    const curr = data[row][col];

    // Don't do anything if the tile is already erased
    if (this.isSameAsset(curr, null)) {
      return;
    }

    data[row][col] = null;

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        type: layer.type,
        layer: { id: layerID },
        items: [{ data: curr as PaintedTile | null, pos: { row, col } }],
      },
      next: {
        type: layer.type,
        layer: { id: layerID },
        items: [{ data: null, pos: { row, col } }],
      },
    });
  }

  eraseTiles(tiles: Cell[], layerID: string) {
    const layer = this.getLayer(layerID);

    const data = this.getLayerData(layerID);

    for (const t of tiles) {
      if (!this.isWithinGridBounds(t.row, t.col))
        throw new ProjectStateError(
          "row and/or col is out of bounds for grid",
          ProjectStateErrorCode.OUT_OF_BOUNDS,
        );
    }

    const prevTiles = [];
    const nextTiles = [];

    for (const t of tiles) {
      const curr = data[t.row][t.col];

      data[t.row][t.col] = null;

      prevTiles.push({
        data: curr as any,
        pos: { row: t.row, col: t.col },
      });

      nextTiles.push({
        data: null,
        pos: { row: t.row, col: t.col },
      });
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
      next: { type: layer.type, layer: { id: layerID }, items: nextTiles },
    });
  }

  editTileAt(
    row: number,
    col: number,
    layerID: string,
    paint: PaintedAsset | null,
  ) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);

    if (paint === null) {
      data[row][col] = null;
    } else {
      if (layer.type !== paint.type)
        throw new ProjectStateError(
          "type mismatch between layer and asset",
          ProjectStateErrorCode.TYPE_ERROR,
        );
      data[row][col] = { ...paint };
    }
  }

  floodFill(
    layerID: string,
    row: number,
    col: number,
    paint: TileAsset | null,
  ): Cell[] {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const layer = this.getLayer(layerID);
    const data = this.getLayerData(layerID);

    if (paint !== null && layer.type !== paint.type)
      throw new ProjectStateError(
        "type mismatch between layer and asset",
        ProjectStateErrorCode.TYPE_ERROR,
      );

    const clickedTile = this.getTileAt(row, col, layerID);

    const stack = [{ row, col }];

    const visited: boolean[][] = new Array(this.rows)
      .fill(null)
      .map((_) => new Array(this.cols).fill(false));

    visited[row][col] = true;

    const filledTiles: { row: number; col: number }[] = [];

    while (stack.length > 0) {
      const tile = stack.pop()!;

      const neighbours = getNeighbours(
        { row: tile.row, col: tile.col },
        this.rows,
        this.cols,
      );

      for (const n of neighbours) {
        if (
          !visited[n.row][n.col] &&
          this.isSameAsset(clickedTile, this.getTileAt(n.row, n.col, layerID))
        ) {
          visited[n.row][n.col] = true;
          stack.push(n);
        }
      }

      filledTiles.push(tile);
    }

    const prevTiles = filledTiles.map((ft) => {
      const curr = this.getTileAt(ft.row, ft.col, layerID);
      return {
        data: curr as PaintedTile | null,
        pos: ft,
      };
    });

    const nextItems = filledTiles.map((ft) => {
      return {
        data: paint as PaintedTile | null,
        pos: ft,
      };
    });

    for (const ft of filledTiles) {
      if (paint === null) {
        data[ft.row][ft.col] = null;
      } else {
        data[ft.row][ft.col] = paint;
        // If is auto tile layer, this will have to take into account the same procedure as in auto tile paint
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
      next: { type: layer.type, layer: { id: layerID }, items: nextItems },
    });

    return filledTiles;
  }

  paintAutoTile(
    row: number,
    col: number,
    layerID: string,
    autoTileAsset: AutoTileAsset,
  ): Cell[] {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const layer = this.getLayer(layerID);

    if (layer.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "paintWithAutoTile only supported for auto-tile layers",
        ProjectStateErrorCode.TYPE_ERROR,
      );

    const data = this.getLayerData(layer.id);

    const currTile = this.getTileAt(row, col, layer.id);

    if (currTile !== null && currTile.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "Painted asset is not of type auto tile",
        ProjectStateErrorCode.TYPE_ERROR,
      );

    const autoTile = this.getAutoTile(autoTileAsset.ref.id);

    const tileRuleId = this.pickTileFromAutoTile(row, col, autoTile, layer.id);

    const prevItems: AutoTileHistoryEntryItem[] = [];
    const nextItems: AutoTileHistoryEntryItem[] = [];

    data[row][col] = {
      type: PaintType.AUTO_TILE,
      ref: { id: autoTileAsset.ref.id },
      selectedTileRuleId: tileRuleId,
    };

    prevItems.push({
      pos: { row, col },
      data: currTile as PaintedAutoTile | null,
    });

    nextItems.push({
      pos: { row, col },
      data: {
        type: PaintType.AUTO_TILE,
        ref: { id: autoTileAsset.ref.id },
        selectedTileRuleId: tileRuleId,
      },
    });

    const neighbours = getNeighbours({ row, col }, this.rows, this.cols, true);

    for (const n of neighbours) {
      const currTile = this.getTileAt(n.row, n.col, layer.id);

      if (
        currTile !== null &&
        currTile.type === PaintType.AUTO_TILE &&
        currTile.ref.id === autoTileAsset.ref.id
      ) {
        const selectedTileRuleId = this.pickTileFromAutoTile(
          n.row,
          n.col,
          autoTile,
          layer.id,
        );

        prevItems.push({
          pos: { row: n.row, col: n.col },
          data: currTile as PaintedAutoTile | null,
        });

        nextItems.push({
          pos: { row: n.row, col: n.col },
          data: {
            type: PaintType.AUTO_TILE,
            ref: { id: autoTileAsset.ref.id },
            selectedTileRuleId,
          },
        });

        data[n.row][n.col] = {
          type: PaintType.AUTO_TILE,
          ref: { id: autoTileAsset.ref.id },
          selectedTileRuleId,
        };
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: { type: layer.type, layer: { id: layerID }, items: prevItems },
      next: {
        type: layer.type,
        layer: { id: layerID },
        items: nextItems,
      },
    });
    return nextItems.map((t) => t.pos);
  }

  paintAutoTiles(
    layerID: string,
    tiles: Cell[],
    autoTileAsset: AutoTileAsset,
  ): Cell[] {
    const layer = this.getLayer(layerID);

    if (layer.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "paintWithAutoTile only supported for auto-tile layers",
        ProjectStateErrorCode.TYPE_ERROR,
      );

    const autoTile = this.getAutoTile(autoTileAsset.ref.id);

    const data = this.getLayerData(layer.id);

    const prevItems: AutoTileHistoryEntryItem[] = [];
    const nextItems: AutoTileHistoryEntryItem[] = [];

    // 1. create history entry items for prev, the currently painted tiles including neighbours, but remove duplicates.

    for (const t of tiles) {
      // only add the items that doesn't already exist in prev
      if (
        prevItems.find((i) => i.pos.col === t.col && i.pos.row === t.row) ===
        undefined
      ) {
        const currTile = this.getTileAt(t.row, t.col, layer.id);
        prevItems.push({
          pos: t,
          data: currTile as PaintedAutoTile | null,
        });
      }

      const neighbours = getNeighbours(t, this.rows, this.cols, true);

      for (const n of neighbours) {
        // only add the items that doesn't already exist in prev
        if (
          prevItems.find((i) => i.pos.col === n.col && i.pos.row === n.row) ===
          undefined
        ) {
          const currTile = this.getTileAt(n.row, n.col, layer.id);
          prevItems.push({
            pos: n,
            data: currTile as PaintedAutoTile | null,
          });
        }
      }
    }

    // 2. paint each tile according to auto tile rules

    for (const t of tiles) {
      const selectedTileRuleId = this.pickTileFromAutoTile(
        t.row,
        t.col,
        autoTile,
        layer.id,
      );

      data[t.row][t.col] = {
        type: PaintType.AUTO_TILE,
        ref: { id: autoTileAsset.ref.id },
        selectedTileRuleId,
      };

      // Update neighbours

      const neighbours = getNeighbours(t, this.rows, this.cols, true);

      for (const n of neighbours) {
        const currTile = this.getTileAt(n.row, n.col, layer.id);

        if (
          currTile !== null &&
          currTile.type === PaintType.AUTO_TILE &&
          currTile.ref.id === autoTileAsset.ref.id
        ) {
          const selectedTileRuleId = this.pickTileFromAutoTile(
            n.row,
            n.col,
            autoTile,
            layer.id,
          );

          data[n.row][n.col] = {
            type: PaintType.AUTO_TILE,
            ref: { id: autoTileAsset.ref.id },
            selectedTileRuleId,
          };
        }
      }
    }

    // 3. Create history entry items for next, now that they have been updated with new tiles, again remove duplicates

    for (const t of tiles) {
      // only add the items that doesn't already exist in next
      if (
        nextItems.find((i) => i.pos.col === t.col && i.pos.row === t.row) ===
        undefined
      ) {
        const currTile = this.getTileAt(t.row, t.col, layer.id);
        nextItems.push({
          pos: t,
          data: currTile as PaintedAutoTile | null,
        });
      }

      const neighbours = getNeighbours(t, this.rows, this.cols, true);

      for (const n of neighbours) {
        // only add the items that doesn't already exist in prev
        if (
          nextItems.find((i) => i.pos.col === n.col && i.pos.row === n.row) ===
          undefined
        ) {
          const currTile = this.getTileAt(n.row, n.col, layer.id);
          nextItems.push({
            pos: n,
            data: currTile as PaintedAutoTile | null,
          });
        }
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: { type: layer.type, layer: { id: layerID }, items: prevItems },
      next: {
        type: layer.type,
        layer: { id: layerID },
        items: nextItems,
      },
    });

    return nextItems.map((t) => t.pos);
  }

  eraseAutoTiles(tiles: Cell[], layerID: string): Cell[] {
    const layer = this.getLayer(layerID);

    if (layer.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "paintWithAutoTile only supported for auto-tile layers",
        ProjectStateErrorCode.TYPE_ERROR,
      );

    const data = this.getLayerData(layer.id);

    const prevItems: AutoTileHistoryEntryItem[] = [];
    const nextItems: AutoTileHistoryEntryItem[] = [];

    // 1. create history entry items for prev, the currently painted tiles including neighbours, but remove duplicates.

    for (const t of tiles) {
      // only add the items that doesn't already exist in prev
      if (
        prevItems.find((i) => i.pos.col === t.col && i.pos.row === t.row) ===
        undefined
      ) {
        const currTile = this.getTileAt(t.row, t.col, layer.id);
        prevItems.push({
          pos: t,
          data: currTile as PaintedAutoTile | null,
        });
      }

      const neighbours = getNeighbours(t, this.rows, this.cols, true);

      for (const n of neighbours) {
        // only add the items that doesn't already exist in prev
        if (
          prevItems.find((i) => i.pos.col === n.col && i.pos.row === n.row) ===
          undefined
        ) {
          const currTile = this.getTileAt(n.row, n.col, layer.id);
          prevItems.push({
            pos: n,
            data: currTile as PaintedAutoTile | null,
          });
        }
      }
    }

    // 2. erase each tile and update the neighbours

    for (const t of tiles) {
      data[t.row][t.col] = null;

      // Update neighbours

      const neighbours = getNeighbours(t, this.rows, this.cols, true);

      for (const n of neighbours) {
        const currTile = this.getTileAt(n.row, n.col, layer.id);

        if (currTile !== null && currTile.type === PaintType.AUTO_TILE) {
          const autoTile = this.getAutoTile(currTile.ref.id);

          const selectedTileRuleId = this.pickTileFromAutoTile(
            n.row,
            n.col,
            autoTile,
            layer.id,
          );

          data[n.row][n.col] = {
            type: PaintType.AUTO_TILE,
            ref: { id: autoTile.id },
            selectedTileRuleId,
          };
        }
      }
    }

    // 3. Create history entry items for next, now that they have been updated with new tiles, again remove duplicates

    for (const t of tiles) {
      // only add the items that doesn't already exist in next
      if (
        nextItems.find((i) => i.pos.col === t.col && i.pos.row === t.row) ===
        undefined
      ) {
        const currTile = this.getTileAt(t.row, t.col, layer.id);
        nextItems.push({
          pos: t,
          data: currTile as PaintedAutoTile | null,
        });
      }

      const neighbours = getNeighbours(t, this.rows, this.cols, true);

      for (const n of neighbours) {
        // only add the items that doesn't already exist in prev
        if (
          nextItems.find((i) => i.pos.col === n.col && i.pos.row === n.row) ===
          undefined
        ) {
          const currTile = this.getTileAt(n.row, n.col, layer.id);
          nextItems.push({
            pos: n,
            data: currTile as PaintedAutoTile | null,
          });
        }
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: { type: layer.type, layer: { id: layerID }, items: prevItems },
      next: {
        type: layer.type,
        layer: { id: layerID },
        items: nextItems,
      },
    });

    return nextItems.map((t) => t.pos);
  }

  eraseAutoTile(row: number, col: number, layerID: string): Cell[] {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const layer = this.getLayer(layerID);

    if (layer.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "eraseAutoTile only supported for auto-tile layers",
        ProjectStateErrorCode.TYPE_ERROR,
      );

    const currTile = this.getTileAt(row, col, layer.id);

    if (currTile === null) {
      return [];
    }

    if (currTile.type !== PaintType.AUTO_TILE)
      throw new ProjectStateError(
        "Tile is not painted with auto tile asset",
        ProjectStateErrorCode.TYPE_ERROR,
      );

    const autoTile = this.getAutoTile(currTile.ref.id);

    const data = this.getLayerData(layer.id);

    const prevItems: AutoTileHistoryEntryItem[] = [];
    const nextItems: AutoTileHistoryEntryItem[] = [];

    prevItems.push({ pos: { row, col }, data: currTile });

    data[row][col] = null;

    nextItems.push({ pos: { row: row, col: col }, data: null });

    const neighbours = getNeighbours({ row, col }, this.rows, this.cols, true);

    for (const n of neighbours) {
      const currTile = this.getTileAt(n.row, n.col, layer.id);

      // If painted with same auto tile, update its content
      if (
        currTile !== null &&
        currTile.type === PaintType.AUTO_TILE &&
        currTile.ref.id === autoTile.id
      ) {
        prevItems.push({
          pos: { row: n.row, col: n.col },
          data: currTile,
        });

        const tileRuleId = this.pickTileFromAutoTile(
          n.row,
          n.col,
          autoTile,
          layer.id,
        );

        nextItems.push({
          pos: { row: n.row, col: n.col },
          data: { ...currTile, selectedTileRuleId: tileRuleId },
        });
        data[n.row][n.col] = { ...currTile, selectedTileRuleId: tileRuleId };
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        type: layer.type,
        layer: { id: layerID },
        items: prevItems,
      },
      next: {
        type: layer.type,
        layer: { id: layerID },
        items: nextItems,
      },
    });

    return nextItems.map((t) => t.pos);
  }

  isSameAsset(a: AssetRef | null, b: AssetRef | null): boolean {
    if (a === null && b === null) return true;

    if (a === null || b === null) return false;

    if (a.type !== b.type) return false;

    switch (a.type) {
      case PaintType.TILE:
        return (
          a.ref.tilesetId === (b as typeof a).ref.tilesetId &&
          a.ref.tilesetPos.y === (b as typeof a).ref.tilesetPos.y &&
          a.ref.tilesetPos.x === (b as typeof a).ref.tilesetPos.x
        );
      case PaintType.AUTO_TILE:
        return a.ref.id === (b as typeof a).ref.id;
    }
  }

  // Methods for Loads and exports of project //

  async getFileExport(): Promise<Blob> {
    const tilesets = this.tilesets.map((t) => {
      // Convert the ImageBitmap to binary data that proto can read

      const ctx = createCanvas(t.spritesheet.width, t.spritesheet.height);

      ctx.drawImage(t.spritesheet, 0, 0);

      return {
        id: t.id,
        name: t.name,
        width: t.width,
        height: t.height,
        spritesheet: ctx.canvas.toDataURL(),
      };
    });

    const attributes = Array.from(this.attributes.entries()).map((e) => {
      const [row, col] = e[0].split(":").map(Number);

      return {
        pos: {
          x: col * this.tileSize,
          y: row * this.tileSize,
        },
        attributes: Object.fromEntries(e[1]),
      };
    });

    const tileAttributes = Array.from(this.tileAttributes.entries()).map(
      (e) => {
        const [tilesetId, x, y] = e[0].split(":");

        return {
          tile: {
            tilesetId,
            tilesetPos: {
              x: parseInt(x),
              y: parseInt(y),
            },
          },
          attributes: Object.fromEntries(e[1]),
        };
      },
    );

    const autoTileAttributes = Array.from(
      this.autoTileAttributes.entries(),
    ).map((e) => {
      return {
        autoTileId: e[0],
        attributes: Object.fromEntries(e[1]),
      };
    });

    const layers = this.layers.map((l) => {
      const data = this.getLayerData(l.id);
      return { ...l, data };
    });

    const data: ProjectFile = {
      name: this.name,
      tileSize: this.tileSize,
      width: this.width,
      height: this.height,
      tilesets,
      autoTiles: this.autoTiles,
      attributes,
      tileAttributes: tileAttributes,
      autoTileAttributes,
      layers,
    };

    return new Blob([JSON.stringify(data)], { type: "application/json" });
  }

  createNewProject() {
    this.name = "My project";
    this._tileSize = ProjectState.DEFAULT_TILE_SIZE;
    this._width = ProjectState.DEFAULT_WIDTH;
    this._height = ProjectState.DEFAULT_HEIGHT;
    this._rows = this._height / this._tileSize;
    this._cols = this._width / this._tileSize;

    this.layers = [];
    this.tilesets = [];
    this.autoTiles = [];
    this.attributes = new Map();
    this.tileAttributes = new Map();
    this.autoTileAttributes = new Map();
    this.layerData = new Map();

    this.createDefaultLayers();

    // TODO: wipe any state saved in indexed DB

    projectStateEvents.emit(ProjectStateEventType.NEW_PROJECT, null);
  }

  async openFile(file: File): Promise<void> {
    try {
      if (file.type !== "application/json")
        throw new ProjectStateError(
          "Invalid project file type, accepts JSON",
          ProjectStateErrorCode.BAD_REQUEST,
        );

      const json = await file.text();
      const data: ProjectFile = JSON.parse(json); // TODO: you could argue that this should be runtime type validated

      this.name = data.name;
      this.tileSize = data.tileSize;
      this.width = data.width;
      this.height = data.height;

      // Create attributes maps

      for (const a of data.attributes) {
        this.attributes.set(
          `${a.pos.x / this.tileSize}:${a.pos.y / this.tileSize}`,
          new Map(Object.entries(a.attributes)),
        );
      }

      for (const a of data.tileAttributes) {
        this.tileAttributes.set(
          `${a.tile.tilesetId}:${a.tile.tilesetPos.x}:${a.tile.tilesetPos.y}`,
          new Map(Object.entries(a.attributes)),
        );
      }

      for (const a of data.autoTileAttributes) {
        this.autoTileAttributes.set(
          `${a.autoTileId}`,
          new Map(Object.entries(a.attributes)),
        );
      }

      // Convert data URL to ImageBitmap in tilesets
      this.tilesets = await Promise.all(
        data.tilesets.map(async (t) => {
          const spritesheet = await dataURLToImageBitmap(t.spritesheet);
          return { ...t, spritesheet };
        }),
      );

      this.autoTiles = data.autoTiles;

      // Create layers

      this.layers = [];

      this.layerData.clear();

      for (const l of data.layers) {
        this.layerData.set(l.id, l.data);
        this.layers.push({ name: l.name, id: l.id, type: l.type });
      }

      // TODO: Update Indexed DB with this

      projectStateEvents.emit(ProjectStateEventType.OPEN_FILE, null);
    } catch (e) {
      console.error(e);
      throw new ProjectStateError(
        "Failed to parse project file",
        ProjectStateErrorCode.BAD_REQUEST,
      );
    }
  }

  async getPNGExport(): Promise<Blob> {
    const ctx = this.paintProjectToCanvas();

    try {
      return await canvasToBlob(ctx.canvas);
    } catch (e) {
      throw new ProjectStateError(
        "Failed to create blob",
        ProjectStateErrorCode.SERVER_ERROR,
      );
    }
  }

  getJSONExport(): Blob {
    const ctx = this.paintProjectToCanvas();

    // Export a list of all tiles that have attributes and their positions.
    // Order of importance for attributes are 1. Tile, 2. Autotile 3. painted tile / tile instance

    const attributes: { pos: Point; attributes: { [k: string]: string } }[] =
      [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tileAttributes = this.hasAttributes(r, c)
          ? this.getAttributes(r, c)
          : new Map();

        // Add auto tile attributes

        for (const l of this.getLayers().filter(
          (l) => l.type === PaintType.AUTO_TILE,
        )) {
          const paintedAsset = this.getTileAt(r, c, l.id);

          if (paintedAsset === null) continue;
          if (paintedAsset.type === PaintType.AUTO_TILE) {
            if (this.hasAutoTileAttributes(paintedAsset.ref.id)) {
              const atAttr = this.getAutoTileAttributes(paintedAsset.ref.id);
              for (const [k, v] of atAttr.entries()) {
                tileAttributes.set(k, v);
              }
            }
          }
        }

        // Add tile attributes
        for (const l of this.getLayers().filter(
          (l) => l.type === PaintType.TILE,
        )) {
          const paintedAsset = this.getTileAt(r, c, l.id);

          if (paintedAsset === null) continue;

          if (paintedAsset.type === PaintType.TILE) {
            if (this.hasTileAttributes(paintedAsset.ref)) {
              const tAttr = this.getTileAttributes(paintedAsset.ref);
              for (const [k, v] of tAttr.entries()) {
                tileAttributes.set(k, v);
              }
            }
          }
        }

        if (tileAttributes.size > 0) {
          attributes.push({
            pos: { x: c * this.tileSize, y: r * this.tileSize },
            attributes: Object.fromEntries(tileAttributes.entries()),
          });
        }
      }
    }

    const data: ProjectStateJSONExport = {
      name: this.name,
      tileSize: this.tileSize,
      width: this.width,
      height: this.height,
      rows: this.rows,
      cols: this.cols,
      tilemap: ctx.canvas.toDataURL(),
      attributes,
    };

    return new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
  }

  // Private stuff //

  private paintProjectToCanvas(): CanvasRenderingContext2D {
    const ctx = createCanvas(this.width, this.height);

    // Paint all tile and auto tile layers on canvas

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
                  const tileset = this.getTileset(tile.ref.tilesetId);

                  ctx.drawImage(
                    tileset.spritesheet,
                    tile.ref.tilesetPos.x,
                    tile.ref.tilesetPos.y,
                    this.tileSize,
                    this.tileSize,
                    c * this.tileSize,
                    r * this.tileSize,
                    this.tileSize,
                    this.tileSize,
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
                const autoTile = this.getAutoTile(autoTileAsset.ref.id);
                const tile =
                  autoTile.rules.find(
                    (tr) => tr.id === autoTileAsset?.selectedTileRuleId?.id,
                  )?.tile ?? autoTile.defaultTile;
                const tileset = this.getTileset(tile.ref.tilesetId);

                ctx.drawImage(
                  tileset.spritesheet,
                  tile.ref.tilesetPos.x,
                  tile.ref.tilesetPos.y,
                  this.tileSize,
                  this.tileSize,
                  c * this.tileSize,
                  r * this.tileSize,
                  this.tileSize,
                  this.tileSize,
                );
              }
            }
          }
          break;
        }
      }
    }

    return ctx;
  }

  private wipeLayerData() {
    for (const l of this.layers) {
      this.layerData.set(
        l.id,
        new Array(this.rows)
          .fill(null)
          .map((_) => new Array(this.cols).fill(null)),
      );
    }
  }

  private pickTileFromAutoTile(
    row: number,
    col: number,
    autoTile: AutoTile,
    layerID: string,
  ): IdRef | null {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const n = row > 0 ? this.getTileAtSafe(row - 1, col, layerID) : null;
    const ne = this.getTileAtSafe(row - 1, col + 1, layerID);
    const e = this.getTileAtSafe(row, col + 1, layerID);
    const se = this.getTileAtSafe(row + 1, col + 1, layerID);
    const s = this.getTileAtSafe(row + 1, col, layerID);
    const sw = this.getTileAtSafe(row + 1, col - 1, layerID);
    const w = this.getTileAtSafe(row, col - 1, layerID);
    const nw = this.getTileAtSafe(row - 1, col - 1, layerID);

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
      ? { id: rules[Math.floor(Math.random() * rules.length)].id }
      : null;
  }

  private createDefaultLayers() {
    this.layerData.set(
      DEFAULT_LAYER.id,
      new Array(ProjectState.DEFAULT_ROWS)
        .fill(null)
        .map((_) => new Array(ProjectState.DEFAULT_COLS).fill(null)),
    );

    this.layers.push({ ...DEFAULT_LAYER });

    for (const { name, type } of [
      { name: "Roads", type: PaintType.AUTO_TILE },
      { name: "Fg", type: PaintType.TILE },
    ]) {
      this.createLayer(name, type);
    }
  }

  isWithinGridBounds(row: number, col: number) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  private generateId<T extends PaintType>(): TypedId<T> {
    return crypto.randomUUID() as TypedId<T>;
  }
}

export const projectState = new ProjectState();
projectState.init();

export const HistoryStack = (() => {
  // History management
  // Each action consists of two entries, the previous state and the next state after the action
  // When undoing, currIdx is first decremented once to move to the precious state which is repainted, then it is moved once more to get to the "next" of the previous state.
  // When redoing, we increment the currIdx by two to point to the next action and repaint that state
  // The stack listens to project state change events to build the history via the projectStateChangeEvents emitter

  const history: HistoryEntry[] = [];
  let currIdx = -1;

  projectStateEvents.on(ProjectStateEventType.PAINT, (e) => {
    if (currIdx !== history.length - 1) {
      history.splice(currIdx + 1);
    }

    history.push(e.detail.prev);
    history.push(e.detail.next);

    currIdx = history.length - 1;
  });

  const repaint = () => {
    const entry = history[currIdx];

    if (!entry) return;

    const layer = projectState.getLayer(entry.layer.id);

    if (layer.type !== entry.type)
      throw new Error("type mismatch between layer and entry");

    for (const i of entry.items) {
      projectState.editTileAt(i.pos.row, i.pos.col, entry.layer.id, i.data);
    }
    return entry.items.map((i) => i.pos);
  };

  return {
    undo() {
      if (currIdx <= 0) return;
      currIdx--; // First repaint what was previously done
      const tiles = repaint();
      currIdx--; // Move to the previous state
      return tiles;
    },

    redo() {
      if (currIdx === history.length - 1) return;
      currIdx += 2; // Advance by two to redo the next action
      const tiles = repaint();
      return tiles;
    },
  };
})();
