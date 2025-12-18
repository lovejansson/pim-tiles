<script lang="ts">
  let { open, label, msg, confirm, cancel } = $props();
</script>

<sl-dialog {label} onsl-after-hide={cancel} {open}>
  <p>{msg}</p>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <sl-button
    onclick={cancel}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") cancel();
    }}
    slot="footer"
    variant="default">Cancel</sl-button
  >
  
    <!-- svelte-ignore a11y_no_static_element_interactions -->
  <sl-button
    onclick={confirm}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") confirm();
    }}
    slot="footer"
    variant="primary">Yes</sl-button
  >
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
</style>
