


type ProjectState = {
    projectName: string,
    tileSize: number,
    layers: Layer[],
    tilesets: Tileset[],
    scripts: Script[],
    images: Image[],
    autoTiles: AutoTile[],
    areas: Area[],
}

type Area = {
    id: string;
    color: string;
    name: string;
}

type Script = {
    id: string;
    name: string;
    content: string;
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

type Image = {
    id: string;
    dataURL: string;
    bitmap: ImageBitmap;
    width: number;
    height: number;
    filename: string;
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
    IMAGE
}

enum Tool {
    PAINT,
    ERASE,
}

type TileLayer = {
  id: string;
  type: PaintType.TILE;
  name: string;
  data:  Map<string, TileAsset>;
  isVisible: boolean;
};
type AreaLayer = {
  id: string;
  type: PaintType.AREA;
  name: string;
  data:  Map<string, AreaAsset>;
  isVisible: boolean;
};


type ImageLayer = {
  id: string;
  type: PaintType.IMAGE;
  name: string;
  data:  (ImageAsset & Point & { isSelected: boolean })[];
  isVisible: boolean;
};

type AutoTileLayer = {
  id: string;
  type: PaintType.AUTO_TILE;
  name: string;
  data:  Map<string, AutoTileAsset & {tileRule: {ref: {id: string}}}>;
  isVisible: boolean;
};

type Layer = TileLayer | AreaLayer | ImageLayer | AutoTileLayer;

enum TileRequirement {
    REQUIRED,
    EXCLUDED,
    OPTIONAL
}

type AutoTile = {
    id: string;
    name: string;
    rules: TileRule[];
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
    tile: TileAsset | null;
}

type TileRef = {
    tile: IdRef;
    tileset: IdRef;
}

type IdRef = {
    id: string;
}

type TileAsset = {
    type: PaintType.TILE,
    ref: TileRef;
};

type ImageAsset = {
    type: PaintType.IMAGE,
    ref: IdRef;
};

type AutoTileAsset = {
    type: PaintType.AUTO_TILE,
    ref: IdRef;
};

type AreaAsset = {
    type: PaintType.AREA,
    ref: IdRef;
}

type AssetRef = TileAsset | ImageAsset | AutoTileAsset | AreaAsset;

type TilemapEditorState = TileLayerState | AutoTileLayerState | AreaLayerState | ImageLayerState;

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

type ImageLayerState = {
    type: PaintType.IMAGE;
    selectedLayer: ImageLayer;
    selectedAsset: ImageAsset | null;
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


type ImageHistoryEntry = {
    type:PaintType.IMAGE;
    data: (ImageAsset & Point & { isSelected: boolean });
    layer: IdRef;
}

type TileHistoryEntry = {
    type:PaintType.TILE;
    data: (TileAsset & Cell)[];
    layer: IdRef;
}

type AutoTileHistoryEntry = {
    type:PaintType.AUTO_TILE;
    data: (AutoTileAsset & Cell & {tileRule: {ref: {id: string}}})[];
    layer: IdRef;
}

type AreaHistoryEntry = {
    type:PaintType.AREA;
    data: (AreaAsset & Cell)[];
    layer: IdRef;
}

type HistoryEntry = TileHistoryEntry | AutoTileHistoryEntry | AreaHistoryEntry | ImageHistoryEntry;


export {PaintType, Tool,TileRequirement,  type HistoryEntry,type TileHistoryEntry, type AreaHistoryEntry, type ImageHistoryEntry,
 type TilemapEditorState, type AssetRef, type Area, type AreaAsset, type TileAsset, type ImageAsset, type AutoTileAsset, type TileLayerState, type AutoTileLayerState, type AreaLayerState, type ImageLayerState,
    type Point, type Rect, type ProjectState, type GUIState, type Notification, type Layer, type Script, type TileLayer, type ImageLayer,
    type Image, type IdRef, type Tileset, type Tile, type AutoTile, type TileRule, type TileRef, type TileConnections 
};