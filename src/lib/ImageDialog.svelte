<script lang="ts">
  import { guiState } from "../state.svelte";
  import type { Image, } from "../types";

  if (guiState.tilemapEditorState.type !== "image") throw new Error("Invalid UI state");

  type ImageDialogProps = {
    open: boolean;
    image: Image;
  }
  
  let { open = $bindable(), image }: ImageDialogProps = $props();

  const hide = () => {
    open = false;
  };


</script>

<sl-dialog
  label={image.filename}
  onsl-after-hide={hide}
  {open}
>
  <img src={image.dataURL} alt="blueberries" />

</sl-dialog>

<style>
  sl-dialog::part(body) {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  sl-dialog {
    --width: 300px;
  }

  img {
    image-rendering: pixelated;
  }
  
</style>
