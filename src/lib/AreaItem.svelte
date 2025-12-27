<script lang="ts">
  import { SlMenuItem } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../state.svelte";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import EditAreaDialog from "./EditAreaDialog.svelte";
  import { PaintType, type Area, type AreaLayerState } from "../types";

  type AreaItemProps = {
    area: Area;
  };
  const tilemapEditorState = $derived.by((): AreaLayerState => {
    if (guiState.tilemapEditorState.type === PaintType.AREA)
      return guiState.tilemapEditorState;

    throw new Error("Invalid UI state");
  });

  let { area }: AreaItemProps = $props();

  let editAreaDialogOpen = $state(false);

  const handleSelectMenuItem = (item: SlMenuItem) => {
    if (item.value === "delete") {
      projectState.areas.delete(area.id);
    } else if (item.value === "edit") {
      editAreaDialogOpen = true;
    }
  };

  const selectArea = () => {
    tilemapEditorState.selectedAsset = {
      type: PaintType.AREA,
      ref: { id: area.id },
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
    id="PaintType.AREA"
    variant="text"
    class:selected={tilemapEditorState.selectedAsset?.ref.id === area.id}
    onclick={selectArea}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") selectArea();
    }}
  >
    <div
      slot="prefix"
      id="color"
      style={`background-color:${area.color}`}
    ></div>
    {area.name}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
  </sl-button>
</ContextMenu>

<EditAreaDialog bind:open={editAreaDialogOpen} {area} />

<style lang="postcss">
  #color {
    border-radius: 50%;
    width: 32px;
    height: 32px;
  }

  .selected::part(base) {
    border: 1px solid var(--color-0);
  }
</style>
