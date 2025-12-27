<script lang="ts">
    import {
        SlInput,
        SlSelect,
        type SlChangeEvent,
        type SlHideEvent,
    } from "@shoelace-style/shoelace";
    import { projectState } from "../state.svelte";
    import type { Area } from "../types";

    type EditAreaDialogProps = {
        area: Area;
        open: boolean;
    };
    let { open = $bindable(), area }: EditAreaDialogProps = $props();

    const hide = () => {
        open = false;
    };

    let name = $state(area.name);
    let color = $state(area.color);

    const saveArea = () => {
        projectState.areas.update(area.id, name, color);
        open = false;
    };
</script>

<sl-dialog onsl-after-hide={hide} label="Edit area" {open}>
    <sl-input
        onsl-change={(e: SlChangeEvent) => {
            if (e.target) {
                name = (e.target as SlInput).value;
            }
        }}
        label="Area name"
        type="text"
        value={name}
    ></sl-input>

    <sl-color-picker
        onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()}
        swatches="#000000; #FFFFFF; #2ada64; #bb46eb; #FFD700; #00BFFF;
    "
        value={color}
        onsl-change={(e: SlChangeEvent) => {
            if (e.target) {
                color = (e.target as SlInput).value;
            }
            e.stopPropagation();
        }}
        label="Color"
    ></sl-color-picker>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
        variant="primary"
        onclick={saveArea}
        onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter") saveArea();
        }}>Save</sl-button
    >
</sl-dialog>

<style>
    sl-dialog::part(body) {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
        font-size: small;
    }
</style>
