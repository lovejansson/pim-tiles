<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import { detectOS, download } from "../utils";
  import SettingsDialog from "./SettingsDialog.svelte";

  const OS = detectOS();
  const isMac = OS === "Mac";

  let settingsDialogIsOpen = $state(false);

  const handleMenuSelect = async (e: CustomEvent) => {
    switch (e.detail.item.value) {
      case "create":
        break;
      case "open":
        break;
      case "save":
        break;
      case "export-json":
        const json = projectState.getJSONExport();
        const blob = new Blob([json], {
          type: "application/json",
        });
        download(blob, projectState.name, "json");
        break;
      case "export-png":
        {
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
        }
        break;
      case "settings":
        settingsDialogIsOpen = true;
        break;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const ctrlOrCommandKeyIsDown =
      (e.metaKey && isMac) ||
      (e.ctrlKey && (OS === "Windows" || OS === "Other"));

    const isSaveCommand = e.key.toLowerCase() === "s" && ctrlOrCommandKeyIsDown;
    const isCreateCommand =
      e.key.toLowerCase() === "c" && ctrlOrCommandKeyIsDown;
    const isOpenCommand = e.key.toLowerCase() === "o" && ctrlOrCommandKeyIsDown;

    if (isSaveCommand) {
      e.preventDefault();
    } else if (isOpenCommand) {
      e.preventDefault();
    } else if (isCreateCommand) {
      e.preventDefault();
    }
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

<sl-dropdown>
  <sl-button size="small" variant="primary" slot="trigger">Project</sl-button>
  <sl-menu onsl-select={handleMenuSelect}>
    <p>{projectState.name}</p>
    <sl-menu-item value="create"
      >Create
      <span class="command" slot="suffix">
        {#if isMac}
          <sl-icon library="pixelarticons" name={"command"}></sl-icon>
        {:else}
          Ctrl
        {/if}
        C</span
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
    <sl-menu-item value="settings"
      >Settings <sl-icon slot="suffix" name="gear"></sl-icon></sl-menu-item
    >
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
