<script lang="ts">
  import {
    SlCheckbox,
    SlInput,
    type SlChangeEvent,
    type SlHideEvent,
  } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../../state.svelte";
  import type { Area } from "../../types";

  type AreaDialogProps = {
    area?: Area;
    open: boolean;
  };
  let { open = $bindable(), area }: AreaDialogProps = $props();

  const isEditMode = (area: Area | undefined): area is Area => {
    return area !== undefined;
  };

  const hide = () => {
    open = false;
  };

  let name = $state(isEditMode(area) ? area.name : "New Area");
  let color = $state(isEditMode(area) ? area.color : "yellow");
  let isWalkable = $state(isEditMode(area) ? area.isWalkable : false);

  const saveArea = () => {
    if (isEditMode(area)) {
      try {
        projectState.updateArea({ id: area.id, name, color, isWalkable });
        open = false;
      } catch (e) {
        const msg = (e as Error).message;
        guiState.notification = {
          msg,
          title: "Failed to update area",
          variant: "danger",
        };
      }
    } else {
      try {
        projectState.createArea(name, color, isWalkable);
        open = false;
      } catch (e) {
        const msg = (e as Error).message;
        guiState.notification = {
          msg,
          title: "Failed to create area",
          variant: "danger",
        };
      }
    }
  };
</script>

<sl-dialog onsl-after-hide={hide} label="Create area" {open}>
  <sl-icon-button
    slot="header-actions"
    library="pixelarticons"
    name="close"
    style="font-size: 1.6rem;"
    onclick={hide}
  >
  </sl-icon-button>
  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        name = (e.target as SlInput).value;
      }
    }}
    label="Area name"
    type="text"
    value={name}
  ></sl-input>

  <sl-color-picker
    onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()}
    swatches="#000000; #FFFFFF; #2ada64; #bb46eb; #FFD700; #00BFFF;
    "
    value={color}
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        color = (e.target as SlInput).value;
      }
      e.stopPropagation();
    }}
    label="Border color"
  ></sl-color-picker>

  <sl-checkbox
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        isWalkable = (e.target as SlCheckbox).checked;
      }
    }}
    checked={isWalkable}>Is Walkable</sl-checkbox
  >

  <sl-button variant="primary" onclick={saveArea}>Save</sl-button>
</sl-dialog>

<style>
  sl-dialog::part(body) {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    font-size: small;
  }
  sl-dialog::part(close-button) {
    display: none;
  }
</style>
