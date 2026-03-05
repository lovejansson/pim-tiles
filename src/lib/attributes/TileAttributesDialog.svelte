<script lang="ts">
  import { projectState } from "../../state.svelte";
  import type { Tile } from "../../types";
  import { isSamePos } from "../../utils";
  import AttributesDialog from "./AttributesDialog.svelte";

  // This is the dialog for editing attributes for a tile's attributes 

  type TileAttributesDialogProps = {
    tile: Tile;
    open: boolean;
  };

  let { open = $bindable(), tile }: TileAttributesDialogProps = $props();

  let localTile = $state(tile);

  
  $effect(() => console.log("HEJKSAN"))

  const getTileAttributesArray = (tile: Tile) => {
    try {
      const attributes = projectState.getTileAttributes(tile);
      return Array.from(attributes.entries());
    } catch (e) {
      return [];
    }
  };

  // Using an array of tuples since the Map is not reactive!
  let attributes: [string, string][] = $state(
    tile !== undefined ? getTileAttributesArray(tile) : [],
  );

  $effect(() => {
    // If tile prop is changed recreate the attributes array
    if (
      tile.tilesetId !== localTile.tilesetId ||
      !isSamePos(tile.tilesetPos, localTile.tilesetPos)
    ) {
      localTile = tile;
      const tileAttributes = getTileAttributesArray(tile);
      attributes = tileAttributes;
    }
  });

  const save = () => {
    if (attributes.length > 0) {
      projectState.updateTileAttributes(localTile, new Map(attributes));
    } else if (projectState.hasTileAttributes(localTile)) {
      projectState.deleteTileAttributes(localTile);
    }
  };
</script>

<AttributesDialog
  title="Tile attributes"
  onSave={save}
  bind:attributes
  bind:open

/>
