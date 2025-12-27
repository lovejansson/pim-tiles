<script lang="ts">
  import { guiState, projectState } from "../state.svelte";
  import { bitmapToDataURL } from "../utils";
  import FilePicker from "./ui/FilePicker.svelte";
  import ImageItem from "./ImageItem.svelte";


  if (guiState.tilemapEditorState.type !== "image")
    throw new Error("Invalid UI state");

  const loadImage = async (files: FileList) => {
    try {
      const file = files[0];
      const bitmap = await createImageBitmap(file);
      const dataURL = await bitmapToDataURL(bitmap);
      projectState.images.add(file.name, dataURL, bitmap, bitmap.width, bitmap.height);
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

  {#if projectState.images.get().length > 0}
      <ul>  

      {#each projectState.images.get() as image, idx}
        <li><ImageItem image={image} idx={idx}/></li>
      {/each}
        </ul>
    {:else}
      <div id="div-empty">
        <sl-icon library="pixelarticons" name="image"></sl-icon>
      </div>
    {/if}

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
