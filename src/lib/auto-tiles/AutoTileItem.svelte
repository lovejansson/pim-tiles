<script lang="ts">
  import {
    guiState,
    projectState,
    ProjectStateError,
    tilemapEditorState,
  } from "../../projectState.svelte";
  import {
    type AutoTile,
    PaintType,
    type TilemapEditorState,
  } from "../../types";
  import AutoTileDialog from "./AutoTileDialog.svelte";

  type Props = {
    autoTile: AutoTile;
  };

  const editorState = $derived.by(
    (): TilemapEditorState<PaintType.AUTO_TILE> => {
      if (tilemapEditorState.type === PaintType.AUTO_TILE)
        return tilemapEditorState;

      throw new Error("Invalid UI state");
    },
  );

  let { autoTile }: Props = $props();

  let dialogIsOpen = $state(false);

  const selectAutoTile = () => {
    editorState.selectedAsset = {
      type: PaintType.AUTO_TILE,
      ref: { id: autoTile.id },
    };
  };
</script>

<div>
  <sl-button
    id="auto-tile-item"
    variant="text"
    class:selected={editorState.selectedAsset?.ref.id === autoTile.id}
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
        try {
          projectState.deleteAutoTile(autoTile.id);
        } catch (e) {
          if (e instanceof ProjectStateError) {
            guiState.notification = {
              variant: "danger",
              title: "Delete autotile",
              msg: e.message,
            };
          } else {
            throw e
          }
        }
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
