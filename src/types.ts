
type AppState = {
    projectName: string,
    tilemap: any[],
    settings: {
        gridColor: string,
        tileSize: number,
        showGrid: boolean,
    },
    selectedTool: "paint" | "erase" | "fill",
    layers: Layer[],
    scripts: Script[],
    images: Image[],
}

type Script = {
    name: string;
    content: string;
}

type Tile = {
data: string;
};

type Tileset = {
name: string;
tiles: Tile[];
};

type Image = {
    data: string;
    width: number;
    height: number;
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


export { type AppState, type Layer,  type Script, type TileLayer, type ImageLayer, 
    type PlacedImage,type PlacedTile,  type Image, type Tileset, type Tile};