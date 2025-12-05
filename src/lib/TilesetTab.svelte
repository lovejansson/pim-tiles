<script lang="ts">
    import {
        SlInput,
        type SlChangeEvent,
    } from "@shoelace-style/shoelace";
    import { projectState } from "../state.svelte";
    import ContextMenu from "./ContextMenu.svelte";

    let { tilesetIdx } = $props();

    let isEditingName = $state(false);

    const handleSelectMenuItem = (item: any) => {
        if (item.value === "delete") {
            projectState.tilesets.splice(tilesetIdx, 1);
        } else if (item.value === "rename") {
            isEditingName = true;
            requestAnimationFrame(() => {
                if (inputName !== null) inputName.focus();
            });
        }
    };

    let inputName: SlInput;
</script>

<ContextMenu
    onSelect={handleSelectMenuItem}
    menuItems={[
        { label: "Rename", value: "rename", icon: "edit-box" },
        { label: "Delete", value: "delete", icon: "close" },
    ]}
>
    {#if isEditingName}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
            <sl-input maxLength=15 style={`width: ${projectState.tilesets[tilesetIdx].name.length * 8.4}px`} value={projectState.tilesets[tilesetIdx].name} size="small" bind:this={inputName} onkeydown={(e: KeyboardEvent) => {
                if(e.key === "Enter") {
                    isEditingName = false;
                }
                console.log(e.key)
            }} onblur={()=> isEditingName = false} onsl-change={(e: SlChangeEvent) => {
                projectState.tilesets[tilesetIdx].name = (e.target as SlInput).value;
            }}></sl-input>
    {:else}

        <p>{projectState.tilesets[tilesetIdx].name}</p>
    {/if}
</ContextMenu>

<style lang="postcss">

    sl-input {
        max-width: 300px;
    }
 
    p {
        margin: 0;
       
    }
</style>
