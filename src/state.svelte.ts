import type { ProjectState, GUIState, TileLayer } from "./types";

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
  ],
    tilesets: [],
    images: [],
    scripts: [{name: "script1.js", content: "woop"}],
    ruleTiles: [],
    areas: []
});


