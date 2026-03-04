<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import { Tool } from "../types";
  import { detectOS, download } from "../utils";
  import SettingsDialog from "./SettingsDialog.svelte";

  const OS = detectOS();
  const isMac = OS === "Mac";

  let settingsDialogIsOpen = $state(false);

  const open = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.showPicker();

    fileInput.addEventListener("change", async (e: Event) => {
      try {
        if (e.currentTarget === null)
          alert("current Target is null unclear why");
        const input = e.currentTarget as HTMLInputElement;

        if (input.files !== null) {
          await projectState.loadFile(input.files[0]);

          const firstLayer = projectState.getLayers()[0];

          guiState.tilemapEditorState = {
            type: firstLayer.type,
            selectedLayer: firstLayer.id,
            selectedAsset: null,
            selectedTool: Tool.PAINT,
            fillToolIsActive: false,
          };
        } else {
          console.error("Why is files null?");
        }
      } catch (e) {
        console.error(e);
        guiState.notification = {
          msg: (e as Error).message,
          variant: "danger",
          title: "Failed to load file",
        };
      } finally {
        fileInput.value = "";
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
    download(blob, projectState.name, "json");
  };

  const createNew = () => {
    projectState.reset();

    const firstLayer = projectState.getLayers()[0];

    guiState.tilemapEditorState = {
      type: firstLayer.type,
      selectedLayer: firstLayer.id,
      selectedAsset: null,
      selectedTool: Tool.PAINT,
      fillToolIsActive: false,
    };
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

  const handleKeyDown = (e: KeyboardEvent) => {
    const ctrlOrCommandKeyIsDown =
      (e.metaKey && isMac) ||
      (e.ctrlKey && (OS === "Windows" || OS === "Other"));

    const isSaveCommand = e.key.toLowerCase() === "s" && ctrlOrCommandKeyIsDown;
    const isCreateCommand =
      e.key.toLowerCase() === "n" && ctrlOrCommandKeyIsDown;
    const isOpenCommand = e.key.toLowerCase() === "o" && ctrlOrCommandKeyIsDown;

    if (isSaveCommand) {
      save();
      e.preventDefault();
    } else if (isOpenCommand) {
      open();
      e.preventDefault();
    } else if (isCreateCommand) {
      createNew();
      e.preventDefault();
    }
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

<sl-dropdown>
  <sl-button size="small" variant="primary" slot="trigger">Project</sl-button>
  <sl-menu onsl-select={handleMenuSelect}>
    <p>{projectState.name}</p>
    <sl-menu-item value="new"
      >New
      <span class="command" slot="suffix">
        {#if isMac}
          <sl-icon library="pixelarticons" name={"command"}></sl-icon>
        {:else}
          Ctrl
        {/if}
        N</span
      ></sl-menu-item
    >
    <sl-menu-item value="open"
      >Open
      <span class="command" slot="suffix">
        {#if isMac}
          <sl-icon library="pixelarticons" name={"command"}></sl-icon>
        {:else}
          Ctrl
        {/if}
        O</span
      >
    </sl-menu-item>
    <sl-menu-item value="save"
      >Save <span class="command" slot="suffix">
        {#if isMac}
          <sl-icon library="pixelarticons" name={"command"}></sl-icon>
        {:else}
          Ctrl
        {/if}
        S
      </span>
    </sl-menu-item>

    <sl-menu-item value="export-json">Export JSON</sl-menu-item>
    <sl-menu-item value="export-png">Export PNG</sl-menu-item>
    <sl-menu-item value="settings">Settings </sl-menu-item>
    <sl-menu-item value="how-to">How to</sl-menu-item>
    <p><small>&copy Pimpixels 2026</small></p>
  </sl-menu>
</sl-dropdown>

<SettingsDialog bind:open={settingsDialogIsOpen} />

<style>
  sl-menu {
    width: 300px;
  }
  p {
    padding: 0px 1.8rem;
    font-weight: 500;
  }

  .command {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }
</style>
