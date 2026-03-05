<script lang="ts">
  import { projectState } from "../../state.svelte";
  import type { Cell } from "../../types";
  import { isSameCell } from "../../utils";
  import AttributesDialog from "./AttributesDialog.svelte";

  // This is the dialog for editing attributes for a painted tile

  type AttributesDialogProps = {
    cell: Cell;
    open: boolean;
  };

  let { open = $bindable(), cell }: AttributesDialogProps = $props();

  let tile = $state(cell);


  const getAttributesArray = (cell: Cell) => {
    try {
      const attributes = projectState.getAttributes(cell);
      return Array.from(attributes.entries());
    } catch (e) {
      return [];
    }
  };

  // Using an array of tuples since the Map is not reactive!
  let attributes: [string, string][] = $state(
    cell !== undefined ? getAttributesArray(cell) : [],
  );

  // ! had do update state inside of an effect since i want to sync the attributes state with current tile and at the same time update the attributes in local component.
  $effect(() => {
    if (!isSameCell(cell, tile)) {
      tile = cell;
      const tileAttributes = getAttributesArray(tile);
      attributes = tileAttributes;
    }
  });

  const save = () => {
    if (attributes.length > 0) {
      projectState.updateAttributes(tile, new Map(attributes));
    } else if (projectState.hasAttributes(tile)) {
      projectState.deleteAttributes(tile);
    }
  };

</script>

<AttributesDialog
  title={`Tile attributes for r${tile.row} c${tile.col}`}
  onSave={save}
  bind:attributes
  bind:open
/>

