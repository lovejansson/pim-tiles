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
  type Object,
  type Vec2,
  type ProjectStateJSONExport,
  type Tileset,
  type Cell,
  type PaintedTile,
  type LayerData,
  type Tile,
  type ProjectFile,
  type AutoTileAsset,
  type TileHistoryEntryItem,
  type LayerDataComp,
  type LayerId,
  type LayerComp,
  type TilemapEditorState,
  type ObjectJSON,
  type ObjectAsset,
  type ObjectCategory,
} from "./types";
import {
  getNeighbours,
  createCanvas,
  canvasToBlob,
  dataURLToImageBitmap,
  isSameCell,
} from "./utils";

const DEFAULT_LAYER: TileLayer = {
  id: crypto.randomUUID() as LayerId<PaintType.TILE>,
  name: "bg",
  type: PaintType.TILE,
};

export const guiState: GUIState = $state({
  notification: null,
  gridColor: "#0217f6",
  showGrid: false,
  mouseTilePos: { row: 0, col: 0 },
  visibleLayers: {},
});

export const tilemapEditorState:
  | TilemapEditorState<PaintType.TILE>
  | TilemapEditorState<PaintType.AUTO_TILE>
  | TilemapEditorState<PaintType.OBJECT> = $state({
  type: PaintType.TILE,
  selectedLayer: DEFAULT_LAYER.id,
  selectedAsset: null,
  selectedTool: Tool.PAINT,
  fillToolIsActive: false,
  selection: { type: PaintType.TILE, tiles: [] },
});

export function updateTilemapEditorState<T extends PaintType>(
  data: Partial<TilemapEditorState<T>>,
): void {
  Object.assign(tilemapEditorState, data);
}

export function setAllLayersVisible() {
  for (const l of projectState.getLayers()) {
    guiState.visibleLayers[l.id] = true;
  }
}

export enum ProjectStateErrorCode {
  NOT_FOUND = "not-found",
  BAD_REQUEST = "bad-request",
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
  OPEN_FILE = "open-file",
  NEW_PROJECT = "new-project",

  NAME_UPDATE = "name-update",
  DIMENSIONS_UPDATE = "dimensions-update",
  AUTO_TILES_UPDATE = "auto-tiles-update",
  TILESETS_UPDATE = "tilesets-update",
  OBJECTS_UPDATE = "objects-update",
  LAYERS_UPDATE = "layers-update",
  ATTRIBUTES_UPDATE = "attributes-update",
  TILE_ATTRIBUTES_UPDATE = "tile-attributes-update",
  AUTO_TILE_ATTRIBUTES_UPDATE = "auto-tile-attributes-update",
  LAYER_DATA_UPDATE = "layer-data-update",
  PAINT = "paint",
}

type ProjectStateEventDetail<T extends ProjectStateEventType> =
  T extends ProjectStateEventType.PAINT
    ? {
        prev: HistoryEntry;
        next: HistoryEntry;
      }
    : T extends ProjectStateEventType.LAYER_DATA_UPDATE
      ? {
          layerData: Map<string, LayerDataComp>;
        }
      : T extends ProjectStateEventType.NAME_UPDATE
        ? {
            name: string;
          }
        : T extends ProjectStateEventType.LAYERS_UPDATE
          ? { layers: LayerComp[] }
          : T extends ProjectStateEventType.AUTO_TILES_UPDATE
            ? {
                autoTiles: AutoTile[];
              }
            : T extends ProjectStateEventType.TILESETS_UPDATE
              ? { tilesets: Tileset[] }
              : T extends ProjectStateEventType.OBJECTS_UPDATE
                ? { objects: Object[] }
                : T extends ProjectStateEventType.ATTRIBUTES_UPDATE
                  ? { attributes: Map<string, Map<string, string>> }
                  : T extends ProjectStateEventType.TILE_ATTRIBUTES_UPDATE
                    ? { tileAttributes: Map<string, Map<string, string>> }
                    : T extends ProjectStateEventType.AUTO_TILE_ATTRIBUTES_UPDATE
                      ? { autoTileAttributes: Map<string, Map<string, string>> }
                      : T extends ProjectStateEventType.DIMENSIONS_UPDATE
                        ? {
                            dimensions: {
                              width: number;
                              height: number;
                              tileSize: number;
                            };
                          }
                        : T extends ProjectStateEventType.OPEN_FILE
                          ? ProjectStateMembers
                          : T extends ProjectStateEventType.NEW_PROJECT
                            ? ProjectStateMembers
                            : null;

export type ProjectStateEvent<T extends ProjectStateEventType> = CustomEvent<
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

export type ProjectStateMembers = {
  layers: LayerComp[];
  layerData: Map<string, LayerDataComp>;
  autoTileAttributes: Map<string, Map<string, string>>;
  tileAttributes: Map<string, Map<string, string>>;
  attributes: Map<string, Map<string, string>>;
  autoTiles: AutoTile[];
  tilesets: Tileset[];
  objects: Object[];
  name: string;
  tileSize: number;
  width: number;
  height: number;
};

export const projectStateEvents = new ProjectStateEventEmitter();

export class ProjectState {
  static VALID_TILE_SIZES = [16, 32];
  static DEFAULT_TILE_SIZE = 16;
  static DEFAULT_ROWS = 45;
  static DEFAULT_COLS = 80;
  static DEFAULT_WIDTH = 80 * 16;
  static DEFAULT_HEIGHT = 45 * 16;
  static MAX_TILES = 250;

  private _name: string;
  private _tileSize: number;
  private _width: number;
  private _height: number;
  private _rows: number;
  private _cols: number;

  private layers: LayerComp[];

