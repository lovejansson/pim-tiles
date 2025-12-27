


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

type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
}


/**
 * 
 * tile layers 
 * 
 * type tile 
 * contains tile assets with type tile 
 * 
 * area layers 
 * contains area assets 
 * 
 * 
 * auto-tile layers
 * contains auto-tile assets
 * 
 * image layers 
 * contains image assets
 * 
 * 
 * 
 */

type PaintType = "tile" | "area" | "auto-tile" | "image";

type TileLayer = {
  id: string;
  type: "tile";
  name: string;
  data:  Map<string, TileAsset>;
  isVisible: boolean;
};
type AreaLayer = {
  id: string;
  type: "area";
  name: string;
  data:  Map<string, AreaAsset>;
  isVisible: boolean;
};


type ImageLayer = {
  id: string;
  type: "image";
  name: string;
  data:  (ImageAsset & Point & { isSelected: boolean })[];
  isVisible: boolean;
};

type AutoTileLayer = {
  id: string;
  type: "auto-tile";
  name: string;
  data:  Map<string, AutoTileAsset & {tileRule: {ref: {id: string}}}>;
  isVisible: boolean;
};

type Layer = TileLayer | AreaLayer | ImageLayer | AutoTileLayer;

type ConnectedTileRequirement = "required" | "excluded" | "optional";

type AutoTile = {
    id: string;
    name: string;
    rules: TileRule[];
}

type ConnectedTilesRequirements = {
    n: ConnectedTileRequirement;
    ne: ConnectedTileRequirement;
    e: ConnectedTileRequirement;
    se: ConnectedTileRequirement;
    s: ConnectedTileRequirement;
    sw: ConnectedTileRequirement;
    w: ConnectedTileRequirement;
    nw: ConnectedTileRequirement;
}

type TileRule = {
    id: string;
    connectedTilesRequirements: ConnectedTilesRequirements,
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
    type: "tile",
    ref: TileRef;
};

type ImageAsset = {
    type: "image",
    ref: IdRef;
};

type AutoTileAsset = {
    type: "auto-tile",
    ref: IdRef;
};

type AreaAsset = {
    type: "area",
    ref: IdRef;
}

type AssetRef = TileAsset | ImageAsset | AutoTileAsset | AreaAsset;

type TilemapEditorState = TileLayerState | AutoTileLayerState | AreaLayerState | ImageLayerState;



type TileLayerState = {
    type: "tile";
    selectedTool: "paint" | "erase";
    selectedLayer: TileLayer;
    selectedAsset: TileRef | null;
    fillToolIsActive: boolean;
}

type AutoTileLayerState = {
    type: "auto-tile";
    selectedTool: "paint" | "erase";
    selectedLayer: AutoTileLayer;
    selectedAsset: AutoTileAsset | null;
    fillToolIsActive: boolean;
}

type AreaLayerState = {
    type: "area";
    selectedTool: "paint" | "erase";
    selectedLayer: AreaLayer;
    selectedAsset: AreaAsset | null;
    fillToolIsActive: boolean;
}

type ImageLayerState = {
    type: "image";
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
    type:PaintType;
    x: number;
    y: number;
    data: (ImageAsset & Point & { isSelected: boolean });
   layer: IdRef;
}

type TileHistoryEntry = {
    type:"tile";
    row: number;
    col: number;
    data: TileAsset;
    layer: IdRef;
}
type AutoTileHistoryEntry = {
    type:"auto-tile";
    row: number;
    col: number;
    data: AutoTileAsset & {tileRule: {ref: {id: string}}};
     layer: IdRef;
}

type AreaHistoryEntry = {
    type:"area";
    row: number;
    col: number;
    data: AreaAsset;
    layer: IdRef;
}

type HistoryEntry = TileHistoryEntry | AutoTileHistoryEntry | AreaHistoryEntry | ImageHistoryEntry;


export {  type HistoryEntry,type TileHistoryEntry, type AreaHistoryEntry, type ImageHistoryEntry,
 type TilemapEditorState, type AssetRef, type Area, type AreaAsset, type TileAsset, type ImageAsset, type AutoTileAsset, type TileLayerState, type AutoTileLayerState, type AreaLayerState, type ImageLayerState,
    type Point, type Rect, type ProjectState, type GUIState, type Notification, type Layer, type Script, type TileLayer, type ImageLayer,
    type Image, type IdRef, type Tileset, type Tile, type AutoTile, type TileRule, type TileRef, type ConnectedTileRequirement, type ConnectedTilesRequirements
};