<script lang="ts">
  import { projectState } from "../state.svelte";

  let { open = $bindable(), imgIdx } = $props();

  const hide = () => {
    open = false;
  };
</script>

<sl-dialog
  label={projectState.images[imgIdx].filename}
  onsl-after-hide={hide}
  {open}
>
  <img src={projectState.images[imgIdx].dataURL} alt="tree or something" />
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
