<script lang="ts">
  import { projectState } from "../../projectState.svelte";
  import AttributesDialog from "./AttributesDialog.svelte";

  // This is the dialog for editing attributes for a painted tile

  type AttributesDialogProps = {
    row: number;
    col: number;
    open: boolean;
  };

  let { open = $bindable(), row, col }: AttributesDialogProps = $props();

  const getAttributesArray = (row: number, col: number) => {
    try {
      const attributes = projectState.getAttributes(row, col);
      return Array.from(attributes.entries());
    } catch (e) {
      return [];
    }
  };

  const getInheritedAttributes = (row: number, col: number) => {
    const attributes = projectState.getInheritedAttributes(row, col);
    if (attributes !== null) {
      return Array.from(attributes.entries());
    }

    return [];
  };

  // Using an array of tuples since the Map is not reactive!
  let attributes: [string, string][] = $state(getAttributesArray(row, col));

  let inheritedAttributes: [string, string][] = $state(
    getInheritedAttributes(row, col),
  );

  const save = () => {
    if (attributes.length > 0) {
      projectState.updateAttributes(row, col, new Map(attributes));
    } else if (projectState.hasAttributes(row, col)) {
      projectState.deleteAttributes(row, col);
    }
  };
</script>

<AttributesDialog
  title={`Tile attributes for r${row} c${col}`}
  onSave={save}
  bind:attributes
  {inheritedAttributes}
  bind:open
/>
