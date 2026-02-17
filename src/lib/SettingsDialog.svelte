<script lang="ts">
  import {
    SlInput,
    type SlChangeEvent,
    type SlHideEvent,
  } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../state.svelte";
  import ConfirmDialog from "./common/ConfirmDialog.svelte";

  let { open = $bindable() } = $props();

  const hide = () => {
    open = false;
  };

  let tileSize = $state(projectState.tileSize);
  let confirmTileSizeDialogIsOpen = $state(false);

  const handleConfirm = () => {
    projectState.tileSize = tileSize;
    confirmTileSizeDialogIsOpen = false;
  };

  const handleCancel = () => {
    tileSize = projectState.tileSize;
    confirmTileSizeDialogIsOpen = false;
  };
</script>

<sl-dialog onsl-after-hide={hide} label="Settings" {open}>
  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        projectState.projectName = (e.target as SlInput).value;
      }
    }}
    label="Project name"
    type="text"
    value={projectState.projectName}
  ></sl-input>
  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        tileSize = +(e.target as SlInput).value;
        confirmTileSizeDialogIsOpen = true;
      }
    }}
    placeholder="16 pixels is a good size"
    no-spin-buttons
    label="Tile size"
    type="number"
    value={tileSize}
  >
    <span slot="suffix">px</span>
  </sl-input>

  <div id="wrapper-grid-color">
    <p id="label-grid-color">Grid color</p>
    <sl-color-picker
      onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()}
      swatches="#000000; #FFFFFF; #2ada64; #bb46eb; #FFD700; #00BFFF;
    "
      value={guiState.gridColor}
      onsl-change={(e: SlChangeEvent) => {
        if (e.target) {
          guiState.gridColor = (e.target as SlInput).value;
        }
        e.stopPropagation();
      }}
      label="Grid color"
      size="small"
    ></sl-color-picker>
  </div>
</sl-dialog>

<ConfirmDialog
  open={confirmTileSizeDialogIsOpen}
  label="Change tile size"
  msg="Changing tile size will erase the 
    project. Are you sure you want to do that?"
  cancel={handleCancel}
  confirm={handleConfirm}
/>

<style>
  sl-dialog::part(body) {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    font-size: small;
  }
  sl-color-picker {
    width: fit-content;
    line-height: 0.8; /** Display block adds height depending on line-height attr*/
  }


  #wrapper-grid-color {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  #label-grid-color {
    font-size: 1rem;
    margin: 0;
  }
</style>
