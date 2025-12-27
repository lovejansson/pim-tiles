import type { ProjectState, GUIState, TileLayer, TileRef, IdRef, AssetRef, AreaAsset, TileAsset, ImageAsset, AutoTileAsset, AutoTile, HistoryEntry, Area, Tile, TileRule, Layer, Point } from "./types";
import { getNeighbours } from "./utils";


const DEFAULT_LAYER: TileLayer = {
  id: crypto.randomUUID(),
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
    selectedTool: "paint",
    fillToolIsActive: false
  },
  notification: null,
  gridColor: "#000",
  showGrid: true,
  workspaceTabs: [{ value: -1, label: "tilemap" }],
  selectedWorkspaceTab: "tilemap",
  selectedTile: null,
  history: [],
  historyIdx: 0,

});
type LayerKind = "tile" | "image" | "auto-tile" | "area";

type TypedID<K extends LayerKind> =
  `${K}:${string}`;



class ProjectStateError extends Error {
  constructor(msg: string, public code: string) {
    super(msg);
    this.name = "ProjectStateError";
    this.code = code;
  }
}

function createProjectState() {
  const generateId = () => {
    return crypto.randomUUID();
  }


  const projectState: ProjectState = $state({
    projectName: "My project",
    tileSize: 16,
    layers: [
      DEFAULT_LAYER,
      {
        id: generateId(),
        name: "stuff",
        data: [], isVisible: true, type: "image"
      },
      {
        id: generateId(),
        name: "zones",
        data: new Map(),
        isVisible: false,
        type: "area",
      },
      {
        id: generateId(),
        name: "walls",
        data: new Map(),
        isVisible: false,
        type: "auto-tile",
      },
    ],

    tilesets: [],
    images: [],
    scripts: [{ id: "id", name: "script1.js", content: "woop" }],
    autoTiles: [],
    areas: [],
  });



  /**
   * TODO: separera delarna så att det skapas olika APIer för olika data typer 
   * 
   * TODO: Modda input parameters så det känns genomtänkt och användbart
   * 
   */

  const api = {

    tileSize: projectState.tileSize,
    projectName: projectState.projectName,

    tilesets: {
      get() {
        return projectState.tilesets;
      },
      getTileset(id: string) {
        const tileset = projectState.tilesets.find(t => t.id === id);
        if (tileset === undefined) throw new ProjectStateError("Tileset not found", "not-found");
        return tileset;
      },
      getTile(tilesetId: string, tileId: string): Tile {
        const tileset = projectState.tilesets.find(ts => ts.id === tilesetId);
        if (!tileset) throw new ProjectStateError("Tileset not found", "not-found");

        const tile = tileset.tiles.find(t => t.id === tileId);
        if (!tile) throw new ProjectStateError("Tile not found", "not-found");

        return tile;
      },
      add(name: string, tiles: Tile[]) {
        projectState.tilesets.push({
          id: generateId(),
          name: name,
          tiles: tiles,
        });
      },
      delete(id: string) {

        const idx = projectState.tilesets.findIndex(t => t.id === id);

        if (idx === -1) throw new ProjectStateError("Tileset not found", "not-found");

        const tileset = projectState.tilesets[idx];

        const isUsedInTileLayer = projectState.layers.find(l => {
          if (l.type === "tile") {
            if (l.data.values().find(a => a.type === "tile" && a.ref.tileset.id === tileset.id)) return true;
          }
          return false;
        }) !== undefined;

        const isUsedInAutoTile = projectState.autoTiles.find(a => a.rules.find(r => r.tile?.ref.tileset.id === tileset.id) !== undefined) !== undefined;

        if (isUsedInTileLayer || isUsedInAutoTile) throw new ProjectStateError("Tileset is referenced in project", "asset-in-use");

        projectState.tilesets.splice(idx, 1);
      }
    },

    areas: {
      get() {
        return projectState.areas;
      },
      getArea(id: string) {
        const area = projectState.areas.find(a => a.id === id);
        if (area === undefined) throw new ProjectStateError("Area not found", "not-found");
        return area;
      },
      add(name: string, color: string) {
        projectState.areas.push({
          id: generateId(),
          name: name,
          color: color,
        });
      },
      update(id: string, name: string, color: string) {
        const idx = projectState.areas.findIndex(a => a.id === id);
        if (idx === -1) throw new ProjectStateError("Area not found", "not-found");
        projectState.areas[idx] = { ...projectState.areas[idx], name, color };

      },
      delete(id: string) {
        const idx = projectState.areas.findIndex(a => a.id === id);
        if (idx === -1) throw new ProjectStateError("Area not found", "not-found");
        const area = projectState.areas[idx];

        const isUsed = projectState.layers.find(l => {
          if (l.type === "area") {
            if (l.data.values().find(a => a.type === "area" && a.ref.id === area.id)) return true;
          }
          return false;
        }) !== undefined;


        if (isUsed) throw new ProjectStateError("Area is referenced in project", "asset-in-use");


        projectState.areas.splice(idx, 1);
      }
    },

    images: {
      get() {
        return projectState.images;
      },
      getImage(id: string) {
        const image = projectState.images.find(i => i.id === id);
        if (image === undefined) throw new ProjectStateError("Image not found", "not-found");
        return image;
      },
      add(filename: string, dataURL: string, bitmap: ImageBitmap, width: number, height: number) {
        projectState.images.push({
          id: generateId(),
          filename: filename,
          dataURL: dataURL,
          bitmap: bitmap,
          width: width,
          height: height,
        });
      },
      delete(id: string) {
        const idx = projectState.images.findIndex(i => i.id === id);
        if (idx === -1) throw new ProjectStateError("Image not found", "not-found");

        const image = projectState.images[idx];

        const isUsed = projectState.layers.find(l => {
          if (l.type === "image") {
            if (l.data.values().find(a => a.type === "image" && a.ref.id === image.id)) return true;
          }
          return false;
        }) !== undefined;


        if (isUsed) throw new ProjectStateError("Image is referenced in project", "asset-in-use");
        projectState.images.splice(idx, 1);
      }
    },

    autoTiles: {
      get() {
        return projectState.autoTiles;
      },
      getAutoTile(id: string) {
        const autoTile = projectState.autoTiles.find(at => at.id === id);
        if (autoTile === undefined) throw new ProjectStateError("Autotile not found", "not-found");
        return autoTile;
      },
      add(name: string, rules: TileRule[]) {
        projectState.autoTiles.push({
          id: generateId(),
          name: name,
          rules: rules,
        });
      },
      update(id: string, autoTile: Omit<AutoTile, "id">) {
        const idx = projectState.autoTiles.findIndex(at => at.id === id);
        if (idx === -1) throw new ProjectStateError("Autotile not found", "not-found");
        projectState.autoTiles[idx] = { id, ...autoTile };

      },
      delete(id: string) {
        const idx = projectState.autoTiles.findIndex(at => at.id === id);
        if (idx === -1) throw new ProjectStateError("Autotile not found", "not-found");


        const autoTile = projectState.autoTiles[idx];

        const isUsed = projectState.layers.find(l => {
          if (l.type === "auto-tile") {
            if (l.data.values().find(a => a.type === "auto-tile" && a.ref.id === autoTile.id)) return true;
          }
          return false;
        }) !== undefined;
        if (isUsed) throw new ProjectStateError("Autotile is referenced in project", "asset-in-use");
        projectState.autoTiles.splice(idx, 1);
      },
      selectTileRule(row: number, col: number, autoTile: AutoTile, layerId: string) {

        const n = api.layers.getTileAt(row - 1, col, layerId);
        const ne = api.layers.getTileAt(row - 1, col + 1, layerId);
        const e = api.layers.getTileAt(row, col + 1, layerId);
        const se = api.layers.getTileAt(row + 1, col + 1, layerId);
        const s = api.layers.getTileAt(row + 1, col, layerId);
        const sw = api.layers.getTileAt(row + 1, col - 1, layerId);
        const w = api.layers.getTileAt(row, col - 1, layerId);
        const nw = api.layers.getTileAt(row + 1, col - 1, layerId);

        const connections = {
          n: n !== null && n.type === "auto-tile" && n.ref.id === autoTile.id,
          ne: ne !== null && ne.type === "auto-tile" && ne.ref.id === autoTile.id,
          e: e !== null && e.type === "auto-tile" && e.ref.id === autoTile.id,
          se: se !== null && se.type === "auto-tile" && se.ref.id === autoTile.id,
          s: s !== null && s.type === "auto-tile" && s.ref.id === autoTile.id,
          sw: sw !== null && sw.type === "auto-tile" && sw.ref.id === autoTile.id,
          w: w !== null && w.type === "auto-tile" && w.ref.id === autoTile.id,
          nw: nw !== null && nw.type === "auto-tile" && nw.ref.id === autoTile.id,
        };

        const rules = autoTile.rules.filter((tr) => {

          return (
            ((tr.connectedTilesRequirements.n === "required" && connections.n) ||
              (tr.connectedTilesRequirements.n === "excluded" && !connections.n) ||
              tr.connectedTilesRequirements.n === "optional") &&
            ((tr.connectedTilesRequirements.ne === "required" && connections.ne) ||
              (tr.connectedTilesRequirements.ne === "excluded" &&
                !connections.ne) ||
              tr.connectedTilesRequirements.ne === "optional") &&
            ((tr.connectedTilesRequirements.e === "required" && connections.e) ||
              (tr.connectedTilesRequirements.e === "excluded" && !connections.e) ||
              tr.connectedTilesRequirements.e === "optional") &&
            ((tr.connectedTilesRequirements.se === "required" && connections.se) ||
              (tr.connectedTilesRequirements.se === "excluded" &&
                !connections.se) ||
              tr.connectedTilesRequirements.se === "optional") &&
            ((tr.connectedTilesRequirements.s === "required" && connections.s) ||
              (tr.connectedTilesRequirements.s === "excluded" && !connections.s) ||
              tr.connectedTilesRequirements.s === "optional") &&
            ((tr.connectedTilesRequirements.sw === "required" && connections.sw) ||
              (tr.connectedTilesRequirements.sw === "excluded" &&
                !connections.sw) ||
              tr.connectedTilesRequirements.sw === "optional") &&
            ((tr.connectedTilesRequirements.w === "required" && connections.w) ||
              (tr.connectedTilesRequirements.w === "excluded" && !connections.w) ||
              tr.connectedTilesRequirements.w === "optional") &&
            ((tr.connectedTilesRequirements.nw === "required" && connections.nw) ||
              (tr.connectedTilesRequirements.nw === "excluded" &&
                !connections.nw) ||
              tr.connectedTilesRequirements.nw === "optional")
          );
        });

        return rules.length > 0 ? rules[Math.floor(Math.random() * rules.length)] : null;
      }

    },

    scripts: {
      get() {
        return projectState.scripts;
      },
      getScript(id: string) {
        const script = projectState.scripts.find(s => s.id === id);
        if (script === undefined) throw new ProjectStateError("Script not found", "not-found");
        return script;
      },
      add(name: string, content: string) {
        projectState.scripts.push({
          id: generateId(),
          name: name,
          content: content,
        });
      },
      delete(id: string) {
        const idx = projectState.scripts.findIndex(s => s.id === id);
        if (idx === -1) throw new ProjectStateError("Script not found", "not-found");
        projectState.scripts.splice(idx, 1);
      }
    },

    layers: {
      get() {
        return projectState.layers;
      },
      set(layers: Layer[]) {
        projectState.layers = layers
      },
      getLayer(id: string): Layer {
        const layer = projectState.layers.find(l => l.id === id);
        if (layer === undefined) throw new ProjectStateError("Layer not found", "not-found");
        return layer;
      },
      add(name: string, type: "tile" | "image" | "auto-tile" | "area") {
        switch (type) {
          case "tile":
            projectState.layers.push({ id: generateId(), name, type, data: new Map(), isVisible: false });
            break;
          case "image":
            projectState.layers.push({ id: generateId(), name, type, data: [], isVisible: false });
            break;
          case "auto-tile":
            projectState.layers.push({ id: generateId(), name, type, data: new Map(), isVisible: false });
            break;
          case "area":
            projectState.layers.push({ id: generateId(), name, type, data: new Map(), isVisible: false });
            break;

        }

      },
      update(id: string, layer: Layer) {
        const idx = projectState.layers.findIndex(l => l.id === id);
        if (idx === -1) throw new ProjectStateError("Layer not found", "not-found");
        projectState.layers[idx] = layer;
      },
      delete(id: string) {
        const idx = projectState.layers.findIndex(l => l.id === id);
        if (idx === -1) throw new ProjectStateError("Layer not found", "not-found");
        projectState.layers.splice(idx, 1);
      },
      getTileAt(row: number, col: number, layerId: string): AssetRef | null {
        const layer = this.getLayer(layerId);

        switch (layer.type) {
          case "tile":
          case "auto-tile":
          case "area":
            return layer.data.get(`${row}:${col}`) || null;
          case "image":
            throw new ProjectStateError("getTileAt not supported for image layers", "not-supported");
        }
      },

      paintTile(row: number, col: number, layerId: string, asset: TileAsset | AreaAsset | AutoTileAsset) {
        const layer = this.getLayer(layerId);
        
        if (layer.type === "image") throw new ProjectStateError("paintTile not supported for image layers", "not-supported");
        if (layer.type !== asset.type) throw new ProjectStateError("type mismatch between layer and asset", "not-supported");
        // cast to as any bc type check between layer and asset is done above
        layer.data.set(`${row}:${col}`, { ...asset } as any);
      },
      paintArea(row: number, col: number, layerId: string, areaAsset: TileAsset | AreaAsset | AutoTileAsset) {
        const layer = this.getLayer(layerId);
        
        if (layer.type === "image") throw new ProjectStateError("paintTile not supported for image layers", "not-supported");
        if (layer.type !== asset.type) throw new ProjectStateError("type mismatch between layer and asset", "not-supported");
        // cast to as any bc type check between layer and asset is done above
        layer.data.set(`${row}:${col}`, { ...asset } as any);
      },
      eraseTile(row: number, col: number, layerId: string) {
        const layer = this.getLayer(layerId);
        if (layer.type !== "tile") throw new ProjectStateError("eraseTile not supported for image layers", "not-supported");
        layer.data.delete(`${row}:${col}`);
      },

      paintImage(x: number, y: number, layerId: string, asset: ImageAsset) {
        const layer = this.getLayer(layerId);

        if (layer.type !== "image") throw new ProjectStateError("paintImage only supported for image layers", "not-supported");

        layer.data.push({ ...asset, x, y, isSelected: false });
      },

      paintWithAutoTile(row: number, col: number, autoTileID: string, layerID: string): void {


        const autoTile = api.autoTiles.getAutoTile(autoTileID);

        const tileRule = api.autoTiles.selectTileRule(row, col, autoTile, layerID);

        const layer = api.layers.getLayer(layerID);

        if (layer.type !== "auto-tile") throw new ProjectStateError("paintWithAutoTile only supported for auto-tile layers", "not-supported");


        if (tileRule !== null) {
          layer.data.set(`${row}:${col}`, { type: "auto-tile", ref: {id: autoTileID}, tileRule: { ref: { id: tileRule.id } } });
        } else {
          layer.data.delete(`${row}:${col}`);
        }

        const neighbours = getNeighbours({ row, col }, true);

        for (const n of neighbours) {

          const tileRule = api.autoTiles.selectTileRule(n.row, n.col, autoTile, layerID);

          if (tileRule !== null) {
            layer.data.set(`${n.row}:${n.col}`,  { type: "auto-tile", ref: {id: autoTileID}, tileRule: { ref: { id: tileRule.id } } });
          } else {
            layer.data.delete(`${n.row}:${n.col}`);
          }

        }

      },
      eraseAutoTile(row: number, col: number, layerID: string): void {

        const autoTileAsset = api.layers.getTileAt(row, col, layerID);
        if (autoTileAsset === null) return;
        if (autoTileAsset.type !== "auto-tile") return;

        const autoTile = api.autoTiles.getAutoTile(autoTileAsset.ref.id);

        const layer = api.layers.getLayer(layerID);
        if (layer.type !== "auto-tile") throw new ProjectStateError("eraseAutoTile only supported for auto-tile layers", "not-supported");

        layer.data.delete(`${row}:${col}`);

        const neighbours = getNeighbours({ row, col }, true);

        for (const n of neighbours) {

          const tileRule = api.autoTiles.selectTileRule(n.row, n.col, autoTile, layerID);

          if (tileRule !== null) {
            layer.data.set(`${n.row}:${n.col}`, { ...autoTileAsset, tileRule: { ref: { id: tileRule.id } } });
          } else {
            layer.data.delete(`${n.row}:${n.col}`);
          }

        }

      }

    },
    utils: {
      isSameAsset(a: AssetRef | null, b: AssetRef | null): boolean {

        if (a === null && b === null) return true;

        if (a === null || b === null) return false;

        if (a.type !== b.type) return false;

        switch (a.type) {
          case "tile":
            return a.ref.tile.id === (b as typeof a).ref.tile.id && a.ref.tileset.id === (b as typeof a).ref.tileset.id;
          case "auto-tile":
            return a.ref.id === (b as typeof a).ref.id;
          case "area":
            return a.ref.id === (b as typeof a).ref.id;
          case "image":
            return a.ref.id === (b as typeof a).ref.id;
        }
      }
    }
  }

  return api;
}

