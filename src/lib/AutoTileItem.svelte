<script lang="ts">
  import { SlMenuItem } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../state.svelte";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import type { AutoTileLayerState, AutoTile, IdRef } from "../types";
  import CreateAutoTileDialog from "./AutoTileDialog.svelte";

  type AreaItemProps = {
    autoTile: AutoTile;
    idx: number;
  };
  const tilemapEditorState = $derived.by((): AutoTileLayerState => {
    if (guiState.tilemapEditorState.type === "auto-tile")
      return guiState.tilemapEditorState;

    throw new Error("Invalid UI state");
  });

  let { autoTile, idx }: AreaItemProps = $props();

  let editAutoTileDialogIsOpen = $state(false);

  const handleSelectMenuItem = (item: SlMenuItem) => {
    if (item.value === "delete") {
      const usedInTileLayer = projectState.layers.get().some((layer) => {
        if (layer.type === "auto-tile") {
          for (const tile of layer.data.values()) {
            if (tile.ref.id === autoTile.id) {
              return true;
            }
          }
        }
        return false;
      });

      if (usedInTileLayer) {
        guiState.notification = {
          variant: "danger",
          title: "Delete auto tile",
          msg: "This auto tile is used in one or more area layers and cannot be deleted.",
        };

        return;
      }

      projectState.autoTiles.delete(autoTile.id);

    } else if (item.value === "edit") {
      editAutoTileDialogIsOpen = true;
    }
  };

  const selectAutoTile = () => {
    tilemapEditorState.selectedAsset = {
      type: "auto-tile",
      ref: { id: autoTile.id },
    };
  };
</script>

<ContextMenu
  onSelect={handleSelectMenuItem}
  menuItems={[
    { label: "Edit", value: "edit", icon: "edit" },
    { label: "Delete", value: "delete", icon: "close" },
  ]}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <sl-button
    id="auto-tile-item"
    variant="text"
    class:selected={tilemapEditorState.selectedAsset?.ref.id ===
      autoTile.id}
    onclick={selectAutoTile}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") selectAutoTile();
    }}
  >
    {autoTile.name}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
  </sl-button>
</ContextMenu>

<CreateAutoTileDialog bind:open={editAutoTileDialogIsOpen} {autoTile} {idx} />

<style lang="postcss">
  #auto-tile-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .selected::part(base) {
    border: 1px solid var(--color-0);
    background-color: lime;
  }
</style>
