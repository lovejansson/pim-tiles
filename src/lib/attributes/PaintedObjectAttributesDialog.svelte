<script lang="ts">
  import { projectState, tilemapEditorState } from "../../projectState.svelte";
  import { PaintType, type LayerId } from "../../types";
  import AttributesDialog from "./AttributesDialog.svelte";
  import { imageBitmapToDataURL } from "../../utils";

  type PaintedObjectAttributesDialogProps = {
    row: number;
    col: number;
    open: boolean;
  };

  let { open = $bindable(), row, col }: PaintedObjectAttributesDialogProps =
    $props();

  const getLayerId = (): LayerId<PaintType.OBJECT> => {
    if (tilemapEditorState.type !== PaintType.OBJECT)
      throw new Error("Invalid UI state for painted object attributes");

    return tilemapEditorState.selectedLayer as LayerId<PaintType.OBJECT>;
  };

  const getAttributesArray = (row: number, col: number) => {
    try {
      const attributes = projectState.getPaintedObjectAttributes(
        getLayerId(),
        row,
        col,
      );
      return Array.from(attributes.entries());
    } catch (e) {
      return [];
    }
  };

  const getInheritedAttributes = (row: number, col: number) => {
    const attributes = projectState.getInheritedPaintedObjectAttributes(
      getLayerId(),
      row,
      col,
    );

    if (attributes !== null) {
      return Array.from(attributes.entries());
    }

    return [];
  };

  const getObjectImg = (row: number, col: number): string | undefined => {
    try {
      const painted = projectState.getTileAt(getLayerId(), row, col);
      if (painted === null || painted.type !== PaintType.OBJECT) return undefined;
      const obj = projectState.getObject(painted.ref.id);
      return imageBitmapToDataURL(obj.image.bitmap);
    } catch (e) {
      return undefined;
    }
  };

  // Using an array of tuples since the Map is not reactive!
  let attributes: [string, string][] = $state(getAttributesArray(row, col));

  let inheritedAttributes: [string, string][] = $state(
    getInheritedAttributes(row, col),
  );

  const save = () => {
    if (attributes.length > 0) {
      projectState.updatePaintedObjectAttributes(
        getLayerId(),
        row,
        col,
        new Map(attributes),
      );
    } else if (projectState.hasPaintedObjectAttributes(getLayerId(), row, col)) {
      projectState.deletePaintedObjectAttributes(getLayerId(), row, col);
    }
  };
</script>

<AttributesDialog
  title={`Object attributes at r${row} c${col}`}
  onSave={save}
  bind:attributes
  {inheritedAttributes}
  bind:open
  img={getObjectImg(row, col)}
/>
