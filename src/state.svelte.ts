import {
  type ProjectState, type GUIState, type TileLayer, type AssetRef, type ImageAsset, type AutoTile, type HistoryEntry, type Tile, type TileRule, type Layer,
  PaintType, TileRequirement, Tool,
  type PaintedArea,
  type PaintedTile,
  type PaintedAutoTile,
  type AutoTileHistoryEntryItem,
} from "./types";
import { getNeighbours } from "./utils";


const DEFAULT_LAYER: TileLayer = {
  id: crypto.randomUUID(),
  name: "fg",
  data: new Map(),
  isVisible: false,
  type: PaintType.TILE,
};

export const guiState: GUIState = $state({
  tilemapEditorState: {
    type: PaintType.TILE,
    selectedLayer: DEFAULT_LAYER,
    selectedAsset: null,
    selectedTool: Tool.PAINT,
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
        data: [], isVisible: true, type: PaintType.IMAGE
      },
      {
        id: generateId(),
        name: "zones",
        data: new Map(),
        isVisible: false,
        type: PaintType.AREA,
      },
      {
        id: generateId(),
        name: "walls",
        data: new Map(),
        isVisible: false,
        type: PaintType.AUTO_TILE,
      },
    ],

    tilesets: [],
    images: [],
    scripts: [{ id: "id", name: "script1.js", content: "woop" }],
    autoTiles: [],
    areas: [],
  });


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
          if (l.type === PaintType.TILE) {
            if (l.data.values().find(a => a.type === PaintType.TILE && a.ref.tileset.id === tileset.id)) return true;
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
          if (l.type === PaintType.AREA) {
            if (l.data.values().find(a => a.type === PaintType.AREA && a.ref.id === area.id)) return true;
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
          if (l.type === PaintType.IMAGE) {
            if (l.data.values().find(a => a.type === PaintType.IMAGE && a.ref.id === image.id)) return true;
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
          if (l.type === PaintType.AUTO_TILE) {
            if (l.data.values().find(a => a.type === PaintType.AUTO_TILE && a.ref.id === autoTile.id)) return true;
          }
          return false;
        }) !== undefined;
        if (isUsed) throw new ProjectStateError("Autotile is referenced in project", "asset-in-use");
        projectState.autoTiles.splice(idx, 1);
      },
      selectTileRule(row: number, col: number, autoTile: AutoTile, layerID: string) {

        const n = api.layers.getTileAt(row - 1, col, layerID);
        const ne = api.layers.getTileAt(row - 1, col + 1, layerID);
        const e = api.layers.getTileAt(row, col + 1, layerID);
        const se = api.layers.getTileAt(row + 1, col + 1, layerID);
        const s = api.layers.getTileAt(row + 1, col, layerID);
        const sw = api.layers.getTileAt(row + 1, col - 1, layerID);
        const w = api.layers.getTileAt(row, col - 1, layerID);
        const nw = api.layers.getTileAt(row + 1, col - 1, layerID);

        const connections = {
          n: n !== null && n.type === PaintType.AUTO_TILE && n.ref.id === autoTile.id,
          ne: ne !== null && ne.type === PaintType.AUTO_TILE && ne.ref.id === autoTile.id,
          e: e !== null && e.type === PaintType.AUTO_TILE && e.ref.id === autoTile.id,
          se: se !== null && se.type === PaintType.AUTO_TILE && se.ref.id === autoTile.id,
          s: s !== null && s.type === PaintType.AUTO_TILE && s.ref.id === autoTile.id,
          sw: sw !== null && sw.type === PaintType.AUTO_TILE && sw.ref.id === autoTile.id,
          w: w !== null && w.type === PaintType.AUTO_TILE && w.ref.id === autoTile.id,
          nw: nw !== null && nw.type === PaintType.AUTO_TILE && nw.ref.id === autoTile.id,
        };

        const rules = autoTile.rules.filter((tr) => {

          return (
            ((tr.connections.n === TileRequirement.REQUIRED && connections.n) ||
              (tr.connections.n === TileRequirement.EXCLUDED && !connections.n) ||
              tr.connections.n === TileRequirement.OPTIONAL) &&
            ((tr.connections.ne === TileRequirement.REQUIRED && connections.ne) ||
              (tr.connections.ne === TileRequirement.EXCLUDED &&
                !connections.ne) ||
              tr.connections.ne === TileRequirement.OPTIONAL) &&
            ((tr.connections.e === TileRequirement.REQUIRED && connections.e) ||
              (tr.connections.e === TileRequirement.EXCLUDED && !connections.e) ||
              tr.connections.e === TileRequirement.OPTIONAL) &&
            ((tr.connections.se === TileRequirement.REQUIRED && connections.se) ||
              (tr.connections.se === TileRequirement.EXCLUDED &&
                !connections.se) ||
              tr.connections.se === TileRequirement.OPTIONAL) &&
            ((tr.connections.s === TileRequirement.REQUIRED && connections.s) ||
              (tr.connections.s === TileRequirement.EXCLUDED && !connections.s) ||
              tr.connections.s === TileRequirement.OPTIONAL) &&
            ((tr.connections.sw === TileRequirement.REQUIRED && connections.sw) ||
              (tr.connections.sw === TileRequirement.EXCLUDED &&
                !connections.sw) ||
              tr.connections.sw === TileRequirement.OPTIONAL) &&
            ((tr.connections.w === TileRequirement.REQUIRED && connections.w) ||
              (tr.connections.w === TileRequirement.EXCLUDED && !connections.w) ||
              tr.connections.w === TileRequirement.OPTIONAL) &&
            ((tr.connections.nw === TileRequirement.REQUIRED && connections.nw) ||
              (tr.connections.nw === TileRequirement.EXCLUDED &&
                !connections.nw) ||
              tr.connections.nw === TileRequirement.OPTIONAL)
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
      add(name: string, type: PaintType) {
        switch (type) {
          case PaintType.TILE:
            projectState.layers.push({ id: generateId(), name, type, data: new Map(), isVisible: false });
            break;
          case PaintType.IMAGE:
            projectState.layers.push({ id: generateId(), name, type, data: [], isVisible: false });
            break;
          case PaintType.AUTO_TILE:
            projectState.layers.push({ id: generateId(), name, type, data: new Map(), isVisible: false });
            break;
          case PaintType.AREA:
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

      getTileAt(row: number, col: number, layerID: string): AssetRef | null {
        const layer = this.getLayer(layerID);

        if (layer.type === PaintType.IMAGE) throw new ProjectStateError("getTileAt not supported for image layers", "not-supported");

        return layer.data.get(`${row}:${col}`) || null;
      },

      paintTile(row: number, col: number, layerID: string, paint: PaintedTile | PaintedArea | PaintedAutoTile) {

        const layer = this.getLayer(layerID);

        if (layer.type === PaintType.IMAGE) throw new ProjectStateError("paintTile not supported for image layers", "not-supported");
        if (layer.type !== paint.type) throw new ProjectStateError("type mismatch between layer and asset", "type-error");

        // TODO: can this be done better with typescript generics?
        layer.data.set(`${row}:${col}`, { ...paint } as any);
      },

      eraseTile(row: number, col: number, layerID: string) {
        const layer = this.getLayer(layerID);
        if (layer.type === PaintType.IMAGE) throw new ProjectStateError("eraseTile not supported for image layers", "not-supported");
        layer.data.delete(`${row}:${col}`);
      },

      // restore an image at a specifi

      paintImage(x: number, y: number, layerID: string, asset: ImageAsset): void {
        const layer = this.getLayer(layerID);
        if (layer.type !== PaintType.IMAGE) throw new ProjectStateError("paintImage only supported for image layers", "not-supported");

        layer.data.push({ ...asset, x, y, isSelected: false, id: generateId() });
      },

      eraseImage(x: number, y: number, layerID: string) {
        const layer = this.getLayer(layerID);

        if (layer.type !== PaintType.IMAGE) throw new ProjectStateError("eraseImage only supported for image layers", "not-supported");

        // TODO: bug if image are placed on top of eachother

        const idx = layer.data.findIndex(i => i.x === x && i.y === y);

        if (idx === -1) throw new ProjectStateError("Image not found", "not-found");

        layer.data.splice(idx, 1);

      },

      paintWithAutoTile(row: number, col: number, autoTileID: string, layerID: string): AutoTileHistoryEntryItem[] {

        const autoTile = api.autoTiles.getAutoTile(autoTileID);

        const tileRule = api.autoTiles.selectTileRule(row, col, autoTile, layerID);

        const layer = api.layers.getLayer(layerID);

        if (layer.type !== PaintType.AUTO_TILE) throw new ProjectStateError("paintWithAutoTile only supported for auto-tile layers", "not-supported");

        const paintedTiles: AutoTileHistoryEntryItem[] = [];

        if (tileRule !== null) {

          paintedTiles.push({ pos: { row, col }, data: { type: PaintType.AUTO_TILE, ref: { id: autoTileID }, tileRule: { id: tileRule.id } } });

          layer.data.set(`${row}:${col}`, { type: PaintType.AUTO_TILE, ref: { id: autoTileID }, tileRule: { id: tileRule.id } });
        }

        const neighbours = getNeighbours({ row, col }, true);

        for (const n of neighbours) {

          const tileRule = api.autoTiles.selectTileRule(n.row, n.col, autoTile, layerID);

          if (tileRule !== null) {
            paintedTiles.push({ pos: { row: n.row, col: n.col }, data: { type: PaintType.AUTO_TILE, ref: { id: autoTileID }, tileRule: { id: tileRule.id } } });
            layer.data.set(`${n.row}:${n.col}`, { type: PaintType.AUTO_TILE, ref: { id: autoTileID }, tileRule: { id: tileRule.id } });
          } else {
            layer.data.delete(`${n.row}:${n.col}`);
          }

        }

        return paintedTiles;

      },
      eraseAutoTile(row: number, col: number, layerID: string): AutoTileHistoryEntryItem[] {

        const autoTileAsset = api.layers.getTileAt(row, col, layerID);
        if (autoTileAsset === null) return [];

        if (autoTileAsset.type !== PaintType.AUTO_TILE) return [];

        const autoTile = api.autoTiles.getAutoTile(autoTileAsset.ref.id);

        const layer = api.layers.getLayer(layerID);

        if (layer.type !== PaintType.AUTO_TILE) throw new ProjectStateError("eraseAutoTile only supported for auto-tile layers", "not-supported");

        const paintedTiles: AutoTileHistoryEntryItem[] = [];

        layer.data.delete(`${row}:${col}`);
        paintedTiles.push({ pos: { row: row, col: col }, data: null });

        const neighbours = getNeighbours({ row, col }, true);

        for (const n of neighbours) {

          const tileRule = api.autoTiles.selectTileRule(n.row, n.col, autoTile, layerID);

          if (tileRule !== null) {
            paintedTiles.push({ pos: { row: n.row, col: n.col }, data: { ...autoTileAsset, tileRule: { id: tileRule.id } } });

            layer.data.set(`${n.row}:${n.col}`, { ...autoTileAsset, tileRule: { id: tileRule.id } });

          } else {

            paintedTiles.push({ pos: { row: n.row, col: n.col }, data: null });

            layer.data.delete(`${n.row}:${n.col}`);

          }
        }

        return paintedTiles;

      }

    },
    utils: {
      isSameAsset(a: AssetRef | null, b: AssetRef | null): boolean {

        if (a === null && b === null) return true;

        if (a === null || b === null) return false;

        if (a.type !== b.type) return false;

        switch (a.type) {
          case PaintType.TILE:
            return a.ref.tile.id === (b as typeof a).ref.tile.id && a.ref.tileset.id === (b as typeof a).ref.tileset.id;
          case PaintType.AUTO_TILE:
            return a.ref.id === (b as typeof a).ref.id;
          case PaintType.AREA:
            return a.ref.id === (b as typeof a).ref.id;
          case PaintType.IMAGE:
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

    

    switch (entry.type) {
      case PaintType.TILE:
      case PaintType.AUTO_TILE:
      case PaintType.AREA:
        for (const i of entry.items) {
          if (i.data) {
            
            projectState.layers.paintTile(i.pos.row, i.pos.col, entry.layer.id, { ...i.data });
          } else {
            projectState.layers.eraseTile(i.pos.row, i.pos.col, entry.layer.id);
          }
        }
        break;
      case PaintType.IMAGE:
        for (const i of entry.items) {
          if (i.data) {
            projectState.layers.paintImage(i.pos.x, i.pos.y, entry.layer.id, { ...i.data });
          } else {
            projectState.layers.eraseImage(i.pos.x, i.pos.y, entry.layer.id);
          }
        }
        break;
    }
  };

  return {

    undo() {
      console.log("UNDO")
      if (currIdx === 0) return;
      currIdx--;
      restore();
    },

    redo() {
       console.log("REDo")
      if (currIdx === history.length - 1) return;
      currIdx++;
      restore();
    },

    push(entry: HistoryEntry) {
            console.log("BUSH")
      if (currIdx !== history.length - 1) {
        history.splice(currIdx + 1);
      }
      history.push(entry);
      currIdx = history.length - 1;
    }
  };

})();
