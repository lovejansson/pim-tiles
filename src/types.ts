export type Tileset = {
  id: string;
  name: string;
  width: number;
  height: number;
  spritesheet: ImageBitmap;
};

export type AutoTile = {
  id: string;
  name: string;
  rules: TileRule[];
  defaultTile: TileAsset;
};

export type Vec2 = {
  x: number;
  y: number;
};

/**
 *
 * Måla med ett objekt i tilemap editor: Ska placera objektetes tiles där man klickar, måste uppdatera projectState och så
 *
 * Selection på objekt layer
 *
 * Radera detta objekt? mkt mer lättare att göra det utan erase tool, så "paint tool" kommer placera objektet vid en tile
 *
 * om man vill radera så får man markera ett eller flera objekt och trycka på delete eller backspace, det hör till selection
 *
 *
 */

export type ObjectCategory = "houses" | "nature" | "furniture" | "decorations" | "other";

export type Object = {
  id: string;
  name: string;

  width: number;
  height: number;
  image: {
    tiles: Tile[];
    bitmap: ImageBitmap;
  };
  category: ObjectCategory;
};

export type ObjectJSON = {
  image: string;
  width: number;
  height: number;
  pos: Vec2;
  name: string;
  layerIdx: number;
  attributes?: { [key: string]: any };
};

export type Cell = {
  row: number;
  col: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum PaintType {
  TILE,
  AUTO_TILE,
  OBJECT,
}

export enum Tool {
  PAINT,
  ERASE,
  SELECT,
}

export type IdRef = {
  readonly id: string;
};

export type Tile = {
  readonly tilesetId: string;
  readonly x: number;
  readonly y: number;
};

export type AssetRefT<T extends PaintType> = {
  readonly type: T;
  readonly ref: T extends PaintType.TILE ? Tile : IdRef;
};

export type PaintedAsset<T extends PaintType> = T extends PaintType.AUTO_TILE
  ? AssetRefT<T> & { readonly selectedTileRuleId: IdRef | null }
  : AssetRefT<T>;

export type LayerData<T extends PaintType> = T extends PaintType.OBJECT
  ? Map<string, PaintedAsset<T>>
  : (PaintedAsset<T> | null)[][];

export type LayerDataComp =
  | LayerData<PaintType.TILE>
  | LayerData<PaintType.AUTO_TILE>
  | LayerData<PaintType.OBJECT>;

export type LayerComp =
  | Layer<PaintType.TILE>
  | Layer<PaintType.AUTO_TILE>
  | Layer<PaintType.OBJECT>;

export type Layer<T extends PaintType> = {
  id: LayerId<T>;
  type: T;
  name: string;
};

export type LayerId<T extends PaintType> = string & { __brand: T };

export type ObjectLayerId = LayerId<PaintType.OBJECT>;

export type PaintedTile = PaintedAsset<PaintType.TILE>;
export type PaintedObject = PaintedAsset<PaintType.OBJECT>;
export type PaintedAutoTile = PaintedAsset<PaintType.AUTO_TILE>;

export type TileLayer = Layer<PaintType.TILE>;
export type AutoTileLayer = Layer<PaintType.AUTO_TILE>;

export enum TileRequirement {
  REQUIRED = "required",
  EXCLUDED = "excluded",
  OPTIONAL = "optional",
}

export type TileConnections = {
  n: TileRequirement;
  ne: TileRequirement;
  e: TileRequirement;
  se: TileRequirement;
  s: TileRequirement;
  sw: TileRequirement;
  w: TileRequirement;
  nw: TileRequirement;
};

export type TileRule = {
  id: string;
  connections: TileConnections;
  tile: TileAsset;
};

export type TileAsset = AssetRefT<PaintType.TILE>;
export type AutoTileAsset = AssetRefT<PaintType.AUTO_TILE>;
export type ObjectAsset = AssetRefT<PaintType.OBJECT>;

export type AssetRef = TileAsset | AutoTileAsset | ObjectAsset;

export type SelectedAsset<T extends PaintType> = T extends PaintType.TILE
  ? AssetRefT<PaintType.TILE>[]
  : AssetRefT<T>;

export type Selection<T extends PaintType> = {
  tiles: {
    org: Cell;
    curr: Cell;
    tile: PaintedAsset<T>;
  }[];
};

export type TilemapEditorState<T extends PaintType> = {
  type: T;
  selectedTool: Tool;
  selectedLayer: LayerId<T>;
  selectedAsset: SelectedAsset<T> | null;
  fillToolIsActive: boolean;
  selection: Selection<T>;
};

export type GUIState = {
  notification: Notification | null;
  showGrid: boolean;
  outlineObjects: boolean;
  gridColor: string;
  mouseTilePos: { row: number; col: number };
  visibleLayers: { [key: string]: boolean };
};

export type ProjectStateJSONExport = {
  tilemap: string;
  name: string;
  tileSize: number;
  width: number;
  height: number;
  rows: number;
  cols: number;
  attributes: { pos: Vec2; attributes: { [key: string]: any } }[];
  objects: ObjectJSON[];
};

export type SerializedProjectObject = Omit<Object, "image"> & {
  image: {
    tiles: Tile[];
    bitmap: string | Record<string, never>;
  };
};

export type ProjectFile = {
  name: string;
  tileSize: number;
  width: number;
  height: number;
  layers: (LayerComp & { data: LayerDataComp | [string, PaintedObject][] })[];
  tilesets: (Omit<Tileset, "spritesheet"> & { spritesheet: string })[];
  autoTiles: AutoTile[];
  objects: SerializedProjectObject[];
  attributes: { pos: Vec2; attributes: { [key: string]: any } }[];
  tileAttributes: { tile: Tile; attributes: { [key: string]: any } }[];
  autoTileAttributes: {
    autoTileId: string;
    attributes: { [key: string]: any };
  }[];
  objectAttributes: { objectId: string; attributes: { [key: string]: any } }[];
  paintedObjectAttributes: {
    layerId: string;
    row: number;
    col: number;
    attributes: { [key: string]: any };
  }[];
};

export type Notification = {
  variant: "primary" | "success" | "neutral" | "warning" | "danger";
  title: string;
  msg: string;
};

export type HistoryEntryPaint<T extends PaintType> = PaintedAsset<T>;

export type HistoryEntryItem<T extends PaintType> = {
  data: HistoryEntryPaint<T> | null;
  pos: Cell;
};

export type TileHistoryEntryItem = HistoryEntryItem<PaintType.TILE>;
export type AutoTileHistoryEntryItem = HistoryEntryItem<PaintType.AUTO_TILE>;
export type ObjectHistoryEntryItem = HistoryEntryItem<PaintType.OBJECT>;

export type HistoryEntryT<T extends PaintType> = {
  type: T;
  id: string;
  layerId: LayerId<T>;
  items: HistoryEntryItem<T>[];
};

export type HistoryStackPopT<T extends PaintType> = {
  prev: HistoryEntryT<T>;
  curr: HistoryEntryT<T>;
};

export type TileHistoryEntry = HistoryEntryT<PaintType.TILE>;
export type AutoTileHistoryEntry = HistoryEntryT<PaintType.AUTO_TILE>;
export type ObjectHistoryEntry = HistoryEntryT<PaintType.OBJECT>;
export type HistoryStackPop =
  | HistoryStackPopT<PaintType.AUTO_TILE>
  | HistoryStackPopT<PaintType.TILE>
  | HistoryStackPopT<PaintType.OBJECT>;
export type HistoryEntry =
  | TileHistoryEntry
  | AutoTileHistoryEntry
  | ObjectHistoryEntry;

