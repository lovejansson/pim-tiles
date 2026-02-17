<script lang="ts">
  import { guiState, projectState } from "../../state.svelte";
  import type { Tileset } from "../../types";
  import ContextMenu from "../common/ContextMenu.svelte";
  import EditableText from "../common/EditableText.svelte";

  type TilesetTabProps = {
    tileset: Tileset;
  };

  let { tileset }: TilesetTabProps = $props();

  let isEditingName = $state(false);

  const handleSelectMenuItem = (item: any) => {

    if (item.value === "delete") {
      projectState.tilesets.delete(tileset.id);

    } else if (item.value === "rename") {
        isEditingName = true;
    }
  };
</script>

<ContextMenu
  onSelect={handleSelectMenuItem}
  menuItems={[
    { label: "Rename", value: "rename", icon: "edit-box" },
    { label: "Delete", value: "delete", icon: "close" },
  ]}
>
  <EditableText
    bind:isEditing={isEditingName}
    text={tileset.name}
    inputWidth={tileset.name.length * 9}
  />
</ContextMenu>

<style lang="postcss">
</style>
