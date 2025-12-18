<script lang="ts">
  type FilePickerProps = {
    onFile: (files: FileList) => void;
    accept: string;
  };
  let { onFile, accept }: FilePickerProps = $props();

  const onChange = async (e: { currentTarget: HTMLInputElement }) => {
    try {
      if (e.currentTarget === null) alert("error");
      const input = e.currentTarget;
      if (input.files !== null) {
        onFile(input.files!);
      } else {
        console.error("Why is files null?");
      }
    } catch (e) {
      console.error(e);
    } finally {
      fileInput.value = "";
    }
  };

  let fileInput: HTMLInputElement;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<sl-button
  onkeydown={(e: KeyboardEvent) => {
    if (e.key === "Enter") fileInput.showPicker();
  }}
  onclick={() => fileInput?.showPicker()}
>
  <sl-icon label="Load file" library="pixelarticons" name="upload"></sl-icon>
</sl-button>

<input
  bind:this={fileInput}
  type="file"
  style="display:none;"
  {accept}
  onchange={onChange}
/>
