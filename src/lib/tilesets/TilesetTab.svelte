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
  let name = $state(tileset.name);

  $effect(() => {

    if (tileset.name !== name) {
      try {
        projectState.updateTileset(tileset.id, name);
      } catch (e) {
        const msg = (e as Error).message;
        guiState.notification = {
          msg,
          variant: "danger",
          title: "Failed to update tileset name",
        };
      } finally {
        name = tileset.name;
      }
    }
  });

  const handleSelectMenuItem = (item: any) => {
    if (item.value === "delete") {
      try {
        projectState.deleteTileset(tileset.id);
      } catch (e) {
        const msg = (e as Error).message;
        guiState.notification = {
          msg,
          variant: "danger",
          title: "Failed to delete tileset",
        };
      }
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
    bind:text={name}
    inputWidth={`${name.length * 12}px`}
  />
</ContextMenu>

<style lang="postcss">
</style>
