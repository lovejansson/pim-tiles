<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import type { Tileset } from "../types";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import EditableText from "./ui/EditableText.svelte";

  type TilesetTabProps = {
    tileset: Tileset;
    idx: number;
  };

  let { tileset, idx }: TilesetTabProps = $props();

  let isEditingName = $state(false);

  const handleSelectMenuItem = (item: any) => {

    if (item.value === "delete") {

      const usedInTileLayer = projectState.layers.some((layer) => {

        if (layer.type === "tile") {
          
          for (const tileRef of layer.data.values()) {
            if (tileRef.tileset.id === tileset.id) {
              return true;
            }
          }
        }

        return false;

      });

      if(usedInTileLayer) {
        
        guiState.notification = {
          variant: "danger",
          title: "Delete tileset",
          msg: "This tileset is used in one or more tile layers and cannot be deleted.",
        };

        return;
      }

      projectState.tilesets.splice(idx, 1);

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
