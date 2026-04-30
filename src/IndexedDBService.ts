import { broadcastChannelService } from "./BroadcastChannelService";
import {
  projectStateEvents,
  ProjectStateEventType,
  type ProjectStateEvent,
  type ProjectStateMembers,
} from "./projectState.svelte";
import type {
  AutoTile,
  LayerComp,
  LayerDataComp,
  Object,
  Tileset,
} from "./types";

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

type IndexedDBSchema = {
  settings: {
    name: { name: string };
    dimensions: {
      width: number;
      height: number;
      tileSize: number;
    };
  };
  layers: {
    layers: LayerComp[];
  };
  tilesets: {
    tilesets: Tileset[];
  };
  autoTiles: {
    autoTiles: AutoTile[];
  };
  objects: {
    objects: Object[];
  };
  attributes: {
    attributes: [string, Map<string, string>][];
  };
  tileAttributes: {
    tileAttributes: [string, Map<string, string>][];
  };
  autoTileAttributes: {
    autoTileAttributes: [string, Map<string, string>][];
  };
  objectAttributes: {
    objectAttributes: [string, Map<string, string>][];
  };
  paintedObjectAttributes: {
    paintedObjectAttributes: [string, Map<string, string>][];
  };
  layerData: {
    layerData: [string, LayerDataComp][];
  };
};

type StoreName = keyof IndexedDBSchema;
type StoreKey<T extends StoreName> = keyof IndexedDBSchema[T];

type StoreValue<
  T extends StoreName,
  K extends StoreKey<T>,
