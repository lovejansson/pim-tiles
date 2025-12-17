import type { ProjectState, GUIState } from "./types";


export const projectState: ProjectState = $state({
    projectName: "My project",
    tileSize: 16,
    layers: [
      { 
        id:0,
        name: "Layer1", 
          data: [], isVisible: true, type: "image" },
      {
          id:1,
        name: "Layer2",
        data: new Map(),
        isVisible: false,
        type: "tile",
      },
      {
        id:2,
        name: "Layer3",
        data: [],
        isVisible: false,
        type: "area",
      },
  ],
    tilesets: [],
    images: [],
    scripts: [{name: "script1.js", content: "woop"}],
    ruleTiles: []
});


export const guiState: GUIState = $state({
  selectedTool: "paint",
  selectedAsset: null,
  selectedLayer: 0,
  notification: null,
  gridColor: "#000",
  showGrid: true,
  workspaceTabs: [{value: -1, label: "tilemap"}], 
  selectedWorkspaceTab: "tilemap", 
  selectedTile: null
})
