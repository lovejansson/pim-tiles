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


<!-- svelte-ignore a11y_click_events_have_key_events -->
<sl-button onclick={() => fileInput?.showPicker()}>
  <sl-icon label="Load file" library="pixelarticons" name="upload"></sl-icon>
</sl-button>

<input
  bind:this={fileInput}
  type="file"
  style="display:none;"
  {accept}
  onchange={onChange}
/>
