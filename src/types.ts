
type ProjectState = {
    projectName: string,
    tileSize: number,
    layers: Layer[],
    tilesets: Tileset[],
    scripts: Script[],
    images: Image[],
    ruleTiles: AutoTile[]
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
    type: "image";
    id: number;
    name: string;
    isVisible: boolean;
    data: (ImageRef & Point & {isSelected: boolean})[]; 
};

type TileLayer = {
    type: "tile";
    id: number;
    name: string;
    data: Map<string, TileRef>,
    isVisible: boolean;
};

type AreaLayer = {
    type: "area";
    id: number;
    name: string;
    data: PlacedArea[];
    isVisible: boolean;
};

type Layer = TileLayer | ImageLayer | AreaLayer;

type ConnectedTileRequirement = "required" | "excluded" | "optional";

type AutoTile = {
  name: string;
  rules: TileRule[];
}

type TileRef = {
  tileIdx: number;
  tilesetIdx: number;
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

type AutoTileRef = {
    index: number;
}

type ImageRef = {
    index: number;
}

type TileAsset = {
    type: "tile";
    ref: TileRef;
};

type ImageAsset = {
    type: "image";
    ref: ImageRef;
};

type AutoTileAsset = {
    type: "auto-tile";
    ref: AutoTileRef;
};

type SelectedAsset = TileAsset | ImageAsset | AutoTileAsset;

type GUIState = {
    notification: Notification | null;
    selectedTool: "paint" | "erase";
    selectedAsset: SelectedAsset | null;
    selectedLayer: number;
    showGrid: boolean;
    gridColor: string;
    workspaceTabs: {value: number, label: string}[],
    selectedWorkspaceTab: string,
}


type Notification = {
    variant: "primary" | "success" | "neutral" | "warning" | "danger",
    title: string;
    msg: string;
}


export { type Point, type Rect, type ProjectState, type GUIState, type Notification, type Layer,  type Script, type TileLayer, type ImageLayer, 
      type Image, type ImageRef, type Tileset, type Tile, type AutoTile as RuleTile, type TileRule, type TileRef, type ConnectedTileRequirement, type ConnectedTilesRequirements};