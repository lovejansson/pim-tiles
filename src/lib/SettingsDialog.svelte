<script lang="ts">
  import {
    SlInput,
    type SlChangeEvent,
  } from "@shoelace-style/shoelace";
  import { projectState } from "../state.svelte";
  import ConfirmDialog from "./ui/ConfirmDialog.svelte";

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


</style>