  private tilesets: Tileset[];
  private autoTiles: AutoTile[];
  private objects: Object[];
  private attributes: Map<string, Map<string, string>>; // Attributes for cells on tilemap least priority
  private tileAttributes: Map<string, Map<string, string>>; // Attributes for a tile highest priority
  private autoTileAttributes: Map<string, Map<string, string>>; // Attributes for an auto tile, will be passed on to each tile painted with this
  private layerData: Map<string, LayerDataComp>;

  constructor() {
    this._name = $state("My project");
    this._tileSize = $state(ProjectState.DEFAULT_TILE_SIZE);
    this._width = $state(ProjectState.DEFAULT_WIDTH);
    this._height = $state(ProjectState.DEFAULT_HEIGHT);
    this._rows = $derived(this._height / this._tileSize);
    this._cols = $derived(this._width / this._tileSize);

    this.layers = $state([]);
    this.tilesets = $state([]);
    this.autoTiles = $state([]);
    this.objects = $state([]);
    this.attributes = new Map();
    this.tileAttributes = new Map();
    this.autoTileAttributes = new Map();
    this.layerData = new Map();
  }

  init(data: Partial<ProjectStateMembers>) {
    try {
      if (data.autoTileAttributes)
        this.autoTileAttributes = data.autoTileAttributes;
      if (data.tileAttributes) this.tileAttributes = data.tileAttributes;
      if (data.attributes) this.attributes = data.attributes;
      if (data.autoTiles) this.autoTiles = data.autoTiles;
      if (data.tilesets) this.tilesets = data.tilesets;
      if (data.objects) this.objects = data.objects;
      if (data.name) this._name = data.name;

      if (data.tileSize) this._tileSize = data.tileSize;
      if (data.width) this._width = data.width;
      if (data.height) this._height = data.height;

      if (data.layers && data.layerData) {
        this.layers = data.layers;
        this.layerData = data.layerData;
        const firstLayer = this.layers[0];

        switch (firstLayer.type) {
          case PaintType.TILE:
            tilemapEditorState.selectedLayer =
              firstLayer.id as LayerId<PaintType.TILE>;

            break;
          case PaintType.AUTO_TILE:
            tilemapEditorState.selectedLayer =
              firstLayer.id as LayerId<PaintType.AUTO_TILE>;
            break;
        }
      } else {
        this.createDefaultLayers();

        // emitt events for the default data to be saved in indexed DB

        projectStateEvents.emit(ProjectStateEventType.NAME_UPDATE, {
          name: this.name,
        });

        projectStateEvents.emit(ProjectStateEventType.DIMENSIONS_UPDATE, {
          dimensions: {
            tileSize: this.tileSize,
            width: this.width,
            height: this.height,
          },
        });

        projectStateEvents.emit(ProjectStateEventType.LAYERS_UPDATE, {
          layers: $state.snapshot(this.layers),
        });

        projectStateEvents.emit(ProjectStateEventType.LAYER_DATA_UPDATE, {
          layerData: this.layerData,
        });

        projectStateEvents.emit(ProjectStateEventType.OBJECTS_UPDATE, {
          objects: $state.snapshot(this.objects),
        });
      }

      setAllLayersVisible();
    } catch (e) {
      throw new ProjectStateError(
        "Failed to initialize state",
        ProjectStateErrorCode.SERVER_ERROR,
      );
    }
  }

  set name(name: string) {
    this._name = name;

    projectStateEvents.emit(ProjectStateEventType.NAME_UPDATE, {
      name: this.name,
    });
  }

  get name() {
    return this._name;
  }

  setDimensions(tileSize: number, width: number, height: number) {
    if (!ProjectState.VALID_TILE_SIZES.includes(tileSize))
      throw new ProjectStateError(
        "Tile size must be " + ProjectState.VALID_TILE_SIZES.join(","),
        ProjectStateErrorCode.BAD_REQUEST,
      );

    if (width > ProjectState.MAX_TILES * tileSize)
      throw new ProjectStateError(
        "Maximum allowed width for tilemap is " +
          ProjectState.MAX_TILES * tileSize,
        ProjectStateErrorCode.BAD_REQUEST,
      );

    if (height > ProjectState.MAX_TILES * tileSize)
      throw new ProjectStateError(
        "Maximum allowed height for tilemap is " +
          ProjectState.MAX_TILES * tileSize,
        ProjectStateErrorCode.BAD_REQUEST,
      );

    this._tileSize = tileSize;
    this._height = height;
    this._width = width;

    this.wipeLayerData();

    projectStateEvents.emit(ProjectStateEventType.DIMENSIONS_UPDATE, {
      dimensions: {
        tileSize: this.tileSize,
        width: this.width,
        height: this.height,
      },
    });
  }

  get tileSize() {
    return this._tileSize;
  }

  get height() {
    return this._height;
  }

