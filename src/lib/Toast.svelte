<script lang="ts">
    import type { SlAlert } from "@shoelace-style/shoelace";
    import { guiState } from "../state.svelte";

    
    $effect(() => {
        if(guiState.notification !== null && alert) {
            alert.toast();
        }

    });

    let alert: SlAlert;

</script>


{#if guiState.notification !== null} 
    <div class="alert-toast">

    <sl-alert bind:this={alert} variant={guiState.notification.variant ?? "neutral"} duration="3000" closable>

        <strong>{guiState.notification.title}</strong><br />
        {guiState.notification.msg}
    </sl-alert>

    </div>
{/if}


<style>
    div {
        position: fixed;
        top: 1rem;
        right: 1rem;
    }
</style>


