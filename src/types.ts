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

type Point = {
  x: number;
  y: number;
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

type LayerData<T extends PaintType> = (PaintedAsset<T> | null)[][];

type LayerDataComp = LayerData<PaintType.TILE> | LayerData<PaintType.AUTO_TILE>;

type LayerComp = Layer<PaintType.TILE> | Layer<PaintType.AUTO_TILE>;

type Layer<T extends PaintType> = {
  id: LayerId<T>;
  type: T;
  name: string;
};

type LayerId<T extends PaintType> = string & { __brand: T };

type PaintedTile = PaintedAsset<PaintType.TILE>;
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

type AssetRef = TileAsset | AutoTileAsset;

type SelectedAsset<T extends PaintType> = T extends PaintType.TILE
  ? AssetRefT<PaintType.TILE>[]
  : AssetRefT<T>;

type Selection<T extends PaintType> = {
  tiles: {
    org: Cell;
    prev: Cell;
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
  attributes: { pos: Point; attributes: { [key: string]: any } }[];
};

type ProjectFile = {
  name: string;
  tileSize: number;
  width: number;
  height: number;
  layers: (LayerComp & { data: LayerDataComp })[];
  tilesets: (Omit<Tileset, "spritesheet"> & { spritesheet: string })[];
  autoTiles: AutoTile[];
  attributes: { pos: Point; attributes: { [key: string]: any } }[];
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

type HistoryEntryData<T extends PaintType> = PaintedAsset<T>;

type HistoryEntryItem<T extends PaintType> = {
  data: HistoryEntryData<T> | null;
  pos: Cell;
};

type TileHistoryEntryItem = HistoryEntryItem<PaintType.TILE>;
type AutoTileHistoryEntryItem = HistoryEntryItem<PaintType.AUTO_TILE>;

type HistoryEntryT<T extends PaintType> = {
  type: T;
  id: string;
  layerId: LayerId<T>;
  items: HistoryEntryItem<T>[];
};

type TileHistoryEntry = HistoryEntryT<PaintType.TILE>;
type AutoTileHistoryEntry = HistoryEntryT<PaintType.AUTO_TILE>;

type HistoryEntry = TileHistoryEntry | AutoTileHistoryEntry;

export {
  type ProjectJSONExport as ProjectStateJSONExport,
  type PaintedTile,
  type PaintedAutoTile,
  type PaintedAsset,
  type Layer,
  type LayerData,
  type LayerDataComp,
  type LayerComp,
  type AutoTileHistoryEntryItem,
  type TileHistoryEntryItem,
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
  type Point,
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
};
