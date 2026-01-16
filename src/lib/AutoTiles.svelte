<script lang="ts">
    import CreateAutoTileDialog from "./AutoTileDialog.svelte";
    import { projectState } from "../state.svelte";
    import AutoTileItem from "./AutoTileItem.svelte";

    let createDialogIsOpen = $state(false);
    
</script>

<section id="auto-tiles">
    <header>
        <h2>Auto tiles</h2>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <sl-button
            onkeydown={(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                    createDialogIsOpen = true;
                }
            }}
            onclick={() => {
                createDialogIsOpen = true;
            }}
            ><sl-icon label="New auto tile" library="pixelarticons" name="plus"
            ></sl-icon></sl-button
        >
    </header>

    {#if projectState.autoTiles.get().length > 0}
        <ul>
            {#each projectState.autoTiles.get() as autoTile, idx}
                <li>
                    <AutoTileItem {autoTile} {idx} />
                </li>
            {/each}
        </ul>
    {:else}
        <div id="div-empty">
            <sl-icon library="pixelarticons" name="chess"></sl-icon>
        </div>
    {/if}

    <CreateAutoTileDialog bind:open={createDialogIsOpen} />
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
</style>
