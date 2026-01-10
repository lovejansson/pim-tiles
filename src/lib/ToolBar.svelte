<script lang="ts">
  import { guiState } from "../state.svelte";
    import { PaintType } from "../types";
  import Areas from "./Areas.svelte";
  import AutoTiles from "./AutoTiles.svelte";
  import Layers from "./Layers.svelte";
  import Tilesets from "./Tilesets.svelte";
  import Tools from "./Tools.svelte";
</script>

<section>
  <Layers />

  <sl-divider></sl-divider>
  
  {#if guiState.tilemapEditorState.type === PaintType.TILE}
    <Tools />
    <Tilesets />
  {:else if guiState.tilemapEditorState.type === PaintType.AUTO_TILE}
    <Tools />
    <AutoTiles />
  {:else if guiState.tilemapEditorState.type === PaintType.AREA}
    <Tools />
    <Areas />
    {/if}
</section>

<style lang="postcss">
  section {
    padding: 2rem 1rem;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 400px;
  }

  sl-divider {
    --width: 1px;
    --color: var(--color-2);
  }
</style>
