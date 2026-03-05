
type Tile = {
  tilesetId: string;
  tilesetPos: Point;
};

type Tileset = {
  id: string;
  name: string;
  width: number;
  height: number;
  spritesheet: ImageBitmap;
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
  id: string;
};

type AssetRefT<T extends PaintType> = {
  type: T;
  ref: T extends PaintType.TILE ? Tile : IdRef;
};

type PaintedAssetT<T extends PaintType> = T extends PaintType.AUTO_TILE
  ? AssetRefT<T> & { selectedTileRuleId: IdRef | null }
  : AssetRefT<T>;

type LayerDataT<T extends PaintType> = (PaintedAssetT<T> | null)[][];

type LayerData =
  | LayerDataT<PaintType.TILE>
  | LayerDataT<PaintType.AUTO_TILE>

type LayerT<T extends PaintType> = {
  id: string;
  type: T;
  name: string;
};

type PaintedTile = PaintedAssetT<PaintType.TILE>;
type PaintedAutoTile = PaintedAssetT<PaintType.AUTO_TILE>;

type PaintedAsset = PaintedTile | PaintedAutoTile;

type TileLayer = LayerT<PaintType.TILE>;
type AutoTileLayer = LayerT<PaintType.AUTO_TILE>;

type Layer = TileLayer | AutoTileLayer;

enum TileRequirement {
  REQUIRED = "required",
  EXCLUDED = "excluded",
  OPTIONAL = "optional",
}

type AutoTile = {
  id: string;
  name: string;
  rules: TileRule[];
  defaultTile: TileAsset;
};

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

type TilemapEditorState = TileLayerState | AutoTileLayerState;

type TileLayerState = {
  type: PaintType.TILE;
  selectedTool: Tool;
  selectedLayer: string;
  selectedAsset: TileAsset[] | null;
  fillToolIsActive: boolean;
};

type AutoTileLayerState = {
  type: PaintType.AUTO_TILE;
  selectedTool: Tool;
  selectedLayer: string;
  selectedAsset: AutoTileAsset | null;
  fillToolIsActive: boolean;
};


type GUIState = {
  notification: Notification | null;
  tilemapEditorState: TilemapEditorState;
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
  layers: (Layer & { data: LayerData })[];
  tilesets: (Omit<Tileset, "spritesheet"> & { spritesheet: string })[];
  autoTiles: AutoTile[];
  attributes: { pos: Point; attributes: { [key: string]: any } }[]; // An array of tiles positions with attributes
};

type Notification = {
  variant: "primary" | "success" | "neutral" | "warning" | "danger";
  title: string;
  msg: string;
};

type HistoryEntryData<T extends PaintType> = PaintedAssetT<T>;

type HistoryEntryItem<T extends PaintType> = {
  data: HistoryEntryData<T> | null;
  pos: Cell;
};

type TileHistoryEntryItem = HistoryEntryItem<PaintType.TILE>;
type AutoTileHistoryEntryItem = HistoryEntryItem<PaintType.AUTO_TILE>;

type HistoryEntryT<T extends PaintType> = {
  type: T;
  layer: IdRef;
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
  type LayerT,
  type PaintedAssetT,
  type AutoTileHistoryEntryItem,
  type TileHistoryEntryItem,
  type LayerData,
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
  type TileLayerState,
  type AutoTileLayerState,
  type Point,
  type Rect,
  type GUIState,
  type Notification,
  type Layer,
  type TileLayer,
  type Tileset,
  type Tile,
  type AutoTile,
  type TileRule,
  type TileConnections,
  type Cell,
  type IdRef,
};
