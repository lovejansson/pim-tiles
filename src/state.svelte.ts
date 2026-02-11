import {
  type ProjectState,
  type GUIState,
  type TileLayer,
  type AssetRef,
  type AutoTile,
  type HistoryEntry,
  type Tile,
  type TileRule,
  type Layer,
  PaintType,
  TileRequirement,
  Tool,
  type PaintedAutoTile,
  type AutoTileHistoryEntryItem,
  type TileAsset,
  type PaintedAsset,
  type Point,
  type ProjectJSON,
  type Tileset,
} from "./types";
import {
  getNeighbours,
  createOffScreenCanvas,
  bitmapToDataURL,
  dataURLToBitmap,
} from "./utils";

const DEFAULT_LAYER: TileLayer = {
  id: crypto.randomUUID(),
  name: "bg",
  data: new Map(),
  type: PaintType.TILE,
};

export const guiState: GUIState = $state({
  tilemapEditorState: {
    type: PaintType.TILE,
    selectedLayer: DEFAULT_LAYER.id,
    selectedAsset: null,
    selectedTool: Tool.PAINT,
    fillToolIsActive: false,
  },
  notification: null,
  gridColor: "#000",
  showGrid: true,
  history: [],
  historyIdx: 0,
  mouseTile: { row: 0, col: 0 },
  mouseTileDelta: { row: 0, col: 0 },
  visibleLayers: {},
});

export const selectedTiles: TileAsset[] = [];

export function setSelectedTiles(selectedTiles: TileAsset[]) {
  selectedTiles = selectedTiles;
}

class ProjectStateError extends Error {
  constructor(
    msg: string,
    public code: string,
  ) {
    super(msg);
    this.name = "ProjectStateError";
    this.code = code;
  }
}

type ProjectStateChangeEvent = { prev: HistoryEntry; next: HistoryEntry };

class ProjectStateEventEmitter extends EventTarget {
  emit(event: ProjectStateChangeEvent) {
    this.dispatchEvent(
      new CustomEvent("project-state-change", { detail: event }),
    );
  }
}

const projectStateChangeEvents = new ProjectStateEventEmitter();

