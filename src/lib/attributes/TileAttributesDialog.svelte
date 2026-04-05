<script lang="ts">
  import { projectState } from "../../projectState.svelte";
  import type { Tile } from "../../types";
  import AttributesDialog from "./AttributesDialog.svelte";

  // This is the dialog for editing attributes for a tile's attributes 

  type TileAttributesDialogProps = {
    tile: Tile;
    open: boolean;
  };

  let { open = $bindable(), tile }: TileAttributesDialogProps = $props();

  const getTileAttributesArray = (tile: Tile) => {
    try {
      const attributes = projectState.getTileAttributes(tile);
      return Array.from(attributes.entries());
    } catch (e) {
      return [];
    }
  };

    console.log("ARE WE HERE F")

  // Using an array of tuples since the Map is not reactive!
  let attributes: [string, string][] = $state(
    tile !== undefined ? getTileAttributesArray(tile) : [],
  );

  const save = () => {
    if (attributes.length > 0) {
      projectState.updateTileAttributes(tile, new Map(attributes));
    } else if (projectState.hasTileAttributes(tile)) {
      projectState.deleteTileAttributes(tile);
    }
  };
</script>

<AttributesDialog
  title="Tile attributes"
  onSave={save}
  bind:attributes
  bind:open
  img={projectState.getTileDataUrl(tile)}
/>
