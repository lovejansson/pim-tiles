
type ProjectState = {
    projectName: string,
    tilemap: any[],
    tileSize: number,
    layers: Layer[],
    tilesets: Tileset[],
    scripts: Script[],
    images: Image[],
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


type PlacedTile = {
    x: number;
    y: number;
    tileIdx: number;
};

type PlacedImage = {
    x: number;
    y: number;
    imageIdx: number;
};

type PlacedArea = {
    x: number;
    y: number;
    areaIdx: number;
}


type ImageLayer = {
    name: string;
    isVisible: boolean;
    data: PlacedImage[];
    type: "image";
};

type TileLayer = {
    name: string;
    data: PlacedTile[];
    isVisible: boolean;
    type: "tile";
};

type AreaLayer = {
    name: string;
    data: PlacedArea[];
    isVisible: boolean;
    type: "area";
};

type Layer = TileLayer | ImageLayer | AreaLayer;


type GUIState = {
    notification: Notification | null;
    selectedTool: "paint" | "erase" | "fill";
    showGrid: boolean;
    gridColor: string;
}
type Notification = {
    variant: "primary" | "success" | "neutral" | "warning" | "danger",
    title: string;
    msg: string;
}


export { type ProjectState, type GUIState, type Notification, type Layer,  type Script, type TileLayer, type ImageLayer, 
    type PlacedImage,type PlacedTile,  type Image, type Tileset, type Tile};