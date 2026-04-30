<script lang="ts">
  import { projectState } from "../../projectState.svelte";
  import type { Object } from "../../types";
  import { imageBitmapToDataURL } from "../../utils";
  import AttributesDialog from "./AttributesDialog.svelte";

  type ObjectAttributesDialogProps = {
    object: Object;
    open: boolean;
  };

  let { open = $bindable(), object }: ObjectAttributesDialogProps = $props();

  const getObjectAttributesArray = (objectId: string) => {
    try {
      const attributes = projectState.getObjectAttributes(objectId);
      return Array.from(attributes.entries());
    } catch (e) {
      return [];
    }
  };

  // Using an array of tuples since the Map is not reactive!
  let attributes: [string, string][] = $state(
    object !== undefined ? getObjectAttributesArray(object.id) : [],
  );

  const save = () => {
    if (attributes.length > 0) {
      projectState.updateObjectAttributes(object.id, new Map(attributes));
    } else if (projectState.hasObjectAttributes(object.id)) {
      projectState.deleteObjectAttributes(object.id);
    }
  };
</script>

<AttributesDialog
  title="Object attributes"
  onSave={save}
  bind:attributes
  bind:open
  img={imageBitmapToDataURL(object.image.bitmap)}
/>
