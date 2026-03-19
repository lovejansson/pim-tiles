<script lang="ts">
  import AutoTileDialog from "./AutoTileDialog.svelte";
  import { projectState } from "../../projectState.svelte";
  import AutoTileItem from "./AutoTileItem.svelte";

  let dialogIsOpen = $state(false);

</script>

<section id="auto-tiles">
  <header>
    <h2>Auto tiles</h2>

    <sl-button
      onclick={() => {
        dialogIsOpen = true;
      }}
      ><sl-icon label="New auto tile" library="pixelarticons" name="plus"
      ></sl-icon></sl-button
    >
  </header>

  {#if projectState.getAutoTiles().length > 0}
    <ul>
      {#each projectState.getAutoTiles() as autoTile}
        <li>
          <AutoTileItem {autoTile} />
        </li>
      {/each}
    </ul>
  {:else}
    <div id="div-empty">
      <sl-icon library="pixelarticons" name="chess"></sl-icon>
    </div>
  {/if}

  {#if dialogIsOpen}
    <AutoTileDialog bind:open={dialogIsOpen} />
  {/if}
</section>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #auto-tiles {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  #div-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  ul {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  li {
    width: 100%;
  }
</style>
