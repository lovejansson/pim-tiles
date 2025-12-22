import type { ProjectState, GUIState, TileLayer, TileRef, IdRef } from "./types";

const DEFAULT_LAYER: TileLayer = {
        id: Symbol(),
        name: "fg",
        data: new Map(),
        isVisible: false,
        type: "tile",
};

export const guiState: GUIState = $state({
    tilemapEditorState: {
      type: "tile", 
      selectedLayer: DEFAULT_LAYER, 
      selectedAsset: null, 
      selectedTool: "paint"
    },
    notification: null,
    gridColor: "#000",
    showGrid: true,
    workspaceTabs: [{value: -1, label: "tilemap"}], 
    selectedWorkspaceTab: "tilemap", 
    selectedTile: null
});

export const projectState: ProjectState = $state({
    projectName: "My project",
    tileSize: 16,
    layers: [
      DEFAULT_LAYER,
      { 
             id: Symbol(),
        name: "stuff", 
          data: [], isVisible: true, type: "image" },
      {
             id: Symbol(),
        name: "zones",
        data: new Map(),
        isVisible: false,
        type: "area",
      },
  ] ,
    tilesets: [],
    images: [],
    scripts: [{name: "script1.js", content: "woop"}],
    ruleTiles: [],
    areas: []
});

export function getTileByRef(tileRef: TileRef) {
    const tileset = projectState.tilesets.find(ts => ts.id === tileRef.tileset.id);
    if(!tileset) throw new Error("Tileset not found");

    const tile = tileset.tiles.find(t => t.id === tileRef.tile.id);
    if(!tile) throw new Error("Tile not found");

    return tile;
}

export function getAreaByRef(areaRef: IdRef) {
    const area = projectState.areas.find(a => a.id === areaRef.id);
    if(!area) throw new Error("Area not found");

    return area;
}

export function getImageByRef(imageRef: IdRef) {
    const image = projectState.images.find(img => img.id === imageRef.id);
    if(!image) throw new Error("Image not found");

    return image;
}

/**
 * ID, in editor och export 
 * 
 * tilemap: string eller image,
 * 
 * tilelayers: [{name: string, data: Map<position, tileData>, zIndex: number}],
 * 
 * areas: [{name: string, data: Map<position, areaData>, zIndex: number}],
 * 
 * objects: [{name: string, position: {x,y}, properties: {}, zIndex: number}],
 */