  get width() {
    return this._width;
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
      tile.x < 0 ||
      tile.x > tileset.width - this.tileSize ||
      tile.y < 0 ||
      tile.y > tileset.height - this.tileSize
    )
      throw new ProjectStateError(
        "Tile pos out of bounds",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const ctxTile = createCanvas(this.tileSize, this.tileSize);
    ctxTile.drawImage(
      tileset.spritesheet,
      tile.x,
      tile.y,
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
    projectStateEvents.emit(ProjectStateEventType.TILESETS_UPDATE, {
      tilesets: $state.snapshot(this.tilesets),
    });
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
    projectStateEvents.emit(ProjectStateEventType.TILESETS_UPDATE, {
      tilesets: $state.snapshot(this.tilesets),
    });
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
    projectStateEvents.emit(ProjectStateEventType.TILESETS_UPDATE, {
      tilesets: $state.snapshot(this.tilesets),
    });
  }

  getObjects() {
    return this.objects;
  }

  getObject(id: string) {
    const object = this.objects.find((obj) => obj.id === id);
    if (object === undefined)
      throw new ProjectStateError(
        `Object ${id} not found`,
        ProjectStateErrorCode.NOT_FOUND,
      );

    return object;
  }

  createObject(
    name: string,
    width: number,
    height: number,
    tiles: Tile[],
    category: ObjectCategory,
  ) {
    const object: Object = {
      id: this.generateId(),
      name: name.trim(),
      width,
      height,
      tiles,
      category,
    };

    this.objects.push(object);
    projectStateEvents.emit(ProjectStateEventType.OBJECTS_UPDATE, {
      objects: $state.snapshot(this.objects),
    });

    return object;
  }

  updateObject(object: Object) {
    const idx = this.objects.findIndex((o) => o.id === object.id);
    if (idx === -1)
      throw new ProjectStateError(
        "Object not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    this.objects[idx] = object;
    projectStateEvents.emit(ProjectStateEventType.OBJECTS_UPDATE, {
      objects: $state.snapshot(this.objects),
    });
  }

  deleteObject(id: string) {
    const idx = this.objects.findIndex((o) => o.id === id);
    if (idx === -1)
      throw new ProjectStateError(
        "Object not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    this.objects.splice(idx, 1);
    projectStateEvents.emit(ProjectStateEventType.OBJECTS_UPDATE, {
      objects: $state.snapshot(this.objects),
    });
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

    projectStateEvents.emit(ProjectStateEventType.AUTO_TILES_UPDATE, {
      autoTiles: $state.snapshot(this.autoTiles),
    });

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

    projectStateEvents.emit(ProjectStateEventType.AUTO_TILES_UPDATE, {
      autoTiles: $state.snapshot(this.autoTiles),
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
          const data = this.getLayerData<PaintType.AUTO_TILE>(l.id);
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

    projectStateEvents.emit(ProjectStateEventType.AUTO_TILES_UPDATE, {
      autoTiles: $state.snapshot(this.autoTiles),
    });
  }

  // Methods attributes //

  getAttributes(row: number, col: number): Map<string, string> {
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

  getAttributesSafe(row: number, col: number): Map<string, string> | null {
    const attributes = this.attributes.get(`${row}:${col}`);
    if (attributes === undefined) return null;
    return attributes;
  }

  getInheritedAttributes(row: number, col: number): Map<string, string> | null {
    const attrs = new Map();
    for (const l of this.layers) {
      const t = this.getTileAt(l.id, row, col);

      if (t !== null) {
        if (t.type === PaintType.TILE) {
          const tAttrs = this.getTileAttributesSafe(t.ref);
          if (tAttrs !== null) {
            for (const [k, v] of tAttrs) {
              attrs.set(k, v);
            }
          }
        } else if (t.type === PaintType.AUTO_TILE) {
          const atAttrs = this.getAutoTileAttributesSafe(t.ref.id);
          const at = this.getAutoTile(t.ref.id);
          const tileRule = at.rules.find(
            (r) => r.id === t.selectedTileRuleId?.id,
          );
          const tAttrs = this.getTileAttributesSafe(
            tileRule?.tile.ref ?? at.defaultTile.ref,
          );

          if (atAttrs !== null) {
            for (const [k, v] of atAttrs) {
              attrs.set(k, v);
            }
          }
          if (tAttrs !== null) {
            for (const [k, v] of tAttrs) {
              attrs.set(k, v);
            }
          }
        }
      }
    }

    return attrs;
  }

  updateAttributes(
    row: number,
    col: number,
    attributes: Map<string, string>,
  ): void {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    this.attributes.set(`${row}:${col}`, attributes);

    projectStateEvents.emit(ProjectStateEventType.ATTRIBUTES_UPDATE, {
      attributes: this.attributes,
    });
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

    projectStateEvents.emit(ProjectStateEventType.ATTRIBUTES_UPDATE, {
      attributes: this.attributes,
    });
  }

  hasAttributes(row: number, col: number) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    return this.attributes.has(`${row}:${col}`);
  }

  getAutoTileAttributes(autoTileId: string): Map<string, string> {
    const attributes = this.autoTileAttributes.get(autoTileId);

    if (attributes === undefined)
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    return attributes;
  }

  getAutoTileAttributesSafe(autoTileId: string): Map<string, string> | null {
    const attributes = this.autoTileAttributes.get(autoTileId);
    if (attributes === undefined) return null;
    return attributes;
  }

  updateAutoTileAttributes(
    autoTileId: string,
    attributes: Map<string, string>,
  ) {
    this.autoTileAttributes.set(autoTileId, attributes);

    projectStateEvents.emit(ProjectStateEventType.AUTO_TILE_ATTRIBUTES_UPDATE, {
      autoTileAttributes: this.autoTileAttributes,
    });
  }

  deleteAutoTileAttributes(autoTileId: string) {
    if (!this.hasAutoTileAttributes(autoTileId))
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    this.autoTileAttributes.delete(autoTileId);
    projectStateEvents.emit(ProjectStateEventType.AUTO_TILE_ATTRIBUTES_UPDATE, {
      autoTileAttributes: this.autoTileAttributes,
    });
  }

  hasAutoTileAttributes(autoTileId: string) {
    return this.autoTileAttributes.has(autoTileId);
  }

  getTileAttributes(tile: Tile) {
    const tileAttributes = this.tileAttributes.get(
      `${tile.tilesetId}:${tile.x}:${tile.y}`,
    );

    if (tileAttributes === undefined)
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    return tileAttributes;
  }

  getTileAttributesSafe(tile: Tile): Map<string, string> | null {
    const attributes = this.tileAttributes.get(
      `${tile.tilesetId}:${tile.x}:${tile.y}`,
    );
    if (attributes === undefined) return null;
    return attributes;
  }

  updateTileAttributes(tile: Tile, attributes: Map<string, string>) {
    this.tileAttributes.set(
      `${tile.tilesetId}:${tile.x}:${tile.y}`,
      attributes,
    );

    projectStateEvents.emit(ProjectStateEventType.TILE_ATTRIBUTES_UPDATE, {
      tileAttributes: this.tileAttributes,
    });
  }

  deleteTileAttributes(tile: Tile) {
    if (!this.hasTileAttributes(tile))
      throw new ProjectStateError(
        "Attributes not found",
        ProjectStateErrorCode.NOT_FOUND,
      );

    this.tileAttributes.delete(`${tile.tilesetId}:${tile.x}:${tile.y}`);

    projectStateEvents.emit(ProjectStateEventType.TILE_ATTRIBUTES_UPDATE, {
      tileAttributes: this.tileAttributes,
    });
  }

  hasTileAttributes(tile: Tile) {
    return this.tileAttributes.has(`${tile.tilesetId}:${tile.x}:${tile.y}`);
  }

  // Methods layers //

  getLayers() {
    return this.layers;
  }

  setReorderedLayers(layers: LayerComp[]) {
    this.layers = layers;
    projectStateEvents.emit(ProjectStateEventType.LAYERS_UPDATE, {
      layers: $state.snapshot(this.layers),
    });
  }

  getLayer<T extends PaintType>(id: LayerId<T>): Layer<T> {
    const layer = this.layers.find((l) => l.id === id);

    if (layer === undefined)
      throw new ProjectStateError(
        `Layer ${id} not found`,
        ProjectStateErrorCode.NOT_FOUND,
      );

    return layer as Layer<T>;
  }

  getLayerSafe<T extends PaintType>(id: LayerId<T>): Layer<T> | null {
    const layer = this.layers.find((l) => l.id === id);

    if (layer === undefined) return null;

    return layer as Layer<T>;
  }

  getLayerData<T extends PaintType>(id: LayerId<T>): LayerData<T> {
    const data = this.layerData.get(id);

    if (data === undefined) {
      throw new ProjectStateError(
        `Layer data ${id} not found`,
        ProjectStateErrorCode.NOT_FOUND,
      );
    }

    return data as LayerData<T>;
  }
  createLayer(name: string, type: PaintType) {
    switch (type) {
      case PaintType.TILE:
        {
          const id = this.generateLayerId<PaintType.TILE>();

          this.layers.push({
            id,
            name,
            type,
          });

          this.layerData.set(
            id,
            new Array(this.rows)
              .fill(null)
              .map((_) => new Array(this.cols).fill(null)),
          );
          guiState.visibleLayers[id] = true;
        }
        break;
      case PaintType.AUTO_TILE:
        {
          const id = this.generateLayerId<PaintType.AUTO_TILE>();
          this.layers.push({
            id,
            name,
            type,
          });

          this.layerData.set(
            id,
            new Array(this.rows)
              .fill(null)
              .map((_) => new Array(this.cols).fill(null)),
          );
          guiState.visibleLayers[id] = true;
        }

        break;
      case PaintType.OBJECT:
        {
          const id = this.generateLayerId<PaintType.OBJECT>();
          this.layers.push({
            id,
            name,
            type,
          });

          this.layerData.set(
            id,
            new Array(this.rows)
              .fill(null)
              .map((_) => new Array(this.cols).fill(null)),
          );
          guiState.visibleLayers[id] = true;
        }

        break;
    }
    projectStateEvents.emit(ProjectStateEventType.LAYERS_UPDATE, {
      layers: $state.snapshot(this.layers),
    });
    projectStateEvents.emit(ProjectStateEventType.LAYER_DATA_UPDATE, {
      layerData: this.layerData,
    });
  }

  updateLayer(id: string, name: string) {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx === -1)
      throw new ProjectStateError(
        "Layer not found",
        ProjectStateErrorCode.NOT_FOUND,
      );
    this.layers[idx].name = name;
    projectStateEvents.emit(ProjectStateEventType.LAYERS_UPDATE, {
      layers: $state.snapshot(this.layers),
    });
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
    projectStateEvents.emit(ProjectStateEventType.LAYERS_UPDATE, {
      layers: $state.snapshot(this.layers),
    });
    projectStateEvents.emit(ProjectStateEventType.LAYER_DATA_UPDATE, {
      layerData: this.layerData,
    });
  }

  setTile<T extends PaintType>(
    layerId: LayerId<T>,
    row: number,
    col: number,
    asset: PaintedAsset<T> | null,
  ): void {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const data = this.getLayerData(layerId);

    data[row][col] = $state.snapshot(asset) as PaintedAsset<T> | null;

    projectStateEvents.emit(ProjectStateEventType.LAYER_DATA_UPDATE, {
      layerData: this.layerData,
    });
  }

  getTileAt<T extends PaintType>(
    layerId: LayerId<T>,
    row: number,
    col: number,
  ): PaintedAsset<T> | null {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        `row and/or col ${row}:${col} is out of bounds for grid`,
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const data = this.getLayerData(layerId);

    return data[row][col] as PaintedAsset<T>;
  }

  getTileAtSafe<T extends PaintType>(
    layerId: LayerId<T>,
    row: number,
    col: number,
  ): PaintedAsset<T> | null {
    if (!this.isWithinGridBounds(row, col)) {
      return null;
    }

    return this.getTileAt(layerId, row, col);
  }

  // Methods for painting layers //

  paintTile(
    layerId: LayerId<PaintType.TILE>,
    row: number,
    col: number,
    tileAsset: TileAsset,
  ) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        `row(${row}) and/or col(${col})`,
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const curr = this.getTileAt(layerId, row, col);

    this.setTile(layerId, row, col, tileAsset);

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        id: this.generateId(),
        type: PaintType.TILE,
        layerId,
        items: [{ data: curr as PaintedTile | null, pos: { row, col } }],
      },
      next: {
        id: this.generateId(),
        type: tileAsset.type,
        layerId,
        items: [{ data: tileAsset, pos: { row, col } }],
      },
    });
  }

