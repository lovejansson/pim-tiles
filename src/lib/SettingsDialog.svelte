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
  let width = $state(projectState.width);
  let height = $state(projectState.height);
  let name = $state(projectState.projectName);

  let hasChanges = $derived.by(() => {
    return (
      tileSize !== projectState.tileSize ||
      width !== projectState.width ||
      height !== projectState.height ||
      name !== projectState.projectName
    );
  });

  let confirmDialogIsOpen = $state(false);

  const handleConfirm = () => {
    projectState.tileSize = tileSize;
    projectState.projectName = name;
    projectState.width = width;
    projectState.height = height;
    confirmDialogIsOpen = false;
  
  };

  const handleCancel = () => {
    confirmDialogIsOpen = false;
  };

  const save = () => {
    if(!hasChanges) return;

    if(tileSize !== projectState.tileSize || width !== projectState.width || height !== projectState.height) {
      confirmDialogIsOpen = true;
      return;
    } 

    projectState.tileSize = tileSize;
    projectState.projectName = name;
    projectState.width = width;
    projectState.height = height;
 

  };
</script>

<sl-dialog onsl-after-hide={hide} label="Settings" {open}>
  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        name = (e.target as SlInput).value;
      }
    }}
    label="Project name"
    type="text"
    value={name}
  ></sl-input>

  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        width = +(e.target as SlInput).value * tileSize;
      }
    }}
    no-spin-buttons
    label="Width"
    type="number"
    value={width / tileSize}
  >
    <span slot="suffix">tiles</span>
  </sl-input>

  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        height = +(e.target as SlInput).value * tileSize;
      }
    }}
    no-spin-buttons
    label="Height"
    type="number"
    value={height / tileSize}
  >
    <span slot="suffix">tiles</span>
  </sl-input>

  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        tileSize = +(e.target as SlInput).value;
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

  <sl-button
    disabled={!hasChanges}
    slot="footer"
    variant="primary"
    onclick={save}
  >
    Save
  </sl-button>
</sl-dialog>

<ConfirmDialog
  open={confirmDialogIsOpen}
  label="Changing map dimensions"
  msg="Changing tile size, width and/or height will erase the 
    content of the tilemap. Are you sure you want to do that?"
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
