import type { AppState } from "./types";

export const appState: AppState = $state({
    projectName: "My project",
    tilemap: [],
    settings: {
        gridColor: "#000",
        tileSize: 16,
        showGrid: true,
    },
    selectedTool: "paint",
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
    images: [],
    scripts: [{name: "script1.js", content: "woop"}]
});
