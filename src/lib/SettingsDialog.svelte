<script lang="ts">
  import {
    SlInput,
    type SlChangeEvent,
    type SlHideEvent,
  } from "@shoelace-style/shoelace";
  import {
    guiState,
    projectState,
    ProjectState,
    projectStateEvents,
    ProjectStateEventType,
  } from "../state.svelte";
  import ConfirmDialog from "./common/ConfirmDialog.svelte";

  let { open = $bindable() } = $props();

  const hide = () => {
    open = false;
  };

  let tileSize = $state(projectState.tileSize);
  let cols = $state(projectState.width / projectState.tileSize);
  let rows = $state(projectState.height / projectState.tileSize);
  let name = $state(projectState.name);
  let gridColor = $state(guiState.gridColor);

  let tileSizeError: string | null = $state(null);
  let colsError: string | null = $state(null);
  let rowError: string | null = $state(null);

  let hasChanges = $derived.by(() => {
    return (
      tileSize !== projectState.tileSize ||
      cols !== projectState.width / projectState.tileSize ||
      rows !== projectState.height / projectState.tileSize ||
      name !== projectState.name ||
      gridColor !== guiState.gridColor
    );
  });

  let confirmDialogIsOpen = $state(false);

  $effect(() => {
    projectStateEvents.on(ProjectStateEventType.LOAD_FROM_FILE, () => {
      tileSize = projectState.tileSize;
      cols = projectState.width / projectState.tileSize;
      rows = projectState.height / projectState.tileSize;
      name = projectState.name;
    });
  });

  const handleConfirm = () => {
    projectState.tileSize = tileSize;
    projectState.name = name;
    projectState.width = cols * tileSize;
    projectState.height = rows * tileSize;
    guiState.gridColor = gridColor;
    confirmDialogIsOpen = false;
  };

  const handleCancel = () => {
    confirmDialogIsOpen = false;
  };

  const save = () => {
    if (!hasChanges) return;

    let isValid = true;

    if (!ProjectState.VALID_TILE_SIZES.includes(tileSize)) {
      tileSizeError =
        "Valid tile sizes are " + ProjectState.VALID_TILE_SIZES.join(",");
      isValid = false;
    }

    if (cols > ProjectState.MAX_TILES || cols < 2) {
      colsError = `Valid number of columns are 2-${ProjectState.MAX_TILES}`;
      isValid = false;
    }

    if (rows > ProjectState.MAX_TILES || rows < 2) {
      rowError = `Valid number of rows are 2-${ProjectState.MAX_TILES} tiles`;
      isValid = false;
    }

    if (!isValid) return;

    if (
      tileSize !== projectState.tileSize ||
      cols !== projectState.width / projectState.tileSize ||
      rows !== projectState.height / projectState.tileSize
    ) {
      confirmDialogIsOpen = true;
      return;
    }

    projectState.name = name;
    guiState.gridColor = gridColor;
  };
</script>

<sl-dialog onsl-after-hide={hide} label="Settings" {open}>
  <sl-icon-button
    slot="header-actions"
    library="pixelarticons"
    name="close"
    onclick={hide}
    style="font-size: 1.6rem;"
  >
  </sl-icon-button>
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
  <div class="input-wrapper">
    <sl-input
      onsl-change={(e: SlChangeEvent) => {
        if (colsError !== null) colsError = null;
        if (e.target) {
          cols = Math.round(+(e.target as SlInput).value);
        }
      }}
      no-spin-buttons
      label="Cols"
      type="number"
      value={cols}
    >
      <span slot="suffix">tiles</span>
    </sl-input>

    {#if colsError}
      <p class="error">{colsError}</p>
    {/if}
  </div>
  <div class="input-wrapper">
    <sl-input
      onsl-change={(e: SlChangeEvent) => {
        if (rowError !== null) rowError = null;
        if (e.target) {
          rows = Math.round(+(e.target as SlInput).value);
        }
      }}
      no-spin-buttons
      label="Rows"
      type="number"
      value={rows}
    >
      <span slot="suffix">tiles</span>
    </sl-input>

    {#if rowError}
      <p class="error">{rowError}</p>
    {/if}
  </div>
  <div class="input-wrapper">
    <sl-input
      onsl-change={(e: SlChangeEvent) => {
        if (tileSizeError !== null) tileSizeError = null;
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

    {#if tileSizeError}
      <p class="error">{tileSizeError}</p>
    {/if}
  </div>

  <div id="wrapper-grid-color">
    <p id="label-grid-color">Grid color</p>
    <sl-color-picker
      onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()}
      swatches="#000000; #FFFFFF; #2ada64; #bb46eb; #FFD700; #00BFFF;
    "
      value={gridColor}
      onsl-change={(e: SlChangeEvent) => {
        if (e.target) {
          gridColor = (e.target as SlInput).value;
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
  sl-dialog::part(close-button) {
    display: none;
  }
  sl-color-picker {
    width: fit-content;
    line-height: 0.8; /** Display block adds height depending on line-height attr*/
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
  }

  .error {
    color: var(--sl-color-rose-600);
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
