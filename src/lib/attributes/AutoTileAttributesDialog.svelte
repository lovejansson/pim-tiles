<script lang="ts">
  import { projectState } from "../../state.svelte";
  import type { AutoTile } from "../../types";
  import AttributesDialog from "./AttributesDialog.svelte";

  type AutoTileAttributesDialogProps = {
    autoTile: AutoTile;
    open: boolean;
  };

  let { open = $bindable(), autoTile }: AutoTileAttributesDialogProps =
    $props();

  let localAutoTile = $state(autoTile);

  const getAttributesArray = (autoTile: AutoTile) => {
    try {
      const attributes = projectState.getAutoTileAttributes(autoTile.id);
      return Array.from(attributes.entries());
    } catch (e) {
      return [];
    }
  };

  // Using an array of tuples since the Map is not reactive!
  let attributes: [string, string][] = $state(
    autoTile !== undefined ? getAttributesArray(autoTile) : [],
  );

  $effect(() => {
    // If tile prop is changed recreate the attributes array
    if (autoTile.id !== localAutoTile.id) {
      localAutoTile = autoTile;
      const attr = getAttributesArray(localAutoTile);
      attributes = attr;
    }
  });

  const save = () => {
    if (attributes.length > 0) {
      projectState.updateAutoTileAttributes(
        localAutoTile.id,
        new Map(attributes),
      );
    } else if (projectState.hasAutoTileAttributes(localAutoTile.id)) {
      projectState.deleteAutoTileAttributes(localAutoTile.id);
    }
  };
</script>

<AttributesDialog
  title="Autotile attributes"
  onSave={save}
  bind:attributes
  bind:open
/>
