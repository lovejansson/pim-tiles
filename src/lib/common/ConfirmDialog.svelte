<script lang="ts">
  let { open, label, msg, confirm, cancel } = $props();

  const hide = () => {
    open = false;
  };
</script>

<sl-dialog {label} onsl-after-hide={cancel} {open}>
  <sl-icon-button
    slot="header-actions"
    library="pixelarticons"
    name="close"
    onclick={hide}
  >
  </sl-icon-button>
  <p>{msg}</p>

  <sl-button onclick={cancel} slot="footer" variant="default">Cancel</sl-button>

  <sl-button onclick={confirm} slot="footer" variant="primary">Yes</sl-button>
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
  sl-dialog::part(close-button) {
    display: none;
  }
</style>
