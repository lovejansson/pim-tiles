
type ProjectState = {
    projectName: string,
    tileSize: number,
    layers: Layer[],
    tilesets: Tileset[],
    scripts: Script[],
    images: Image[],
    ruleTiles: AutoTile[],
    areas: Area[],
}

type Area = {
    id: number;
    color: string;
    name: string;
}

type Script = {
    name: string;
    content: string;
}

type Tile = {
    dataURL: string;
    bitmap: ImageBitmap;
};

type Tileset = {
    name: string;
    tiles: Tile[];
};

type Image = {
    dataURL: string;
    bitmap: ImageBitmap;
    width: number;
    height: number;
    filename: string;
};

type PlacedArea = {
    x: number;
    y: number;
    areaIdx: number;
}

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

type ImageLayer = {
    id: Symbol;
    type: "image";
    name: string;
    isVisible: boolean;
    data: (IdRef & Point & {isSelected: boolean})[]; 
};

type TileLayer = {
    id: Symbol;
    type: "tile";
    name: string;
    data: Map<string, TileRef>,
    isVisible: boolean;
};

type AreaLayer = {
    id: Symbol;
    type: "area";
    name: string;
    data: Map<string, IdRef>,
    isVisible: boolean;
};

type Layer = TileLayer | ImageLayer | AreaLayer;

type ConnectedTileRequirement = "required" | "excluded" | "optional";

type AutoTile = {
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
  connectedTilesRequirements: ConnectedTilesRequirements,
  tile: TileRef | null; 
}

type TileRef = {
  tileId: number;
  tilesetId: number;
}

type IdRef = {
    id: number;
}

type TileAsset = {
    type: "tile",
    ref: TileRef;
};

type ImageAsset = {
    ref: IdRef;
};

type AutoTileAsset = {
    type: "auto-tile",
    ref: IdRef;
};

type AreaAsset = {
    ref: IdRef;
}

type TilemapEditorState = TileLayerState | AreaLayerState | ImageLayerState;

type TileLayerState = {
    type: "tile";
    selectedTool: "paint" | "erase";
    selectedLayer: TileLayer;
    selectedAsset: TileAsset | AutoTileAsset | null;
}

type AreaLayerState = {
    type: "area";
    selectedTool: "paint" | "erase";
    selectedLayer: AreaLayer;
    selectedAsset: AreaAsset | null;
}

type ImageLayerState = {
    type: "image";
    selectedLayer: ImageLayer;
    selectedAsset: ImageAsset | null;
}

type GUIState = {
    notification: Notification | null;
    tilemapEditorState: TilemapEditorState;
    showGrid: boolean;
    gridColor: string;
    workspaceTabs: {value: number, label: string}[];
    selectedWorkspaceTab: string;
}


type Notification = {
    variant: "primary" | "success" | "neutral" | "warning" | "danger",
    title: string;
    msg: string;
}


export { type TileLayerState, type AreaLayerState, type ImageLayerState,
    type Point, type Rect, type ProjectState, type GUIState, type Notification, type Layer,  type Script, type TileLayer, type ImageLayer, 
      type Image, type IdRef, type Tileset, type Tile, type AutoTile as RuleTile, type TileRule, type TileRef, type ConnectedTileRequirement, type ConnectedTilesRequirements};