  paintTiles(
    layerId: LayerId<PaintType.TILE>,
    tiles: { row: number; col: number; tileAsset: TileAsset }[],
  ): Cell[] {
    const layer = this.getLayer(layerId);

    for (const t of tiles) {
      if (!this.isWithinGridBounds(t.row, t.col))
        throw new ProjectStateError(
          "row and/or col is out of bounds for grid",
          ProjectStateErrorCode.OUT_OF_BOUNDS,
        );
    }

    const prevTiles: TileHistoryEntryItem[] = [];
    const nextTiles: TileHistoryEntryItem[] = [];

    for (const t of tiles) {
      const curr = this.getTileAt(layerId, t.row, t.col);

      this.setTile(layerId, t.row, t.col, t.tileAsset);

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
        id: this.generateId(),
        type: layer.type as PaintType.TILE,
        layerId,
        items: prevTiles,
      },
      next: {
        id: this.generateId(),
        type: layer.type as PaintType.TILE,
        layerId,
        items: nextTiles,
      },
    });

    return nextTiles.map((t) => t.pos);
  }

  eraseTile(layerId: LayerId<PaintType.TILE>, row: number, col: number) {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const layer = this.getLayer(layerId);
    const curr = this.getTileAt(layerId, row, col);

    // Don't do anything if the tile is already erased
    if (this.isSameAsset(curr, null)) {
      return;
    }

    this.setTile(layerId, row, col, null);

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        id: this.generateId(),
        type: layer.type,
        layerId,
        items: [{ data: curr as PaintedTile | null, pos: { row, col } }],
      },
      next: {
        id: this.generateId(),
        type: layer.type,
        layerId,
        items: [{ data: null, pos: { row, col } }],
      },
    });
  }

  eraseTiles(layerId: LayerId<PaintType.TILE>, tiles: Cell[]) {
    const layer = this.getLayer(layerId);

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
      const curr = this.getTileAt(layerId, t.row, t.col);
      this.setTile(layerId, t.row, t.col, null);

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
      prev: {
        id: this.generateId(),
        type: layer.type,
        layerId,
        items: prevTiles,
      },
      next: {
        id: this.generateId(),
        type: layer.type,
        layerId,
        items: nextTiles,
      },
    });
  }

  floodFill<T extends PaintType>(
    layerId: LayerId<T>,
    row: number,
    col: number,
    paint: AssetRef | null,
  ): Cell[] {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const layer = this.getLayer(layerId);

    const clickedTile = this.getTileAt(layerId, row, col);

    if (this.isSameAsset(clickedTile, paint)) return [];

    const stack = [{ row, col }];

    const visited: boolean[][] = new Array(this.rows)
      .fill(null)
      .map((_) => new Array(this.cols).fill(false));

    visited[row][col] = true;

    const filledTiles: { row: number; col: number }[] = [];

    const MAX_FILL =
      layer.type === PaintType.AUTO_TILE
        ? 64 * 64
        : ProjectState.MAX_TILES * ProjectState.MAX_TILES; // Just to prevent operation from beeing to slow, usually i don't fill larger areas

    while (stack.length > 0) {
      if (filledTiles.length > MAX_FILL) {
        console.error("Filled area to large..");
        return [];
      }

      const tile = stack.pop()!;

      const neighbours = getNeighbours(
        { row: tile.row, col: tile.col },
        this.rows,
        this.cols,
      );

      for (const n of neighbours) {
        if (
          !visited[n.row][n.col] &&
          this.isSameAsset(clickedTile, this.getTileAt(layerId, n.row, n.col))
        ) {
          visited[n.row][n.col] = true;
          stack.push(n);
        }
      }

      filledTiles.push(tile);
    }

    switch (layer.type) {
      case PaintType.TILE:
        {
          if (paint === null) {
            this.eraseTiles(layerId as LayerId<PaintType.TILE>, filledTiles);
          } else {
            this.paintTiles(
              layerId as LayerId<PaintType.TILE>,
              filledTiles.map((ft) => ({
                ...ft,
                tileAsset: paint as TileAsset,
              })),
            );
          }
        }

        break;
      case PaintType.AUTO_TILE:
        {
          if (paint === null) {
            this.eraseAutoTiles(
              layerId as LayerId<PaintType.AUTO_TILE>,
              filledTiles,
            );
          } else {
            this.paintAutoTiles(
              layerId as LayerId<PaintType.AUTO_TILE>,
              filledTiles,
              paint as AutoTileAsset,
            );
          }

          // Add also the neighbours of the filled tiles to the filled tiles array so that GUI can update cache correctyl

          const neighbours: Cell[] = [];

          for (const t of filledTiles) {
            const tileNeighbours = getNeighbours(t, this.rows, this.cols, true);

            for (const tn of tileNeighbours) {
              if (neighbours.find((n) => isSameCell(n, tn)) === undefined) {
                neighbours.push(tn);
              }
            }
          }

          filledTiles.push(...neighbours);
        }
        break;
    }

    return filledTiles;
  }

  paintAutoTile(
    layerId: LayerId<PaintType.AUTO_TILE>,
    row: number,
    col: number,
    autoTileAsset: AutoTileAsset,
  ): Cell[] {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const layer = this.getLayer(layerId);

    const currTile = this.getTileAt(layerId, row, col);

    const autoTile = this.getAutoTile(autoTileAsset.ref.id);

    const tileRuleId = this.pickTileFromAutoTile(row, col, autoTile, layer.id);

    const tile: PaintedAutoTile = {
      type: PaintType.AUTO_TILE,
      ref: { id: autoTileAsset.ref.id },
      selectedTileRuleId: tileRuleId,
    };

    const prevItems: AutoTileHistoryEntryItem[] = [];
    const nextItems: AutoTileHistoryEntryItem[] = [];

    this.setTile(layerId, row, col, tile);

    prevItems.push({
      pos: { row, col },
      data: currTile,
    });

    nextItems.push({
      pos: { row, col },
      data: tile,
    });

    const neighbours = getNeighbours({ row, col }, this.rows, this.cols, true);

    for (const n of neighbours) {
      const currTile = this.getTileAt(layerId, n.row, n.col);

      if (
        currTile !== null &&
        currTile.type === PaintType.AUTO_TILE &&
        currTile.ref.id === autoTileAsset.ref.id
      ) {
        const selectedTileRuleId = this.pickTileFromAutoTile(
          n.row,
          n.col,
          autoTile,
          layerId,
        );

        prevItems.push({
          pos: { row: n.row, col: n.col },
          data: currTile as PaintedAutoTile | null,
        });

        const tile: PaintedAutoTile = {
          type: PaintType.AUTO_TILE,
          ref: { id: autoTileAsset.ref.id },
          selectedTileRuleId,
        };

        nextItems.push({
          pos: { row: n.row, col: n.col },
          data: tile,
        });

        this.setTile(layerId, n.row, n.col, tile);
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        id: this.generateId(),
        type: layer.type,
        layerId,
        items: prevItems,
      },
      next: {
        id: this.generateId(),
        type: layer.type,
        layerId,
        items: nextItems,
      },
    });

    return nextItems.map((t) => t.pos);
  }

  paintAutoTiles(
    layerId: LayerId<PaintType.AUTO_TILE>,
    tiles: Cell[],
    autoTileAsset: AutoTileAsset,
  ): Cell[] {
    const layer = this.getLayer(layerId);

    const autoTile = this.getAutoTile(autoTileAsset.ref.id);

    const prevItems: AutoTileHistoryEntryItem[] = [];
    const nextItems: AutoTileHistoryEntryItem[] = [];

    // 1. create history entry items for prev, the currently painted tiles including neighbours, but remove duplicates.

    for (const t of tiles) {
      // only add the items that doesn't already exist in prev
      if (
        prevItems.find((i) => i.pos.col === t.col && i.pos.row === t.row) ===
        undefined
      ) {
        const currTile = this.getTileAt(layerId, t.row, t.col);

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
          const currTile = this.getTileAt(layerId, n.row, n.col);
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

      this.setTile(layerId, t.row, t.col, {
        type: PaintType.AUTO_TILE,
        ref: { id: autoTileAsset.ref.id },
        selectedTileRuleId,
      });

      // Update neighbours

      const neighbours = getNeighbours(t, this.rows, this.cols, true);

      for (const n of neighbours) {
        const currTile = this.getTileAt(layerId, n.row, n.col);

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

          this.setTile(layerId, n.row, n.col, {
            type: PaintType.AUTO_TILE,
            ref: { id: autoTileAsset.ref.id },
            selectedTileRuleId,
          });
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
        const currTile = this.getTileAt(layerId, t.row, t.col);
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
          const currTile = this.getTileAt(layerId, t.row, t.col);
          nextItems.push({
            pos: n,
            data: currTile as PaintedAutoTile | null,
          });
        }
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        id: this.generateId(),
        type: PaintType.AUTO_TILE,
        layerId,
        items: prevItems,
      },
      next: {
        id: this.generateId(),
        type: PaintType.AUTO_TILE,
        layerId,
        items: nextItems,
      },
    });

    return nextItems.map((t) => t.pos);
  }

  eraseAutoTiles(layerId: LayerId<PaintType.AUTO_TILE>, tiles: Cell[]): Cell[] {
    const prevItems: AutoTileHistoryEntryItem[] = [];
    const nextItems: AutoTileHistoryEntryItem[] = [];

    // 1. create history entry items for prev, the currently painted tiles including neighbours, but remove duplicates.

    for (const t of tiles) {
      // only add the items that doesn't already exist in prev
      if (
        prevItems.find((i) => i.pos.col === t.col && i.pos.row === t.row) ===
        undefined
      ) {
        const currTile = this.getTileAt(layerId, t.row, t.col);
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
          const currTile = this.getTileAt(layerId, n.row, n.col);
          prevItems.push({
            pos: n,
            data: currTile as PaintedAutoTile | null,
          });
        }
      }
    }

    // 2. erase each tile and update the neighbours

    for (const t of tiles) {
      this.setTile(layerId, t.row, t.col, null);

      // Update neighbours

      const neighbours = getNeighbours(t, this.rows, this.cols, true);

      for (const n of neighbours) {
        const currTile = this.getTileAt(layerId, n.row, n.col);

        if (currTile !== null && currTile.type === PaintType.AUTO_TILE) {
          const autoTile = this.getAutoTile(currTile.ref.id);

          const selectedTileRuleId = this.pickTileFromAutoTile(
            n.row,
            n.col,
            autoTile,
            layerId,
          );

          this.setTile(layerId, n.row, n.col, {
            type: PaintType.AUTO_TILE,
            ref: { id: autoTile.id },
            selectedTileRuleId,
          });
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
        const currTile = this.getTileAt(layerId, t.row, t.col);
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
          const currTile = this.getTileAt(layerId, n.row, n.col);
          nextItems.push({
            pos: n,
            data: currTile as PaintedAutoTile | null,
          });
        }
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        id: this.generateId(),
        type: PaintType.AUTO_TILE,
        layerId,
        items: prevItems,
      },
      next: {
        id: this.generateId(),
        type: PaintType.AUTO_TILE,
        layerId,
        items: nextItems,
      },
    });

    return nextItems.map((t) => t.pos);
  }

  eraseAutoTile(
    layerId: LayerId<PaintType.AUTO_TILE>,
    row: number,
    col: number,
  ): Cell[] {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const layer = this.getLayer(layerId);

    const currTile = this.getTileAt(layerId, row, col);

    if (currTile === null) {
      return [];
    }

    const autoTile = this.getAutoTile(currTile.ref.id);

    const prevItems: AutoTileHistoryEntryItem[] = [];
    const nextItems: AutoTileHistoryEntryItem[] = [];

    prevItems.push({ pos: { row, col }, data: currTile });

    this.setTile(layerId, row, col, null);

    nextItems.push({ pos: { row: row, col: col }, data: null });

    const neighbours = getNeighbours({ row, col }, this.rows, this.cols, true);

    for (const n of neighbours) {
      const currTile = this.getTileAt(layerId, n.row, n.col);

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

        const updated: PaintedAutoTile = {
          type: PaintType.AUTO_TILE,
          ref: { id: autoTile.id },
          selectedTileRuleId: tileRuleId,
        };

        nextItems.push({
          pos: { row: n.row, col: n.col },
          data: updated,
        });

        this.setTile(layerId, n.row, n.col, {
          ...currTile,
          selectedTileRuleId: tileRuleId,
        });
      }
    }

    projectStateEvents.emit(ProjectStateEventType.PAINT, {
      prev: {
        id: this.generateId(),
        type: layer.type,
        layerId,
        items: prevItems,
      },
      next: {
        id: this.generateId(),
        type: layer.type,
        layerId,
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
          a.ref.y === (b as typeof a).ref.y &&
          a.ref.x === (b as typeof a).ref.x
        );
      case PaintType.OBJECT:
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
            x: parseInt(x),
            y: parseInt(y),
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
      const data = this.getLayerData(l.id) as LayerDataComp;
      return { ...l, data };
    });

    const data: ProjectFile = {
      name: this.name,
      tileSize: this.tileSize,
      width: this.width,
      height: this.height,
      tilesets,
      autoTiles: this.autoTiles,
      objects: this.objects,
      attributes,
      tileAttributes,
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
    this.objects = [];
    this.attributes = new Map();
    this.tileAttributes = new Map();
    this.autoTileAttributes = new Map();
    this.layerData = new Map();

    this.createDefaultLayers();

    projectStateEvents.emit(ProjectStateEventType.NEW_PROJECT, {
      attributes: this.attributes,
      tileAttributes: this.tileAttributes,
      autoTileAttributes: this.autoTileAttributes,
      autoTiles: $state.snapshot(this.autoTiles),
      objects: $state.snapshot(this.objects),
      height: $state.snapshot(this._height),
      width: $state.snapshot(this._width),
      name: $state.snapshot(this._name),
      layerData: this.layerData,
      tilesets: $state.snapshot(this.tilesets),
      layers: $state.snapshot(this.layers),
      tileSize: $state.snapshot(this._tileSize),
    });
  }

  async openFile(file: File): Promise<void> {
    try {
      if (file.type !== "application/json")
        throw new ProjectStateError(
          "Invalid project file type, accepts JSON",
          ProjectStateErrorCode.BAD_REQUEST,
        );

      const json = await file.text();
      const data: ProjectFile = JSON.parse(json); // you could argue that this should be runtime type validated

      this.name = data.name;
      this._tileSize = data.tileSize;
      this._width = data.width;
      this._height = data.height;

      // Create attributes maps

      for (const a of data.attributes) {
        this.attributes.set(
          `${a.pos.x / this.tileSize}:${a.pos.y / this.tileSize}`,
          new Map(Object.entries(a.attributes)),
        );
      }

      for (const a of data.tileAttributes) {
        this.tileAttributes.set(
          `${a.tile.tilesetId}:${a.tile.x}:${a.tile.y}`,
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
      this.objects = data.objects ?? [];

      // Create layers

      this.layers = [];

      this.layerData.clear();

      for (const l of data.layers) {
        this.layerData.set(l.id, l.data);

        let id =
          l.type === PaintType.AUTO_TILE
            ? (l.id as LayerId<PaintType.AUTO_TILE>)
            : (l.id as LayerId<PaintType.TILE>);

        this.layers.push({ name: l.name, id, type: l.type } as LayerComp);
      }

      projectStateEvents.emit(ProjectStateEventType.OPEN_FILE, {
        attributes: this.attributes,
        tileAttributes: this.tileAttributes,
        autoTileAttributes: this.autoTileAttributes,
        autoTiles: $state.snapshot(this.autoTiles),
        objects: $state.snapshot(this.objects),
        height: $state.snapshot(this._height),
        width: $state.snapshot(this._width),
        name: $state.snapshot(this._name),
        layerData: this.layerData,
        tilesets: $state.snapshot(this.tilesets),
        layers: $state.snapshot(this.layers),
        tileSize: $state.snapshot(this._tileSize),
      });
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

    const attributes = this.getExportedAttributes();
    const objects = this.getExportedObjects();

    const data: ProjectStateJSONExport = {
      name: this.name,
      tileSize: this.tileSize,
      width: this.width,
      height: this.height,
      rows: this.rows,
      cols: this.cols,
      tilemap: ctx.canvas.toDataURL(),
      attributes,
      objects,
    };

    return new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
  }

  private getExportedObjects(): ObjectJSON[] {
    const objects: ObjectJSON[] = [];

    for (const layer of this.layers) {
      if (layer.type !== PaintType.OBJECT) continue;

      const data = this.getLayerData(layer.id) as LayerData<PaintType.OBJECT>;

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const paintedObject = data[r][c] as ObjectAsset | null;
          if (paintedObject === null) continue;

          try {
            const object = this.getObject(paintedObject.ref.id);
            objects.push({
              image: this.renderObjectImage(object),
              width: object.width,
              height: object.height,
              pos: { x: c * this.tileSize, y: r * this.tileSize },
              name: object.name,
            });
          } catch {
            // Skip invalid object references
          }
        }
      }
    }

    return objects;
  }

  private renderObjectImage(object: Object): string {
    const objectWidth = object.width * this.tileSize;
    const objectHeight = object.height * this.tileSize;
    const ctx = createCanvas(objectWidth, objectHeight);

    for (let index = 0; index < object.tiles.length; index++) {
      const tile = object.tiles[index];
      const col = index % object.width;
      const row = Math.floor(index / object.width);
      const tileset = this.getTileset(tile.tilesetId);

      ctx.drawImage(
        tileset.spritesheet,
        tile.x,
        tile.y,
        this.tileSize,
        this.tileSize,
        col * this.tileSize,
        row * this.tileSize,
        this.tileSize,
        this.tileSize,
      );
    }

    return ctx.canvas.toDataURL();
  }

  // Private stuff //

  private getExportedAttributes(): {
    pos: Vec2;
    attributes: { [k: string]: string };
  }[] {
    // Create a list of tile's with their attributes. Precedence order: 1. painted tile / tile instance, 2. Tile 3. Auto tile

    const attributes: { pos: Vec2; attributes: { [k: string]: string } }[] = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tileAttributes = new Map();

        for (const l of this.getLayers()) {
          const paintedAsset = this.getTileAt(l.id, r, c);
          if (paintedAsset === null) continue;

          // Add tile attributes / auto tile attributes

          switch (paintedAsset.type) {
            case PaintType.TILE:
              if (this.hasTileAttributes(paintedAsset.ref)) {
                const tAttr = this.getTileAttributes(paintedAsset.ref);
                for (const [k, v] of tAttr.entries()) {
                  tileAttributes.set(k, v);
                }
              }
              break;
            case PaintType.AUTO_TILE:
              const autoTile = this.getAutoTile(paintedAsset.ref.id);
              const tile =
                autoTile.rules.find(
                  (r) => r.id === paintedAsset.selectedTileRuleId?.id,
                )?.tile.ref ?? autoTile.defaultTile.ref;

              if (this.hasTileAttributes(tile)) {
                const tAttrs = this.getTileAttributes(tile);
                for (const [k, v] of tAttrs.entries()) {
                  tileAttributes.set(k, v);
                }
              } else if (this.hasAutoTileAttributes(autoTile.id)) {
                const atAttrs = this.getAutoTileAttributes(autoTile.id);

                for (const [k, v] of atAttrs.entries()) {
                  tileAttributes.set(k, v);
                }
              }
              break;
          }
        }

        // Add painted tile attributes

        if (this.hasAttributes(r, c)) {
          const paintedTileAttributes = this.getAttributes(r, c);

          for (const [k, v] of paintedTileAttributes.entries()) {
            tileAttributes.set(k, v);
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

    return attributes;
  }

  private paintProjectToCanvas(): CanvasRenderingContext2D {
    const ctx = createCanvas(this.width, this.height);

    // Paint all tile and auto tile layers on canvas

    for (const layer of this.layers) {
      switch (layer.type) {
        case PaintType.TILE:
          {
            let tile: PaintedTile | null = null;

            for (let r = 0; r < this.rows; ++r) {
              for (let c = 0; c < this.cols; ++c) {
                tile = this.getTileAt(layer.id, r, c);
                if (tile !== null) {
                  const tileset = this.getTileset(tile.ref.tilesetId);

                  ctx.drawImage(
                    tileset.spritesheet,
                    tile.ref.x,
                    tile.ref.y,
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
              autoTileAsset = this.getTileAt(layer.id, r, c);

              if (autoTileAsset !== null) {
                const autoTile = this.getAutoTile(autoTileAsset.ref.id);
                const tile =
                  autoTile.rules.find(
                    (tr) => tr.id === autoTileAsset?.selectedTileRuleId?.id,
                  )?.tile ?? autoTile.defaultTile;
                const tileset = this.getTileset(tile.ref.tilesetId);

                ctx.drawImage(
                  tileset.spritesheet,
                  tile.ref.x,
                  tile.ref.y,
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
    layerId: LayerId<PaintType.AUTO_TILE>,
  ): IdRef | null {
    if (!this.isWithinGridBounds(row, col))
      throw new ProjectStateError(
        "row and/or col is out of bounds for grid",
        ProjectStateErrorCode.OUT_OF_BOUNDS,
      );

    const n = row > 0 ? this.getTileAtSafe(layerId, row - 1, col) : null;
    const ne = this.getTileAtSafe(layerId, row - 1, col + 1);
    const e = this.getTileAtSafe(layerId, row, col + 1);
    const se = this.getTileAtSafe(layerId, row + 1, col + 1);
    const s = this.getTileAtSafe(layerId, row + 1, col);
    const sw = this.getTileAtSafe(layerId, row + 1, col - 1);
    const w = this.getTileAtSafe(layerId, row, col - 1);
    const nw = this.getTileAtSafe(layerId, row - 1, col - 1);

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

  private generateId() {
    return crypto.randomUUID();
  }

  private generateLayerId<T extends PaintType>(): LayerId<T> {
    return crypto.randomUUID() as LayerId<T>;
  }
}

export const projectState = new ProjectState();
