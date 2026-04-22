type Tileset = {
  id: string;
  name: string;
  width: number;
  height: number;
  spritesheet: ImageBitmap;
};

type AutoTile = {
  id: string;
  name: string;
  rules: TileRule[];
  defaultTile: TileAsset;
};

type Vec2 = {
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

type ObjectCategory = "houses" | "nature" | "furniture" | "decorations" | "other";

type Object = {
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

type ObjectJSON = {
  image: string;
  width: number;
  height: number;
  pos: Vec2;
  name: string;
};

type Cell = {
  row: number;
  col: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

enum PaintType {
  TILE,
  AUTO_TILE,
  OBJECT,
}

enum Tool {
  PAINT,
  ERASE,
  SELECT,
}

type IdRef = {
  readonly id: string;
};

type Tile = {
  readonly tilesetId: string;
  readonly x: number;
  readonly y: number;
};

type AssetRefT<T extends PaintType> = {
  readonly type: T;
  readonly ref: T extends PaintType.TILE ? Tile : IdRef;
};

type PaintedAsset<T extends PaintType> = T extends PaintType.AUTO_TILE
  ? AssetRefT<T> & { readonly selectedTileRuleId: IdRef | null }
  : AssetRefT<T>;

type LayerData<T extends PaintType> = T extends PaintType.OBJECT
  ? Map<string, PaintedAsset<T>>
  : (PaintedAsset<T> | null)[][];

type LayerDataComp =
  | LayerData<PaintType.TILE>
  | LayerData<PaintType.AUTO_TILE>
  | LayerData<PaintType.OBJECT>;

type LayerComp =
  | Layer<PaintType.TILE>
  | Layer<PaintType.AUTO_TILE>
  | Layer<PaintType.OBJECT>;

type Layer<T extends PaintType> = {
  id: LayerId<T>;
  type: T;
  name: string;
};

type LayerId<T extends PaintType> = string & { __brand: T };

type ObjectLayerId = LayerId<PaintType.OBJECT>;

type PaintedTile = PaintedAsset<PaintType.TILE>;
type PaintedObject = PaintedAsset<PaintType.OBJECT>;
type PaintedAutoTile = PaintedAsset<PaintType.AUTO_TILE>;

type TileLayer = Layer<PaintType.TILE>;
type AutoTileLayer = Layer<PaintType.AUTO_TILE>;

enum TileRequirement {
  REQUIRED = "required",
  EXCLUDED = "excluded",
  OPTIONAL = "optional",
}

type TileConnections = {
  n: TileRequirement;
  ne: TileRequirement;
  e: TileRequirement;
  se: TileRequirement;
  s: TileRequirement;
  sw: TileRequirement;
  w: TileRequirement;
  nw: TileRequirement;
};

type TileRule = {
  id: string;
  connections: TileConnections;
  tile: TileAsset;
};

type TileAsset = AssetRefT<PaintType.TILE>;
type AutoTileAsset = AssetRefT<PaintType.AUTO_TILE>;
type ObjectAsset = AssetRefT<PaintType.OBJECT>;

type AssetRef = TileAsset | AutoTileAsset | ObjectAsset;

type SelectedAsset<T extends PaintType> = T extends PaintType.TILE
  ? AssetRefT<PaintType.TILE>[]
  : AssetRefT<T>;

type Selection<T extends PaintType> = {
  tiles: {
    org: Cell;
    curr: Cell;
    tile: PaintedAsset<T>;
  }[];
};

type TilemapEditorState<T extends PaintType> = {
  type: T;
  selectedTool: Tool;
  selectedLayer: LayerId<T>;
  selectedAsset: SelectedAsset<T> | null;
  fillToolIsActive: boolean;
  selection: Selection<T>;
};

type GUIState = {
  notification: Notification | null;
  showGrid: boolean;
  outlineObjects: boolean;
  gridColor: string;
  mouseTilePos: { row: number; col: number };
  visibleLayers: { [key: string]: boolean };
};

type ProjectJSONExport = {
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

type ProjectFile = {
  name: string;
  tileSize: number;
  width: number;
  height: number;
  layers: (LayerComp & { data: LayerDataComp })[];
  tilesets: (Omit<Tileset, "spritesheet"> & { spritesheet: string })[];
  autoTiles: AutoTile[];
  objects: Object[];
  attributes: { pos: Vec2; attributes: { [key: string]: any } }[];
  tileAttributes: { tile: Tile; attributes: { [key: string]: any } }[];
  autoTileAttributes: {
    autoTileId: string;
    attributes: { [key: string]: any };
  }[];
};

type Notification = {
  variant: "primary" | "success" | "neutral" | "warning" | "danger";
  title: string;
  msg: string;
};

type HistoryEntryPaint<T extends PaintType> = PaintedAsset<T>;

type HistoryEntryItem<T extends PaintType> = {
  data: HistoryEntryPaint<T> | null;
  pos: Cell;
};

type TileHistoryEntryItem = HistoryEntryItem<PaintType.TILE>;
type AutoTileHistoryEntryItem = HistoryEntryItem<PaintType.AUTO_TILE>;
type ObjectHistoryEntryItem = HistoryEntryItem<PaintType.OBJECT>;

type HistoryEntryT<T extends PaintType> = {
  type: T;
  id: string;
  layerId: LayerId<T>;
  items: HistoryEntryItem<T>[];
};

type HistoryStackPopT<T extends PaintType> = {
  prev: HistoryEntryT<T>;
  curr: HistoryEntryT<T>;
};

type TileHistoryEntry = HistoryEntryT<PaintType.TILE>;
type AutoTileHistoryEntry = HistoryEntryT<PaintType.AUTO_TILE>;
type ObjectHistoryEntry = HistoryEntryT<PaintType.OBJECT>;
type HistoryStackPop =
  | HistoryStackPopT<PaintType.AUTO_TILE>
  | HistoryStackPopT<PaintType.TILE>
  | HistoryStackPopT<PaintType.OBJECT>;
type HistoryEntry =
  | TileHistoryEntry
  | AutoTileHistoryEntry
  | ObjectHistoryEntry;

export {
  type ProjectJSONExport as ProjectStateJSONExport,
  type PaintedTile,
  type PaintedObject,
  type PaintedAutoTile,
  type PaintedAsset,
  type Layer,
  type LayerData,
  type LayerDataComp,
  type LayerComp,
  type AutoTileHistoryEntryItem,
  type TileHistoryEntryItem,
  type ObjectHistoryEntryItem,
  type HistoryStackPop,
  PaintType,
  Tool,
  TileRequirement,
  type ProjectFile,
  type HistoryEntry,
  type TileHistoryEntry,
  type TilemapEditorState,
  type AssetRef,
  type TileAsset,
  type AutoTileAsset,
  type ObjectAsset,
  type Vec2,
  type Rect,
  type GUIState,
  type Notification,
  type TileLayer,
  type Tileset,
  type Tile,
  type AutoTile,
  type TileRule,
  type TileConnections,
  type Cell,
  type IdRef,
  type AutoTileLayer,
  type LayerId,
  type ObjectLayerId,
  type Object,
  type ObjectCategory,
  type ObjectJSON,
};
