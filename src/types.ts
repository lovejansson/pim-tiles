


type ProjectState = {
    projectName: string,
    tileSize: number,
    layers: Layer[],
    tilesets: Tileset[],
    autoTiles: AutoTile[],
    areas: Area[],
}

type Area = {
    id: string;
    color: string;
    name: string;
}

type Tile = {
    id: string;
    dataURL: string;
    bitmap: ImageBitmap;
};

type Tileset = {
    id: string;
    name: string;
    tiles: Tile[];
};

type Point = {
    x: number;
    y: number;
}

type Cell = {
    row: number;
    col: number;
}

type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
}

enum PaintType {
    TILE,
    AREA,
    AUTO_TILE,
}

enum Tool {
    PAINT,
    ERASE,
}


type AssetRefT<T extends PaintType> = {
    type: T,
    ref: T extends PaintType.TILE ? TileRef : IdRef;
}

type LayerData<T extends PaintType> = T extends PaintType.AUTO_TILE ? Map<string, PaintedAssetT<T>>
    : T extends PaintType.AREA ? Map<string, PaintedAssetT<T>>
    : T extends PaintType.TILE ? Map<string, PaintedAssetT<T>>
    : never;

type PaintedAssetT<T extends PaintType> = T extends PaintType.AUTO_TILE ? AssetRefT<T> & { tileRule: IdRef }
    : T extends PaintType.AREA ? AssetRefT<T>
    : T extends PaintType.TILE ? AssetRefT<T>
    : never;

type LayerT<T extends PaintType> = {
    id: string;
    type: T;
    name: string;
    data: LayerData<T>,
    isVisible: boolean;
}

type PaintedTile = PaintedAssetT<PaintType.TILE>;
type PaintedArea = PaintedAssetT<PaintType.AREA>;
type PaintedAutoTile = PaintedAssetT<PaintType.AUTO_TILE>;

type PaintedAsset = PaintedTile | PaintedArea | PaintedAutoTile;

type TileLayer = LayerT<PaintType.TILE>;
type AreaLayer = LayerT<PaintType.AREA>;
type AutoTileLayer = LayerT<PaintType.AUTO_TILE>;

type Layer = TileLayer | AreaLayer | AutoTileLayer;

enum TileRequirement {
    REQUIRED = "required",
    EXCLUDED = "excluded",
    OPTIONAL = "optional"
}

type AutoTile = {
    id: string;
    name: string;
    rules: TileRule[];
    defaultTile: TileAsset;
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
}

type TileRule = {
    id: string;
    connections: TileConnections,
    tile: TileAsset;

}

type TileRef = {
    tile: IdRef;
    tileset: IdRef;
}

type IdRef = {
    id: string;
}

type TileAsset = AssetRefT<PaintType.TILE>;
type AutoTileAsset = AssetRefT<PaintType.AUTO_TILE>;
type AreaAsset = AssetRefT<PaintType.AREA>;

type AssetRef = TileAsset | AutoTileAsset | AreaAsset;

type TilemapEditorState = TileLayerState | AutoTileLayerState | AreaLayerState;


type TileLayerState = {
    type: PaintType.TILE;
    selectedTool: Tool;
    selectedLayer: TileLayer;
    selectedAsset: TileAsset | null;
    fillToolIsActive: boolean;
}

type AutoTileLayerState = {
    type: PaintType.AUTO_TILE;
    selectedTool: Tool;
    selectedLayer: AutoTileLayer;
    selectedAsset: AutoTileAsset | null;
    fillToolIsActive: boolean;
}

type AreaLayerState = {
    type: PaintType.AREA;
    selectedTool: Tool;
    selectedLayer: AreaLayer;
    selectedAsset: AreaAsset | null;
    fillToolIsActive: boolean;
}

type GUIState = {
    notification: Notification | null;
    tilemapEditorState: TilemapEditorState;
    showGrid: boolean;
    gridColor: string;
    workspaceTabs: { value: number | string, label: string }[];
    selectedWorkspaceTab: string;
    history: HistoryEntry[];
    historyIdx: number;
}

type Notification = {
    variant: "primary" | "success" | "neutral" | "warning" | "danger",
    title: string;
    msg: string;
}

type HistoryEntryData<T extends PaintType> = T extends PaintType.AUTO_TILE ? (AssetRefT<PaintType.AUTO_TILE> & { tileRule: IdRef })
    : T extends PaintType.AREA ? (AssetRefT<PaintType.AREA>)
    : T extends PaintType.TILE ? (AssetRefT<PaintType.TILE>)
    : never;

type HistoryEntryItem<T extends PaintType> = {
    data: HistoryEntryData<T> | null,
    pos: Cell,
}

type TileHistoryEntryItem = HistoryEntryItem<PaintType.TILE>;
type AutoTileHistoryEntryItem = HistoryEntryItem<PaintType.AUTO_TILE>;
type AreaHistoryEntryItem = HistoryEntryItem<PaintType.AREA>;


type HistoryEntryT<T extends PaintType> = {
    type: T,
    layer: IdRef,
    items: HistoryEntryItem<T>[]
}

type TileHistoryEntry = HistoryEntryT<PaintType.TILE>;
type AutoTileHistoryEntry = HistoryEntryT<PaintType.AUTO_TILE>;
type AreaHistoryEntry = HistoryEntryT<PaintType.AREA>;


type HistoryEntry = TileHistoryEntry | AutoTileHistoryEntry | AreaHistoryEntry;


export {
    type PaintedTile, type PaintedArea, type PaintedAutoTile, type PaintedAsset, type LayerT, type PaintedAssetT,
    type AreaHistoryEntryItem, type AutoTileHistoryEntryItem, type TileHistoryEntryItem,
    PaintType, Tool, TileRequirement, type HistoryEntry, type TileHistoryEntry, type AreaHistoryEntry,
    type TilemapEditorState, type AssetRef, type Area, type AreaAsset, type TileAsset, type AutoTileAsset, type TileLayerState, type AutoTileLayerState, type AreaLayerState,
    type Point, type Rect, type ProjectState, type GUIState, type Notification, type Layer, type TileLayer, 
    type IdRef, type Tileset, type Tile, type AutoTile, type TileRule, type TileRef, type TileConnections
};