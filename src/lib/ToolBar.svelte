<script lang="ts">
  import { guiState } from "../state.svelte";
  import Areas from "./Areas.svelte";
  import AutoTiles from "./AutoTiles.svelte";
  import Images from "./Images.svelte";
  import Layers from "./Layers.svelte";
  import Objects from "./Objects.svelte";
  import Scripts from "./Scripts.svelte";
  import Tilesets from "./Tilesets.svelte";
  import Tools from "./Tools.svelte";
</script>

<section id="toolbar">
  <Layers />
  <sl-divider></sl-divider>
  {#if guiState.tilemapEditorState.type === "tile"}
    <Tools />
    <Tilesets />
    <sl-divider></sl-divider>
    <AutoTiles />
  {:else if guiState.tilemapEditorState.type === "area"}
    <Tools />
    <Areas />
  {:else if guiState.tilemapEditorState.type === "image"}
    <Objects />
    <sl-divider></sl-divider>
    <Images />
  {/if}
  <sl-divider></sl-divider>
  <Scripts />
</section>

<style lang="postcss">
  #toolbar {
    padding: 2rem 1rem;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  sl-divider {
    --width: 1px;
    --color: var(--color-2);
  }
</style>
