<script lang="ts">
  import TilemapEditor from "./lib/TilemapEditor.svelte";
  import Toast from "./lib/common/Toast.svelte";
  import ToolBar from "./lib/ToolBar.svelte";
  import Load from "./Load.svelte";
  import { broadcastChannelService } from "./BroadcastChannelService";

  let loading = $state(true);
  let anotherTabHasUpdatedStateDialog = $state(false);

  $effect(() => {
    broadcastChannelService.listen((event: MessageEvent<string>) => {
      if (event.data === "indexed-db-update") {
        anotherTabHasUpdatedStateDialog = true;
      }
    });
  });

  const reload = () => {
    anotherTabHasUpdatedStateDialog = false;
    window.location.reload();
  };
</script>

<svelte:boundary>
  {#if loading}
    <Load bind:loading />
  {:else}
    <Toast />

    <div id="content">
      <ToolBar />
      <TilemapEditor />
    </div>

    {#snippet failed(error, reset)}
      <div id="error">
        <sl-alert variant="danger" open>
          <sl-icon slot="icon" library="pixelarticons" name="warning-diamond"
          ></sl-icon>

          <strong style="display:flex;align-items: center; gap:4px;"
            >Something crashed <sl-icon library="pixelarticons" name="annoyed"
            ></sl-icon></strong
          >
          <p>Error: {error && (error as any).message}</p>

          <sl-button style="width:100%;" onclick={reset}>Reload</sl-button>
        </sl-alert>
      </div>
    {/snippet}
  {/if}

  {#if anotherTabHasUpdatedStateDialog}
    <sl-dialog label="Reload" onsl-after-hide={reload} {open}>
      <sl-icon-button
        slot="header-actions"
        library="pixelarticons"
        name="close"
        style="font-size: 1.6rem;"
        onclick={reload}
      >
      </sl-icon-button>
      <p>Project has been modified in another tab!</p>

      <sl-button onclick={reload} slot="footer" variant="primary"
        >Reload</sl-button
      >
    </sl-dialog>
  {/if}
</svelte:boundary>

<style>
  #content {
    display: flex;
    justify-content: flex-start;
    overflow-y: auto;
    flex-grow: 1;
    overflow-x: hidden;
  }

  #error {
    display: flex;
    justify-content: center;
    padding: 1rem;
  }

  sl-alert::part(base) {
    width: fit-content;
  }
  sl-dialog::part(body) {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  sl-dialog {
    --width: 300px;
  }
  sl-dialog::part(close-button) {
    display: none;
  }
</style>