> = IndexedDBSchema[T][K];

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("pim-tiles", 2);

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
        if (!db.objectStoreNames.contains("objects"))
          db.createObjectStore("objects");
        if (!db.objectStoreNames.contains("attributes"))
          db.createObjectStore("attributes");
        if (!db.objectStoreNames.contains("tileAttributes"))
          db.createObjectStore("tileAttributes");
        if (!db.objectStoreNames.contains("autoTileAttributes"))
          db.createObjectStore("autoTileAttributes");
        if (!db.objectStoreNames.contains("objectAttributes"))
          db.createObjectStore("objectAttributes");
        if (!db.objectStoreNames.contains("paintedObjectAttributes"))
          db.createObjectStore("paintedObjectAttributes");
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
          ProjectStateEventType.OBJECTS_UPDATE,
          (e: ProjectStateEvent<ProjectStateEventType.OBJECTS_UPDATE>) => {
            try {
              indexedDBService.setObjects(e.detail.objects);
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
          ProjectStateEventType.OBJECT_ATTRIBUTES_UPDATE,
          (
            e: ProjectStateEvent<ProjectStateEventType.OBJECT_ATTRIBUTES_UPDATE>,
          ) => {
            try {
              indexedDBService.setObjectAttributes(e.detail.objectAttributes);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.PAINTED_OBJECT_ATTRIBUTES_UPDATE,
          (
            e: ProjectStateEvent<ProjectStateEventType.PAINTED_OBJECT_ATTRIBUTES_UPDATE>,
          ) => {
            try {
              indexedDBService.setPaintedObjectAttributes(
                e.detail.paintedObjectAttributes,
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

        projectStateEvents.on(
          ProjectStateEventType.OPEN_FILE,
          (e: ProjectStateEvent<ProjectStateEventType.OPEN_FILE>) => {
            try {
              indexedDBService.setAll(e.detail);
            } catch (err) {
              console.error(err);
            }
          },
        );

        projectStateEvents.on(
          ProjectStateEventType.NEW_PROJECT,
          (e: ProjectStateEvent<ProjectStateEventType.NEW_PROJECT>) => {
            try {
              indexedDBService.setAll(e.detail);
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

  private put<T extends StoreName, K extends StoreKey<T>>(
    storeName: T,
    key: K,
    value: StoreValue<T, K>,
  ): Promise<void> {
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
      const req = store.put(value, key as string);

      req.onsuccess = () => {
        broadcastChannelService.send("indexed-db-update");
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  private get<T extends StoreName, K extends StoreKey<T>>(
    storeName: T,
    key: K,
  ): Promise<StoreValue<T, K> | undefined> {
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
      const req = store.get(key as string);

      req.onsuccess = () => resolve(req.result as StoreValue<T, K> | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  private async setAll(data: ProjectStateMembers): Promise<void> {
    await Promise.all([
      this.setName(data.name),
      this.setDimensions({
        width: data.width,
        height: data.height,
        tileSize: data.tileSize,
      }),
      this.setLayers(data.layers),
      this.setTilesets(data.tilesets),
      this.setAutoTiles(data.autoTiles),
      this.setObjects(data.objects),
      this.setAttributes(data.attributes),
      this.setTileAttributes(data.tileAttributes),
      this.setAutoTileAttributes(data.autoTileAttributes),
      this.setObjectAttributes(data.objectAttributes),
      this.setPaintedObjectAttributes(data.paintedObjectAttributes),
      this.setLayerData(data.layerData),
    ]);
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
    return this.get("settings", "dimensions");
  }

  setName(name: string): Promise<void> {
    return this.put("settings", "name", { name });
  }

  getName(): Promise<string | undefined> {
    return this.get("settings", "name").then((res) => res?.name);
  }

  setLayers(layers: LayerComp[]): Promise<void> {
    return this.put("layers", "layers", layers);
  }

  getLayers(): Promise<LayerComp[] | undefined> {
    return this.get("layers", "layers");
  }

  setTilesets(tilesets: Tileset[]): Promise<void> {
    return this.put("tilesets", "tilesets", tilesets);
  }

  getTilesets(): Promise<Tileset[] | undefined> {
    return this.get("tilesets", "tilesets");
  }

  setAutoTiles(autoTiles: AutoTile[]): Promise<void> {
    return this.put("autoTiles", "autoTiles", autoTiles);
  }

  getAutoTiles(): Promise<AutoTile[] | undefined> {
    return this.get("autoTiles", "autoTiles");
  }

  setObjects(objects: Object[]): Promise<void> {
    return this.put("objects", "objects", objects);
  }

  getObjects(): Promise<Object[] | undefined> {
    return this.get("objects", "objects");
  }

  setAttributes(attributes: Map<string, Map<string, string>>): Promise<void> {
    return this.put(
      "attributes",
      "attributes",
      Array.from(attributes.entries()),
    );
  }

  getAttributes(): Promise<Map<string, Map<string, string>> | undefined> {
    return this.get("attributes", "attributes").then((data) =>
      data ? new Map(data) : undefined,
    );
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
    return this.get("tileAttributes", "tileAttributes").then((data) =>
      data ? new Map(data) : undefined,
    );
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
    return this.get("autoTileAttributes", "autoTileAttributes").then((data) =>
      data ? new Map(data) : undefined,
    );
  }

  setObjectAttributes(
    objectAttributes: Map<string, Map<string, string>>,
  ): Promise<void> {
    return this.put(
      "objectAttributes",
      "objectAttributes",
      Array.from(objectAttributes.entries()),
    );
  }

  getObjectAttributes(): Promise<Map<string, Map<string, string>> | undefined> {
    return this.get("objectAttributes", "objectAttributes").then((data) =>
      data ? new Map(data) : undefined,
    );
  }

  setPaintedObjectAttributes(
    paintedObjectAttributes: Map<string, Map<string, string>>,
  ): Promise<void> {
    return this.put(
      "paintedObjectAttributes",
      "paintedObjectAttributes",
      Array.from(paintedObjectAttributes.entries()),
    );
  }

  getPaintedObjectAttributes(): Promise<
    Map<string, Map<string, string>> | undefined
  > {
    return this.get(
      "paintedObjectAttributes",
      "paintedObjectAttributes",
    ).then((data) => (data ? new Map(data) : undefined));
  }

  setLayerData(layerData: Map<string, LayerDataComp>): Promise<void> {
    return this.put("layerData", "layerData", Array.from(layerData.entries()));
  }

  getLayerData(): Promise<Map<string, LayerDataComp> | undefined> {
    return this.get("layerData", "layerData").then((data) =>
      data ? new Map(data) : undefined,
    );
  }
}

export const indexedDBService = new IndexedDBService();
