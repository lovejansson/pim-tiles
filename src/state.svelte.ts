import type { ProjectState, GUIState } from "./types";


export const projectState: ProjectState = $state({
    projectName: "My project",
    tilemap: new Map(),
    tileSize: 16,
    layers: [
      { 
        id:0,
        name: "Layer1", 
          data: [], isVisible: true, type: "image" },
      {
          id:1,
        name: "Layer2",
        data: [],
        isVisible: false,
        type: "tile",
      },
      {
          id:2,
        name: "Layer3",
        data: [],
        isVisible: false,
        type: "image",
      },
  ],
    tilesets: [],
    images: [],
    scripts: [{name: "script1.js", content: "woop"}],
    ruleTiles: []
});


export const guiState: GUIState = $state({
  selectedTool: "paint",
  selectedImageIdx: null,
  notification: null,
  gridColor: "#000",
  showGrid: true,
  workspaceTabs: [{value: -1, label: "tilemap"}], 
  selectedWorkspaceTab: "tilemap", 
})
