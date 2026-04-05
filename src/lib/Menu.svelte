<script lang="ts">
  import {
    guiState,
    projectState,
    setAllLayersVisible,
    updateTilemapEditorState,
  } from "../projectState.svelte";
  import { Tool } from "../types";
  import { download } from "../utils";
  import SettingsDialog from "./SettingsDialog.svelte";

  let settingsDialogIsOpen = $state(false);

  const open = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.showPicker();

    input.addEventListener("change", async () => {
      try {
        await projectState.openFile(input.files![0]); // .files is not null on inputs with type file

        const firstLayer = projectState.getLayers()[0];

        updateTilemapEditorState({
          type: firstLayer.type,
          selectedLayer: firstLayer.id,
          fillToolIsActive: false,
          selectedAsset: null,
          selectedTool: Tool.PAINT,
          selection: { tiles: [] },
        });

        setAllLayersVisible();
      } catch (e) {
        console.error(e);
        guiState.notification = {
          msg: (e as Error).message,
          variant: "danger",
          title: "Failed to load file",
        };
      } finally {
        input.value = "";
      }
    });
  };

  const save = async () => {
    const blob = await projectState.getFileExport();
    download(blob, projectState.name, "json");
  };

  const exportPNG = async () => {
    try {
      const blob = await projectState.getPNGExport();
      download(blob, projectState.name, "png");
    } catch (e) {
      guiState.notification = {
        msg: (e as Error).message,
        variant: "danger",
        title: "Failed to download PNG",
      };
    }
  };

  const exportJSON = () => {
    const blob = projectState.getJSONExport();
    download(blob, `tilemap-${projectState.name}`, "json");
  };

  const createNew = () => {
    projectState.createNewProject();
    const firstLayer = projectState.getLayers()[0];

    updateTilemapEditorState({
      type: firstLayer.type,
      selectedLayer: firstLayer.id,
      fillToolIsActive: false,
      selectedAsset: null,
      selectedTool: Tool.PAINT,
      selection: { tiles: [] },
    });

    setAllLayersVisible();
  };

  const handleMenuSelect = async (e: CustomEvent) => {
    switch (e.detail.item.value) {
      case "new":
        createNew();
        break;
      case "open":
        open();
        break;
      case "save":
        save();
        break;
      case "export-json":
        exportJSON();
        break;
      case "export-png":
        exportPNG();
        break;
      case "settings":
        settingsDialogIsOpen = true;
        break;
      case "how-to":
        const a = document.createElement("a");
        a.href =
          "https://github.com/lovejansson/pim-tiles/blob/main/USER_GUIDE.md";
        a.target = "_blank";
        a.click();
        break;
    }
  };
</script>

<sl-dropdown>
  <sl-button size="small" variant="primary" slot="trigger">Project</sl-button>
  <sl-menu onsl-select={handleMenuSelect}>
    <p>{projectState.name}</p>
    <sl-menu-item value="new">New </sl-menu-item>
    <sl-menu-item value="open">Open </sl-menu-item>
    <sl-menu-item value="save">Save </sl-menu-item>

    <sl-menu-item value="export-json">Export JSON</sl-menu-item>
    <sl-menu-item value="export-png">Export PNG</sl-menu-item>
    <sl-menu-item value="settings">Settings </sl-menu-item>
    <sl-menu-item value="how-to">How to</sl-menu-item>
    <p><small>&copy Pimpixels 2026</small></p>
  </sl-menu>
</sl-dropdown>

{#if settingsDialogIsOpen}
  <SettingsDialog bind:open={settingsDialogIsOpen} />
{/if}

<style>
  sl-menu {
    width: 300px;
  }
  p {
    padding: 0px 1.8rem;
    font-weight: 500;
  }
</style>
