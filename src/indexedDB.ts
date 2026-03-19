import {
  projectStateEvents,
  ProjectStateEventType,
  type ProjectStateEvent,
} from "./projectState.svelte";
import type { AutoTile, LayerComp, LayerDataComp, Tileset } from "./types";

enum IndexedDBErrorCode {
  DB_NOT_INITIALIZED = "db-not-initialized",
}

class IndexedDBError extends Error {
  constructor(
    msg: string,
    public code: IndexedDBErrorCode,
  ) {
    super(msg);
    this.name = "IndexedDBError";
    this.code = code;
  }
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("pim-tiles", 1);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("settings"))
          db.createObjectStore("settings");
        if (!db.objectStoreNames.contains("layers"))
          db.createObjectStore("layers");
        if (!db.objectStoreNames.contains("tilesets"))
          db.createObjectStore("tilesets");
        if (!db.objectStoreNames.contains("autoTiles"))
          db.createObjectStore("autoTiles");
        if (!db.objectStoreNames.contains("attributes"))
          db.createObjectStore("attributes");
        if (!db.objectStoreNames.contains("tileAttributes"))
          db.createObjectStore("tileAttributes");
        if (!db.objectStoreNames.contains("autoTileAttributes"))
          db.createObjectStore("autoTileAttributes");
        if (!db.objectStoreNames.contains("layerData"))
          db.createObjectStore("layerData");
      };

      request.onsuccess = () => {
        this.db = request.result;

        // Settings
        projectStateEvents.on(
          ProjectStateEventType.NAME_UPDATE,
          (e: ProjectStateEvent<ProjectStateEventType.NAME_UPDATE>) => {
            try {
              indexedDBService.setName(e.detail.name);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.DIMENSIONS_UPDATE,
          (e: ProjectStateEvent<ProjectStateEventType.DIMENSIONS_UPDATE>) => {
            try {
              indexedDBService.setDimensions(e.detail.dimensions);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.LAYERS_UPDATE,
          (e: ProjectStateEvent<ProjectStateEventType.LAYERS_UPDATE>) => {
            try {
              indexedDBService.setLayers(e.detail.layers);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.TILESETS_UPDATE,
          (e: ProjectStateEvent<ProjectStateEventType.TILESETS_UPDATE>) => {
            try {
              indexedDBService.setTilesets(e.detail.tilesets);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.AUTO_TILES_UPDATE,
          (e: ProjectStateEvent<ProjectStateEventType.AUTO_TILES_UPDATE>) => {
            try {
              indexedDBService.setAutoTiles(e.detail.autoTiles);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.ATTRIBUTES_UPDATE,
          (e: ProjectStateEvent<ProjectStateEventType.ATTRIBUTES_UPDATE>) => {
            try {
              indexedDBService.setAttributes(e.detail.attributes);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.TILE_ATTRIBUTES_UPDATE,
          (
            e: ProjectStateEvent<ProjectStateEventType.TILE_ATTRIBUTES_UPDATE>,
          ) => {
            try {
              indexedDBService.setTileAttributes(e.detail.tileAttributes);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.AUTO_TILE_ATTRIBUTES_UPDATE,
          (
            e: ProjectStateEvent<ProjectStateEventType.AUTO_TILE_ATTRIBUTES_UPDATE>,
          ) => {
            try {
              indexedDBService.setAutoTileAttributes(
                e.detail.autoTileAttributes,
              );
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.LAYER_DATA_UPDATE,
          (e: ProjectStateEvent<ProjectStateEventType.LAYER_DATA_UPDATE>) => {
            try {
              indexedDBService.setLayerData(e.detail.layerData);
            } catch (err) {
              console.error(err);
            }
          },
        );

        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private put<T>(storeName: string, key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(
          new IndexedDBError(
            "Database is null",
            IndexedDBErrorCode.DB_NOT_INITIALIZED,
          ),
        );
      }

      const tx = this.db.transaction([storeName], "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(value, key);

      req.onsuccess = () => {
        resolve();
      };
      req.onerror = () => {
        reject(req.error);
      };
    });
  }

  private get<T>(storeName: string, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(
          new IndexedDBError(
            "Database is null",
            IndexedDBErrorCode.DB_NOT_INITIALIZED,
          ),
        );
      }

      const tx = this.db.transaction([storeName], "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  setDimensions(dimensions: {
    width: number;
    height: number;
    tileSize: number;
  }): Promise<void> {
    return this.put("settings", "dimensions", dimensions);
  }

  getDimensions(): Promise<
    { width: number; height: number; tileSize: number } | undefined
  > {
    return this.get<{ width: number; height: number; tileSize: number }>(
      "settings",
      "dimensions",
    );
  }

  setName(name: string): Promise<void> {
    return this.put("settings", "name", { name });
  }

  getName(): Promise<string | undefined> {
    return this.get<{ name: string }>("settings", "name").then(
      (res) => res?.name,
    );
  }

  setLayers(layers: LayerComp[]): Promise<void> {
    return this.put("layers", "layers", layers);
  }

  getLayers(): Promise<LayerComp[] | undefined> {
    return this.get<LayerComp[]>("layers", "layers");
  }

  setTilesets(tilesets: Tileset[]): Promise<void> {
    return this.put("tilesets", "tilesets", tilesets);
  }

  getTilesets(): Promise<Tileset[] | undefined> {
    return this.get<Tileset[]>("tilesets", "tilesets");
  }

  setAutoTiles(autoTiles: AutoTile[]): Promise<void> {
    return this.put("autoTiles", "autoTiles", autoTiles);
  }

  getAutoTiles(): Promise<AutoTile[] | undefined> {
    return this.get<AutoTile[]>("autoTiles", "autoTiles");
  }

  setAttributes(attributes: Map<string, Map<string, string>>): Promise<void> {
    return this.put(
      "attributes",
      "attributes",
      Array.from(attributes.entries()),
    );
  }

  getAttributes(): Promise<Map<string, Map<string, string>> | undefined> {
    return this.get<[string, Map<string, string>][]>(
      "attributes",
      "attributes",
    ).then((data) => (data ? new Map(data) : undefined));
  }

  setTileAttributes(
    tileAttributes: Map<string, Map<string, string>>,
  ): Promise<void> {
    return this.put(
      "tileAttributes",
      "tileAttributes",
      Array.from(tileAttributes.entries()),
    );
  }

  getTileAttributes(): Promise<Map<string, Map<string, string>> | undefined> {
    return this.get<[string, Map<string, string>][]>(
      "tileAttributes",
      "tileAttributes",
    ).then((data) => (data ? new Map(data) : undefined));
  }

  setAutoTileAttributes(
    autoTileAttributes: Map<string, Map<string, string>>,
  ): Promise<void> {
    return this.put(
      "autoTileAttributes",
      "autoTileAttributes",
      Array.from(autoTileAttributes.entries()),
    );
  }

  getAutoTileAttributes(): Promise<
    Map<string, Map<string, string>> | undefined
  > {
    return this.get<[string, Map<string, string>][]>(
      "autoTileAttributes",
      "autoTileAttributes",
    ).then((data) => (data ? new Map(data) : undefined));
  }

  setLayerData(layerData: Map<string, LayerDataComp>): Promise<void> {
    return this.put("layerData", "layerData", Array.from(layerData.entries()));
  }

  getLayerData(): Promise<Map<string, LayerDataComp> | undefined> {
    return this.get<[string, LayerDataComp][]>("layerData", "layerData").then(
      (data) => (data ? new Map(data) : undefined),
    );
  }
}

export const indexedDBService = new IndexedDBService();
