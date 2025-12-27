<script lang="ts">
  import { guiState } from "../state.svelte";
  import Object from "./ObjectItem.svelte";
  import { PaintType, type ImageLayerState } from "../types";


  const tilemapEditorState = $derived.by((): ImageLayerState => {
    if (guiState.tilemapEditorState.type === PaintType.IMAGE)
      return guiState.tilemapEditorState;

    throw new Error("Invalid UI state");
  });

  const removeSelection = (e: MouseEvent) => {
    for (const i of tilemapEditorState.selectedLayer.data) {
      i.isSelected = false;
    }
  };

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section onclick={removeSelection} id="objects">
  <header>
    <h2>Objects</h2>
  </header>
  {#if tilemapEditorState.selectedLayer.data.length === 0}
    <div id="no-objects">
        <sl-icon library="pixelarticons" name=PaintType.IMAGE></sl-icon>
    </div>
  {:else}
  <ul>
    {#each tilemapEditorState.selectedLayer.data as object, idx}
      <li><Object object={object} /></li>
    {/each}
  </ul>
  {/if}
</section>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  #objects {
    width: 320px !important;
    height: 100%;
  }

  #no-objects {
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
    gap: 1rem;
  }
  li {
    cursor: pointer;
  }
</style>
