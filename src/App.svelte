<script lang="ts">
  import TilemapEditor from "./lib/TilemapEditor.svelte";
  import Toast from "./lib/common/Toast.svelte";
  import ToolBar from "./lib/ToolBar.svelte";
</script>

<svelte:boundary>
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

          <sl-button style="width:100%;"  onclick={reset}>Reload</sl-button>
      
      </sl-alert>
    </div>
  {/snippet}
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
</style>
