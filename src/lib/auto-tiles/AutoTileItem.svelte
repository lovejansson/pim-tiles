<script lang="ts">
  import { SlMenuItem } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../../state.svelte";
  import ContextMenu from "../common/ContextMenu.svelte";
  import {
    type AutoTileLayerState,
    type AutoTile,
    PaintType,
  } from "../../types";
  import AutoTileDialog from "./AutoTileDialog.svelte";

  type Props = {
    autoTile: AutoTile;
  };

  const tilemapEditorState = $derived.by((): AutoTileLayerState => {
    if (guiState.tilemapEditorState.type === PaintType.AUTO_TILE)
      return guiState.tilemapEditorState;

    throw new Error("Invalid UI state");
  });

  let { autoTile }: Props = $props();

  let dialogIsOpen = $state(false);

  const handleSelectMenuItem = (item: SlMenuItem) => {
    if (item.value === "delete") {
      projectState.deleteAutoTile(autoTile.id);
    } else if (item.value === "edit") {
      dialogIsOpen = true;
    }
  };

  const selectAutoTile = () => {
    tilemapEditorState.selectedAsset = {
      type: PaintType.AUTO_TILE,
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
  <sl-button
    id="auto-tile-item"
    variant="text"
    class:selected={tilemapEditorState.selectedAsset?.ref.id === autoTile.id}
    onclick={selectAutoTile}
  >
    {autoTile.name}
  </sl-button>
</ContextMenu>

{#if dialogIsOpen}
  <AutoTileDialog bind:open={dialogIsOpen} {autoTile} />
{/if}

<style lang="postcss">
  #auto-tile-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .selected::part(base) {
    border: 1px solid var(--color-0);
    background-color: yellow;
  }
</style>
