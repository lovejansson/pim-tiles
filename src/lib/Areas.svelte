<script lang="ts">
  import { projectState } from "../state.svelte";
  import AreaItem from "./AreaItem.svelte";
  import CreateNewAreaDialog from "./CreateNewAreaDialog.svelte";

  let createNewAreaDialogIsOpen = $state(false);

</script>


<section id="areas">
  <header>
    <h2>Areas</h2>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
      onclick={() => {
        createNewAreaDialogIsOpen = true;
      }}
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter")      createNewAreaDialogIsOpen = true;
      }}
    >
      <sl-icon label="New area" library="pixelarticons" name="plus"
      ></sl-icon></sl-button
    >
  </header>


    {#if projectState.areas.get().length > 0}
  <ul>
      {#each projectState.areas.get() as area}
        <li>
          <AreaItem area={area} />
        </li>
      {/each}
  </ul>
  {:else}
    <div id="no-areas">
      <sl-icon library="pixelarticons" name="section"></sl-icon>
  
    </div>
      {/if}
</section>

<CreateNewAreaDialog bind:open={createNewAreaDialogIsOpen}/>

<style lang="postcss">
  header {
    display: flex;
    justify-content: space-between;
  }
  #areas {
    display: flex;
    flex-direction: column;

    width: 320px !important;
    height: 100%;
  }

  #no-areas {
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
    gap: 0.5rem;
  }

  li {
    background-color: var(--color-4);
  }



</style>
