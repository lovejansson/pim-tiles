<script lang="ts">
  import type { SlInput, SlMenuItem } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../state.svelte";
  import { bitmapToDataURL } from "../utils";
  import Image from "./Image.svelte";
  import Object from "./Object.svelte";
  import type { ImageLayerState } from "../types";

  const tilemapEditorState = $derived.by((): ImageLayerState => {
    if (guiState.tilemapEditorState.type === "image")
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
  <ul>
    {#each tilemapEditorState.selectedLayer.data as image, idx}
      <li><Object imgIdx={idx} /></li>
    {/each}
  </ul>
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

  #div-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
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