export const projectState = createProjectState();

export const HistoryStack = (() => {

  const history: HistoryEntry[] = [];
  let currIdx = 0;

  const restore = () => {

    const entry = history[currIdx];
    if (!entry) return;

    const layer = projectState.layers.getLayer(entry.layer.id);

    if (layer.type !== entry.type) throw new Error("type mismatch between layer and entry");

    if (layer.type === "tile" && entry.type === "tile") layer.data.set(`${entry.row}:${entry.col}`, { ...entry.data });
    if (layer.type === "auto-tile" && entry.type === "auto-tile") layer.data.set(`${entry.row}:${entry.col}`, { ...entry.data });
    if (layer.type === "area" && entry.type === "area") layer.data.set(`${entry.row}:${entry.col}`, { ...entry.data });
    if (layer.type === "image" && entry.type === "image") {
      const idx = layer.data.findIndex(i => i.x === entry.x && i.y === entry.y);
      layer.data[idx] = { ...entry.data };
    }
  };

  return {

    undo() {
      if (currIdx === 0) return;
      currIdx--;
      restore();
    },

    redo() {
      if (currIdx === history.length - 1) return;
      currIdx++;
      restore();
    },

    push(entry: HistoryEntry) {
      if (currIdx !== history.length - 1) {
        history.splice(currIdx + 1);
      }
      history.push(entry);
      currIdx = history.length - 1;
    }
  };

})();
