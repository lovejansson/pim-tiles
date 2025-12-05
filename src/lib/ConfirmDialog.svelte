

<script lang="ts">
let { open,label, msg, confirm, cancel} = $props();
</script>

<sl-dialog label={label} onsl-after-hide={cancel} open={open}>
    <p>{msg}</p> 
    <sl-button onclick={cancel}  slot="footer" variant="default">Cancel</sl-button>
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

</style>
