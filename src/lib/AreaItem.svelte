<script lang="ts">
  import { SlMenuItem } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../state.svelte";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import EditAreaDialog from "./EditAreaDialog.svelte";
  import type { AreaLayerState } from "../types";

  const tilemapEditorState = $derived.by((): AreaLayerState => {
    if (guiState.tilemapEditorState.type === "area")
      return guiState.tilemapEditorState;

    throw new Error("Invalid UI state");
  });

  let { idx } = $props();

  let editAreaDialogOpen = $state(false);

  const handleSelectMenuItem = (item: SlMenuItem) => {
    if (item.value === "delete") {
      projectState.areas.splice(idx, 1);
    } else if (item.value === "edit") {
      editAreaDialogOpen = true;
    }
  };

  const selectArea = () => {
    tilemapEditorState.selectedAsset = { ref: { id: idx } };
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
    id="area"
    variant="text"
    class:selected={tilemapEditorState.selectedAsset?.ref.id === idx}
    onclick={selectArea}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") selectArea();
    }}
  >
    <div
      slot="prefix"
      id="color"
      style={`background-color:${projectState.areas[idx].color}`}
    ></div>
    {projectState.areas[idx].name}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
  </sl-button>
</ContextMenu>

<EditAreaDialog bind:open={editAreaDialogOpen} {idx} />

<style lang="postcss">
  #color {
    border-radius: 50%;
    width: 32px;
    height: 32px;
  }

  #area {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .selected::part(base) {
    border: 1px solid var(--color-0);
  }
</style>
