<script lang="ts">
  import { indexedDBService } from "./indexedDB";
  import {
    projectState,
    type ProjectStateMembers,
  } from "./projectState.svelte";

  let { loading = $bindable() } = $props();

  $effect(() => {
    indexedDBService.open().then(async () => {
      const [
        layers,
        layerData,
        autoTileAttributes,
        tileAttributes,
        attributes,
        autoTiles,
        tilesets,
        name,
        dimensions,
      ] = await Promise.all([
        indexedDBService.getLayers(),
        indexedDBService.getLayerData(),
        indexedDBService.getAutoTileAttributes(),
        indexedDBService.getTileAttributes(),
        indexedDBService.getAttributes(),
        indexedDBService.getAutoTiles(),
        indexedDBService.getTilesets(),
        indexedDBService.getName(),
        indexedDBService.getDimensions(),
      ]);

      const partialState: Partial<ProjectStateMembers> = {};

      if (layers !== undefined) partialState.layers = layers;
      if (layerData !== undefined) partialState.layerData = layerData;
      if (autoTileAttributes !== undefined)
        partialState.autoTileAttributes = autoTileAttributes;
      if (tileAttributes !== undefined)
        partialState.tileAttributes = tileAttributes;
      if (attributes !== undefined) partialState.attributes = attributes;
      if (autoTiles !== undefined) partialState.autoTiles = autoTiles;
      if (tilesets !== undefined) partialState.tilesets = tilesets;
      if (name !== undefined) partialState.name = name;
      if (dimensions !== undefined) {
        partialState.tileSize = dimensions.tileSize;
        partialState.width = dimensions.width;
        partialState.height = dimensions.height;
      }

      projectState.init(partialState);

      loading = false;
    });
  });
</script>
