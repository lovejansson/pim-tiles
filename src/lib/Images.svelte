<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import { bitmapToDataURL } from "../utils";
  import FilePicker from "./FilePicker.svelte";
  import Image from "./Image.svelte";

  if (guiState.tilemapEditorState.type !== "image")
    throw new Error("Invalid UI state");

  const loadImage = async (files: FileList) => {
    try {
      const file = files[0];
      const bitmap = await createImageBitmap(file);
      const dataURL = await bitmapToDataURL(bitmap);
      projectState.images.push({
        width: bitmap.width,
        height: bitmap.height,
        bitmap,
        dataURL,
        filename: file.name,
      });
    } catch (e) {
      console.error(e);
      guiState.notification = {
        variant: "danger",
        title: "Failed to decode image",
        msg: "Accepted image formats are image/png, image/jpeg, image/webp, image/bmp, image/svg+xml",
      };
    }
  };
</script>

<section id="images">
  <header>
    <h2>Images</h2>

    <FilePicker accept="image/png, image/jpeg" onFile={loadImage} />
  </header>

  <ul>
    {#if projectState.images.length > 0}
      {#each projectState.images as image, idx}
        <li><Image imgIdx={idx} /></li>
      {/each}
    {:else}
      <div id="div-empty">
        <sl-icon library="pixelarticons" name="image"></sl-icon>
      </div>
    {/if}
  </ul>
</section>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #images {
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
