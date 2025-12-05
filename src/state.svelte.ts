import type { ProjectState, GUIState } from "./types";

export const projectState: ProjectState = $state({
    projectName: "My project",
    tilemap: [],
    tileSize: 16,
    layers: [
    { name: "Layer1", 
        data: [], isVisible: true, type: "image" },
    {
      name: "Layer2",
      data: [],
      isVisible: false,
      type: "tile",
    },
    {
      name: "Layer3",
      data: [],
      isVisible: false,
      type: "image",
    },
  ],
    tilesets: [],
    images: [],
    scripts: [{name: "script1.js", content: "woop"}]
});


export const guiState: GUIState = $state({
  selectedTool: "paint",
  notification: null,
  gridColor: "#000",
  showGrid: true,
})