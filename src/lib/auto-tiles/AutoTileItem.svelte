<script lang="ts">
  import { guiState, projectState } from "../../state.svelte";
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

  const selectAutoTile = () => {
    tilemapEditorState.selectedAsset = {
      type: PaintType.AUTO_TILE,
      ref: { id: autoTile.id },
    };
  };
</script>

<div>
  <sl-button
    id="auto-tile-item"
    variant="text"
    class:selected={tilemapEditorState.selectedAsset?.ref.id === autoTile.id}
    onclick={selectAutoTile}
  >
    {autoTile.name}
  </sl-button>

  <sl-button-group>
    <sl-icon-button
      library="pixelarticons"
      name="edit"
      onclick={(e: MouseEvent) => {
        e.stopPropagation();
        dialogIsOpen = true;
      }}
    >
    </sl-icon-button>

    <sl-icon-button
      library="pixelarticons"
      name="close"
      onclick={(e: MouseEvent) => {
        e.stopPropagation();
        projectState.deleteAutoTile(autoTile.id);
      }}
    >
    </sl-icon-button>
  </sl-button-group>
</div>

{#if dialogIsOpen}
  <AutoTileDialog bind:open={dialogIsOpen} {autoTile} />
{/if}

<style lang="postcss">
  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

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