export const projectState = (() => {
  function generateId() {
    return crypto.randomUUID();
  }

  async function isValidProjectState(p: any): Promise<boolean> {
    if (!Array.isArray(p.autoTiles))
      throw new TypeError("ProjectState: invalid type autoTiles");
    if (!Array.isArray(p.tilesets))
      throw new TypeError("ProjectState: invalid type tilesets");
    if (!Array.isArray(p.layers))
      throw new TypeError("ProjectState: invalid type layers");
    if (!Array.isArray(p.areas))
      throw new TypeError("ProjectState: invalid type areas");

    if (typeof p.projectName !== "string")
      throw new TypeError(
        `ProjectState: invalid type projectName expected string got ${typeof p.projectname}`,
      );
    if (typeof p.tileSize !== "number")
      throw new TypeError(
        `ProjectState: invalid type tileSize expected number got ${typeof p.tileSize}`,
      );

    // TODO: continue parsing the saved object to check if it is a valid project state further along when final data structure is determined

    p.tilesets = await Promise.all(
      p.tilesets.map(async (t: any) => ({
        ...t,
        spritesheet: await dataURLToBitmap(t.spritesheet),
      })),
    );
    p.layers = p.layers.map((l: any) => ({ ...l, data: new Map(l.data) }));
    return true;
  }

  async function getProjectStateFromLocalStorage(): Promise<ProjectState | null> {
    try {
      const projectLocalStorage = localStorage.getItem("project");

      if (projectLocalStorage === null) {
        return null;
      }
      const parsed = JSON.parse(projectLocalStorage);
      await isValidProjectState(parsed);
      console.log(parsed);
      return parsed;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  let isInitialized = $state(false);

  let projectState: ProjectState = $state({
    projectName: "My project",
    tileSize: 16,
    layers: [
      DEFAULT_LAYER,
      {
        id: generateId(),
        name: "zones",
        data: new Map(),
        type: PaintType.AREA,
      },
      {
        id: generateId(),
        name: "grass",
        data: new Map(),
        type: PaintType.AUTO_TILE,
      },
      {
        id: generateId(),
        name: "Road",
        data: new Map(),
        type: PaintType.AUTO_TILE,
      },
    ],
    tilesets: [],
    autoTiles: [],
    areas: [],
  });

  // getProjectStateFromLocalStorage().then((res) => {

  //   if (res !== null) projectState = res;
  //   isInitialized = true;
  // });

  const api = {
    tileSize: projectState.tileSize,
    projectName: projectState.projectName,
    isInitialized,
    tilesets: {
      get() {
        return projectState.tilesets;
      },
      getTileset(id: string) {
        const tileset = projectState.tilesets.find((t) => t.id === id);
        if (tileset === undefined)
          throw new ProjectStateError("Tileset not found", "not-found");
        return tileset;
      },

      getTileDataUrl(tilesetId: string, pos: Point): string {
        const tileset = projectState.tilesets.find((ts) => ts.id === tilesetId);

        if (!tileset)
          throw new ProjectStateError("Tileset not found", "not-found");

        if (
          pos.x < 0 ||
          pos.x > tileset.width - projectState.tileSize ||
          pos.y < 0 ||
          pos.y > tileset.height - projectState.tileSize
        )
          throw new ProjectStateError(
            "Tile pos out of bounds",
            "out-of-bounds",
          );

        const ctxTile = createOffScreenCanvas(
          projectState.tileSize,
          projectState.tileSize,
        );
        ctxTile.drawImage(
          tileset.spritesheet,
          pos.x,
          pos.y,
          projectState.tileSize,
          projectState.tileSize,
          0,
          0,
          projectState.tileSize,
          projectState.tileSize,
        );

        return ctxTile.canvas.toDataURL();
      },
      async add(name: string, bitmap: ImageBitmap) {
        const tileset: Tileset = {
          id: generateId(),
          name,
          width: bitmap.width,
          height: bitmap.height,
          spritesheet: bitmap,
        };

        projectState.tilesets.push(tileset);
      },
      delete(id: string) {
        const idx = projectState.tilesets.findIndex((t) => t.id === id);

        if (idx === -1)
          throw new ProjectStateError("Tileset not found", "not-found");

        const tileset = projectState.tilesets[idx];

        const isUsedInTileLayer =
          projectState.layers.find((l) => {
            if (l.type === PaintType.TILE) {
              if (
                l.data
                  .values()
                  .find(
                    (a) =>
                      a.type === PaintType.TILE &&
                      a.ref.tile.tilesetId === tileset.id,
                  )
              )
                return true;
            }
            return false;
          }) !== undefined;

        const isUsedInAutoTile =
          projectState.autoTiles.find(
            (a) =>
              a.rules.find((r) => r.tile?.ref.tile.tilesetId === tileset.id) !==
              undefined,
          ) !== undefined;

        if (isUsedInTileLayer || isUsedInAutoTile)
          throw new ProjectStateError(
            "Tileset is referenced in project",
            "asset-in-use",
          );

        projectState.tilesets.splice(idx, 1);
      },
    },

    areas: {
      get() {
        return projectState.areas;
      },
      getArea(id: string) {
        const area = projectState.areas.find((a) => a.id === id);
        if (area === undefined)
          throw new ProjectStateError("Area not found", "not-found");
        return area;
      },
      add(name: string, color: string) {
        projectState.areas.push({
          id: generateId(),
          name: name,
          color: color,
        });

        const jsoN = JSON.stringify(projectState.areas);

        console.log(jsoN);
      },
      update(id: string, name: string, color: string) {
        const idx = projectState.areas.findIndex((a) => a.id === id);
        if (idx === -1)
          throw new ProjectStateError("Area not found", "not-found");
        projectState.areas[idx] = { ...projectState.areas[idx], name, color };
      },
      delete(id: string) {
        const idx = projectState.areas.findIndex((a) => a.id === id);
        if (idx === -1)
          throw new ProjectStateError("Area not found", "not-found");
        const area = projectState.areas[idx];

        const isUsed =
          projectState.layers.find((l) => {
            if (l.type === PaintType.AREA) {
              if (
                l.data
                  .values()
                  .find(
                    (a) => a.type === PaintType.AREA && a.ref.id === area.id,
                  )
              )
                return true;
            }
            return false;
          }) !== undefined;

        if (isUsed)
          throw new ProjectStateError(
            "Area is referenced in project",
            "asset-in-use",
          );

        projectState.areas.splice(idx, 1);
      },
    },

    autoTiles: {
      get() {
        return projectState.autoTiles;
      },
      getAutoTile(id: string) {
        const autoTile = projectState.autoTiles.find((at) => at.id === id);
        if (autoTile === undefined)
          throw new ProjectStateError("Autotile not found", "not-found");
        return autoTile;
      },
      add(name: string, rules: TileRule[], defaultTile: TileAsset) {
        projectState.autoTiles.push({
          id: generateId(),
          name: name,
          rules: rules,
          defaultTile,
        });

        const jsoN = JSON.stringify(projectState.autoTiles);

        console.log(jsoN);
      },
      update(id: string, autoTile: Omit<AutoTile, "id">) {
        const idx = projectState.autoTiles.findIndex((at) => at.id === id);
        if (idx === -1)
          throw new ProjectStateError("Autotile not found", "not-found");
        projectState.autoTiles[idx] = { id, ...autoTile };
      },
      delete(id: string) {
        const idx = projectState.autoTiles.findIndex((at) => at.id === id);
        if (idx === -1)
          throw new ProjectStateError("Autotile not found", "not-found");

        const autoTile = projectState.autoTiles[idx];

        const isUsed =
          projectState.layers.find((l) => {
            if (l.type === PaintType.AUTO_TILE) {
              if (
                l.data
                  .values()
                  .find(
                    (a) =>
                      a.type === PaintType.AUTO_TILE &&
                      a.ref.id === autoTile.id,
                  )
              )
                return true;
            }
            return false;
          }) !== undefined;
        if (isUsed)
          throw new ProjectStateError(
            "Autotile is referenced in project",
            "asset-in-use",
          );
        projectState.autoTiles.splice(idx, 1);
      },
      selectTile(
        row: number,
        col: number,
        autoTile: AutoTile,
        layerID: string,
      ): TileAsset {
        const n = api.layers.getTileAt(row - 1, col, layerID);
        const ne = api.layers.getTileAt(row - 1, col + 1, layerID);
        const e = api.layers.getTileAt(row, col + 1, layerID);
        const se = api.layers.getTileAt(row + 1, col + 1, layerID);
        const s = api.layers.getTileAt(row + 1, col, layerID);
        const sw = api.layers.getTileAt(row + 1, col - 1, layerID);
        const w = api.layers.getTileAt(row, col - 1, layerID);
        const nw = api.layers.getTileAt(row + 1, col - 1, layerID);

        const connections = {
          n:
            n !== null &&
            n.type === PaintType.AUTO_TILE &&
            n.ref.id === autoTile.id,
          ne:
            ne !== null &&
            ne.type === PaintType.AUTO_TILE &&
            ne.ref.id === autoTile.id,
          e:
            e !== null &&
            e.type === PaintType.AUTO_TILE &&
            e.ref.id === autoTile.id,
          se:
            se !== null &&
            se.type === PaintType.AUTO_TILE &&
            se.ref.id === autoTile.id,
          s:
            s !== null &&
            s.type === PaintType.AUTO_TILE &&
            s.ref.id === autoTile.id,
          sw:
            sw !== null &&
            sw.type === PaintType.AUTO_TILE &&
            sw.ref.id === autoTile.id,
          w:
            w !== null &&
            w.type === PaintType.AUTO_TILE &&
            w.ref.id === autoTile.id,
          nw:
            nw !== null &&
            nw.type === PaintType.AUTO_TILE &&
            nw.ref.id === autoTile.id,
        };

        const rules = autoTile.rules.filter((tr) => {
          return (
            ((tr.connections.n === TileRequirement.REQUIRED && connections.n) ||
              (tr.connections.n === TileRequirement.EXCLUDED &&
                !connections.n) ||
              tr.connections.n === TileRequirement.OPTIONAL) &&
            ((tr.connections.ne === TileRequirement.REQUIRED &&
              connections.ne) ||
              (tr.connections.ne === TileRequirement.EXCLUDED &&
                !connections.ne) ||
              tr.connections.ne === TileRequirement.OPTIONAL) &&
            ((tr.connections.e === TileRequirement.REQUIRED && connections.e) ||
              (tr.connections.e === TileRequirement.EXCLUDED &&
                !connections.e) ||
              tr.connections.e === TileRequirement.OPTIONAL) &&
            ((tr.connections.se === TileRequirement.REQUIRED &&
              connections.se) ||
              (tr.connections.se === TileRequirement.EXCLUDED &&
                !connections.se) ||
              tr.connections.se === TileRequirement.OPTIONAL) &&
            ((tr.connections.s === TileRequirement.REQUIRED && connections.s) ||
              (tr.connections.s === TileRequirement.EXCLUDED &&
                !connections.s) ||
              tr.connections.s === TileRequirement.OPTIONAL) &&
            ((tr.connections.sw === TileRequirement.REQUIRED &&
              connections.sw) ||
              (tr.connections.sw === TileRequirement.EXCLUDED &&
                !connections.sw) ||
              tr.connections.sw === TileRequirement.OPTIONAL) &&
            ((tr.connections.w === TileRequirement.REQUIRED && connections.w) ||
              (tr.connections.w === TileRequirement.EXCLUDED &&
                !connections.w) ||
              tr.connections.w === TileRequirement.OPTIONAL) &&
            ((tr.connections.nw === TileRequirement.REQUIRED &&
              connections.nw) ||
              (tr.connections.nw === TileRequirement.EXCLUDED &&
                !connections.nw) ||
              tr.connections.nw === TileRequirement.OPTIONAL)
          );
        });

        return rules.length > 0
          ? rules[Math.floor(Math.random() * rules.length)].tile
          : autoTile.defaultTile;
      },
    },
    layers: {
      get() {
        return projectState.layers;
      },
      set(layers: Layer[]) {
        projectState.layers = layers;
      },
      getLayer(id: string): Layer {
        const layer = projectState.layers.find((l) => l.id === id);
        if (layer === undefined)
          throw new ProjectStateError("Layer not found", "not-found");
        return layer;
      },
      add(name: string, type: PaintType) {
        switch (type) {
          case PaintType.TILE:
            projectState.layers.push({
              id: generateId(),
              name,
              type,
              data: new Map(),
            });
            break;
          case PaintType.AUTO_TILE:
            projectState.layers.push({
              id: generateId(),
              name,
              type,
              data: new Map(),
            });
            break;
          case PaintType.AREA:
            projectState.layers.push({
              id: generateId(),
              name,
              type,
              data: new Map(),
            });
            break;
        }
      },

      update(id: string, layer: Layer) {
        const idx = projectState.layers.findIndex((l) => l.id === id);
        if (idx === -1)
          throw new ProjectStateError("Layer not found", "not-found");
        projectState.layers[idx] = layer;
      },
      delete(id: string) {
        const idx = projectState.layers.findIndex((l) => l.id === id);
        if (idx === -1)
          throw new ProjectStateError("Layer not found", "not-found");
        projectState.layers.splice(idx, 1);
      },

      getTileAt(
        row: number,
        col: number,
        layerID: string,
      ): PaintedAsset | null {
        const layer = this.getLayer(layerID);

        return layer.data.get(`${row}:${col}`) || null;
      },

      paintTile(
        row: number,
        col: number,
        layerID: string,
        paint: PaintedAsset,
      ) {
        const layer = this.getLayer(layerID);

        // TODO: can this be done better with typescript generics?

        if (layer.type !== paint.type)
          throw new ProjectStateError(
            "type mismatch between layer and asset",
            "type-error",
          );

        const curr = layer.data.get(`${row}:${col}`) || null;

        // Don't do anything if the same tile is being painted again
        if (api.utils.isSameAsset(curr, paint)) {
          return;
        }

        layer.data.set(`${row}:${col}`, { ...paint } as any);

        projectStateChangeEvents.emit({
          prev: {
            type: paint.type,
            layer: { id: layerID },
            items: [
              { data: curr ? ({ ...curr } as any) : null, pos: { row, col } },
            ],
          },
          next: {
            type: paint.type,
            layer: { id: layerID },
            items: [{ data: { ...paint } as any, pos: { row, col } }],
          },
        });
      },

      paintTiles(
        row: number,
        col: number,
        layerID: string,
        tiles: TileAsset[],
      ) {
        const layer = this.getLayer(layerID);

        if (layer.type !== PaintType.TILE)
          throw new ProjectStateError(
            "type mismatch between layer and asset",
            "type-error",
          );

        const tileSize = projectState.tileSize;

        const prevTiles = [];
        const nextTiles = [];

        // To get offsets from row, col
        const minX = Math.min(...tiles.map((t) => t.ref.tile.tilesetPos.x));
        const minY = Math.min(...tiles.map((t) => t.ref.tile.tilesetPos.y));

        for (const t of tiles) {
          const r =
            row + Math.floor((t.ref.tile.tilesetPos.y - minY) / tileSize);
          const c =
            col + Math.floor((t.ref.tile.tilesetPos.x - minX) / tileSize);

          const curr = layer.data.get(`${r}:${c}`) || null;

          // Don't do anything if the same tile is being painted again
          if (api.utils.isSameAsset(curr, t)) {
            return;
          }

          layer.data.set(`${r}:${c}`, { ...t } as any);

          prevTiles.push({
            data: curr ? ({ ...curr } as any) : null,
            pos: { row: r, col: c },
          });
          nextTiles.push({
            data: t !== null ? ({ ...t } as any) : null,
            pos: { row: r, col: c },
          });
        }

        projectStateChangeEvents.emit({
          prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
          next: { type: layer.type, layer: { id: layerID }, items: nextTiles },
        });
      },

      applyPaintTileChange(
        row: number,
        col: number,
        layerID: string,
        paint: PaintedAsset | null,
      ) {
        const layer = this.getLayer(layerID);

        // TODO: can this be done better with typescript generics?
        if (paint === null) {
          layer.data.delete(`${row}:${col}`);
        } else {
          if (layer.type !== paint.type)
            throw new ProjectStateError(
              "type mismatch between layer and asset",
              "type-error",
            );
          layer.data.set(`${row}:${col}`, { ...paint } as any);
        }
      },

      eraseTile(row: number, col: number, layerID: string) {
        const layer = this.getLayer(layerID);

        const curr = layer.data.get(`${row}:${col}`) || null;

        // Don't do anything if the tile is already erased
        if (api.utils.isSameAsset(curr, null)) {
          return;
        }

        layer.data.delete(`${row}:${col}`);

        projectStateChangeEvents.emit({
          prev: {
            type: layer.type,
            layer: { id: layerID },
            items: [
              { data: curr ? ({ ...curr } as any) : null, pos: { row, col } },
            ],
          },
          next: {
            type: layer.type,
            layer: { id: layerID },
            items: [{ data: null, pos: { row, col } }],
          },
        });
      },

      floodFill(
        layerID: string,
        row: number,
        col: number,
        paint: PaintedAsset | null,
      ) {
        const layer = this.getLayer(layerID);

        if (paint !== null && layer.type !== paint.type)
          throw new ProjectStateError(
            "type mismatch between layer and asset",
            "type-error",
          );

        const clickedTile = this.getTileAt(row, col, layerID);
        const BOUNDARY = 100;
        const minRow = row - BOUNDARY;
        const maxRow = row + BOUNDARY;
        const minCol = col - BOUNDARY;
        const maxCol = col + BOUNDARY;

        const stack = [{ row, col }];

        const visited = new Set();

        visited.add(`${row}:${col}`);

        const filledTiles: { row: number; col: number }[] = [];

        while (stack.length > 0) {
          const tile = stack.pop()!;

          if (
            tile.row < minRow ||
            tile.row > maxRow ||
            tile.col < minCol ||
            tile.col > maxCol
          ) {
            throw new ProjectStateError(
              "Flood fill exceeded boundary limits",
              "boundary-exceeded",
            );
          }

          const neighbours = getNeighbours({ row: tile.row, col: tile.col });

          for (const n of neighbours) {
            const visitedKey = `${n.row}:${n.col}`;

            if (
              !visited.has(visitedKey) &&
              api.utils.isSameAsset(
                clickedTile,
                this.getTileAt(n.row, n.col, layerID),
              )
            ) {
              visited.add(`${n.row}:${n.col}`);
              stack.push(n);
            }
          }

          filledTiles.push(tile);
        }

        const prevTiles = filledTiles.map((ft) => {
          const curr = layer.data.get(`${ft.row}:${ft.col}`) || null;
          return {
            data: curr ? ({ ...curr } as any) : null,
            pos: { row: ft.row, col: ft.col },
          };
        });

        const nextItems = filledTiles.map((ft) => {
          return {
            data: paint !== null ? ({ ...paint } as any) : null,
            pos: { row: ft.row, col: ft.col },
          };
        });

        for (const ft of filledTiles) {
          if (paint === null) {
            layer.data.delete(`${ft.row}:${ft.col}`);
          } else {
            layer.data.set(`${ft.row}:${ft.col}`, { ...paint } as any);
            // If is auto tile layer, this will have to take into account the same procedure as in auto tile paint
          }
        }

        projectStateChangeEvents.emit({
          prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
          next: { type: layer.type, layer: { id: layerID }, items: nextItems },
        });
      },

      paintWithAutoTile(
        row: number,
        col: number,
        autoTileID: string,
        layerID: string,
      ): void {
        const layer = api.layers.getLayer(layerID);

        if (layer.type !== PaintType.AUTO_TILE)
          throw new ProjectStateError(
            "paintWithAutoTile only supported for auto-tile layers",
            "not-supported",
          );

        const currTile = api.layers.getTileAt(row, col, layerID);

        if (currTile !== null && currTile.type !== PaintType.AUTO_TILE)
          throw new ProjectStateError(
            "Painted asset is not of type auto tile",
            "type-mismatch",
          );

        // Don't paint if the tile is already painted with auto tile
        if (currTile !== null && currTile?.ref.id === autoTileID) return;

        const autoTile = api.autoTiles.getAutoTile(autoTileID);

        const tile = api.autoTiles.selectTile(row, col, autoTile, layerID);

        const prevTiles: AutoTileHistoryEntryItem[] = [];
        const paintedTiles: AutoTileHistoryEntryItem[] = [];

        prevTiles.push({
          pos: { row, col },
          data: currTile as PaintedAutoTile | null,
        });
        paintedTiles.push({
          pos: { row, col },
          data: { type: PaintType.AUTO_TILE, ref: { id: autoTileID }, tile },
        });
        layer.data.set(`${row}:${col}`, {
          type: PaintType.AUTO_TILE,
          ref: { id: autoTileID },
          tile,
        });

        const neighbours = getNeighbours({ row, col }, true);

        for (const n of neighbours) {
          const currTile = api.layers.getTileAt(n.row, n.col, layerID);

          if (
            currTile !== null &&
            currTile.type === PaintType.AUTO_TILE &&
            currTile.ref.id === autoTileID
          ) {
            const tile = api.autoTiles.selectTile(
              n.row,
              n.col,
              autoTile,
              layerID,
            );

            prevTiles.push({
              pos: { row: n.row, col: n.col },
              data: currTile as PaintedAutoTile,
            });
            paintedTiles.push({
              pos: { row: n.row, col: n.col },
              data: {
                type: PaintType.AUTO_TILE,
                ref: { id: autoTileID },
                tile,
              },
            });
            layer.data.set(`${n.row}:${n.col}`, {
              type: PaintType.AUTO_TILE,
              ref: { id: autoTileID },
              tile,
            });
          }
        }

        projectStateChangeEvents.emit({
          prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
          next: {
            type: layer.type,
            layer: { id: layerID },
            items: paintedTiles,
          },
        });
      },
      eraseAutoTile(row: number, col: number, layerID: string): void {
        const currTile = api.layers.getTileAt(row, col, layerID);
        // Ignore if tile already erased
        if (currTile === null) return;

        if (currTile.type !== PaintType.AUTO_TILE)
          throw new ProjectStateError(
            "Tile is not painted with auto tile asset",
            "type-mismatch",
          );

        const autoTile = api.autoTiles.getAutoTile(currTile.ref.id);

        const layer = api.layers.getLayer(layerID);

        if (layer.type !== PaintType.AUTO_TILE)
          throw new ProjectStateError(
            "eraseAutoTile only supported for auto-tile layers",
            "not-supported",
          );

        const prevTiles: AutoTileHistoryEntryItem[] = [];
        const paintedTiles: AutoTileHistoryEntryItem[] = [];

        prevTiles.push({ pos: { row, col }, data: { ...currTile } });

        layer.data.delete(`${row}:${col}`);
        paintedTiles.push({ pos: { row: row, col: col }, data: null });

        const neighbours = getNeighbours({ row, col }, true);

        for (const n of neighbours) {
          const currTile = api.layers.getTileAt(n.row, n.col, layerID);

          // If painted with same auto tile, update its content
          if (
            currTile !== null &&
            currTile.type === PaintType.AUTO_TILE &&
            currTile.ref.id === autoTile.id
          ) {
            prevTiles.push({
              pos: { row: n.row, col: n.col },
              data: { ...currTile },
            });

            const tile = api.autoTiles.selectTile(
              n.row,
              n.col,
              autoTile,
              layerID,
            );

            paintedTiles.push({
              pos: { row: n.row, col: n.col },
              data: { ...currTile, tile },
            });

            layer.data.set(`${n.row}:${n.col}`, { ...currTile, tile });
          }
        }

        projectStateChangeEvents.emit({
          prev: { type: layer.type, layer: { id: layerID }, items: prevTiles },
          next: {
            type: layer.type,
            layer: { id: layerID },
            items: paintedTiles,
          },
        });
      },
    },

    utils: {
      isSameAsset(a: AssetRef | null, b: AssetRef | null): boolean {
        if (a === null && b === null) return true;

        if (a === null || b === null) return false;

        if (a.type !== b.type) return false;

        switch (a.type) {
          case PaintType.TILE:
            return (
              a.ref.tile.tilesetId === (b as typeof a).ref.tile.tilesetId &&
              a.ref.tile.tilesetPos.y ===
                (b as typeof a).ref.tile.tilesetPos.y &&
              a.ref.tile.tilesetPos.x === (b as typeof a).ref.tile.tilesetPos.x
            );
          case PaintType.AUTO_TILE:
            return a.ref.id === (b as typeof a).ref.id;
          case PaintType.AREA:
            return a.ref.id === (b as typeof a).ref.id;
        }
      },
    },

    getJSONExport(): string {
      const tileSize = projectState.tileSize;

      const tilemapBounds: { x1: number; x2: number; y1: number; y2: number } =
        projectState.layers.reduce(
          (acc, l) => {
            for (const key of l.data.keys()) {
              const [row, col] = key.split(":").map(Number);

              acc.y1 = Math.min(row * tileSize, acc.y1);
              acc.y2 = Math.max(row * tileSize, acc.y2);
              acc.x1 = Math.min(col * tileSize, acc.x1);
              acc.x2 = Math.max(col * tileSize, acc.x2);
            }

            return acc;
          },
          { x1: Infinity, x2: -Infinity, y1: Infinity, y2: -Infinity },
        );

      const ctx = createOffScreenCanvas(
        tilemapBounds.x2 - tilemapBounds.x1,
        tilemapBounds.y2 - tilemapBounds.y1,
      );

      for (const layer of api.layers.get()) {
        if (guiState.visibleLayers[layer.id]) {
          switch (layer.type) {
            case PaintType.TILE:
              for (const [key, tileAsset] of layer.data) {
                const tileset = api.tilesets.getTileset(
                  tileAsset.ref.tile.tilesetId,
                );

                const [row, col] = key.split(":").map(Number);

                ctx.drawImage(
                  tileset.spritesheet,
                  tileAsset.ref.tile.tilesetPos.x,
                  tileAsset.ref.tile.tilesetPos.y,
                  tileSize,
                  tileSize,
                  col * tileSize,
                  row * tileSize,
                  tileSize,
                  tileSize,
                );
              }
              break;
            case PaintType.AUTO_TILE:
              for (const [key, autoTileAsset] of layer.data) {
                const [row, col] = key.split(":").map(Number);
                const tileset = api.tilesets.getTileset(
                  autoTileAsset.tile.ref.tile.tilesetId,
                );

                ctx.drawImage(
                  tileset.spritesheet,
                  autoTileAsset.tile.ref.tile.tilesetPos.x,
                  autoTileAsset.tile.ref.tile.tilesetPos.y,
                  tileSize,
                  tileSize,
                  col * tileSize,
                  row * tileSize,
                  tileSize,
                  tileSize,
                );
              }
              break;
          }
        }
      }

      const areas: { name: string; tiles: Point[] }[] = projectState.layers
        .filter((l) => l.type === PaintType.AREA)
        .reduce(
          (acc, curr) => {
            for (const [key, areaAsset] of curr.data) {
              const area = api.areas.getArea(areaAsset.ref.id);

              const [row, col] = key.split(":").map(Number);

              const areaItem = acc.find((a) => a.name === area.name);

              if (areaItem !== undefined) {
                areaItem.tiles.push({
                  x: col * projectState.tileSize - tilemapBounds.x1,
                  y: row * projectState.tileSize - tilemapBounds.y1,
                });
              } else {
                acc.push({
                  name: area.name,
                  tiles: [
                    {
                      x: col * projectState.tileSize - tilemapBounds.x1,
                      y: row * projectState.tileSize - tilemapBounds.y1,
                    },
                  ],
                });
              }
            }

            return acc;
          },
          [] as { name: string; tiles: Point[] }[],
        );

      // TODO: add tileAttributes: [{x, y, attributes: {key: value, key: value, key: value}}]

      const data: ProjectJSON = {
        tilemap: ctx.canvas.toDataURL(),
        areas,
        tileSize: projectState.tileSize,
        name: projectState.projectName,
        attributes: [],
      };

      return JSON.stringify(data);
    },
  };

  return api;
})();

const LocalStorage = (() => {
  projectStateChangeEvents.addEventListener("project-state-change", (e) => {
    save();
  });

  const save = () => {
    localStorage.setItem(
      "project",
      JSON.stringify({
        projectName: projectState.projectName,
        tileSize: projectState.tileSize,
        tilesets: projectState.tilesets
          .get()
          .map((t) => ({ ...t, spritesheet: bitmapToDataURL(t.spritesheet) })),
        areas: projectState.areas.get(),
        autoTiles: projectState.autoTiles.get(),
        layers: projectState.layers
          .get()
          .map((l) => ({ ...l, data: [...l.data.entries()] })),
      }),
    );
  };

  return {};
})();

export const HistoryStack = (() => {
  // History management
  // Each action consists of two entries, the previous state and the next state after the action
  // When undoing, we decrement the currIdx and repaint the previous state and then move back one more to point to the previous action
  // When redoing, we increment the currIdx by two to point to the next action and repaint that state
  // The stack listens to project state change events to build the history via the projectStateChangeEvents emitter

  const history: HistoryEntry[] = [];
  let currIdx = 0;

  projectStateChangeEvents.addEventListener("project-state-change", (e) => {
    if (currIdx !== history.length - 1) {
      history.splice(currIdx + 1);
    }

    history.push((e as CustomEvent<ProjectStateChangeEvent>).detail.prev);
    history.push((e as CustomEvent<ProjectStateChangeEvent>).detail.next);
    currIdx = history.length - 1;
  });

  const repaint = () => {
    const entry = history[currIdx];
    if (!entry) return;

    const layer = projectState.layers.getLayer(entry.layer.id);

    if (layer.type !== entry.type)
      throw new Error("type mismatch between layer and entry");
    for (const i of entry.items) {
      projectState.layers.applyPaintTileChange(
        i.pos.row,
        i.pos.col,
        entry.layer.id,
        i.data,
      );
    }
  };

  return {
    undo() {
      if (currIdx === 0) return;
      currIdx--; // First repaint what was previously done
      repaint();
      currIdx--; // Move to the previous state
    },

    redo() {
      if (currIdx === history.length - 1) return;
      currIdx += 2; // Advance by two to redo the next action
      repaint();
    },
  };
})();
