<script lang="ts">
    import { projectState } from "../state.svelte";
    import {
        type TileRule,
        type TileAsset,
        TileRequirement,
        type TileConnections,
    } from "../types";

    type RuleTileButtonProps = {
        ruleTile: TileRule;
        selectedTile: TileAsset | null;
        onDelete: () => void;
    };
    let {
        ruleTile = $bindable(),
        selectedTile,
        onDelete,
    }: RuleTileButtonProps = $props();

    const getNextReq = (connection: TileRequirement) => {
        switch (connection) {
            case TileRequirement.REQUIRED:
                return TileRequirement.EXCLUDED;
            case TileRequirement.EXCLUDED:
                return TileRequirement.OPTIONAL;
            case TileRequirement.OPTIONAL:
                return TileRequirement.REQUIRED;
        }
    };

    const entries = $derived(
        Object.entries(ruleTile.connections) as [
            keyof TileConnections,
            TileRequirement,
        ][],
    );
</script>

<div id="wrapper">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div id="btns-directions">
        {#each entries as [direction, connectionReq]}
            <sl-button
                style={`grid-area: ${direction};`}
                onclick={() =>
                    (ruleTile.connections[direction] =
                        getNextReq(connectionReq))}
                onkeydown={(e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                        ruleTile.connections[direction] =
                            getNextReq(connectionReq);
                    }
                }}
                size="small"
                class={connectionReq}
            >
            </sl-button>
        {/each}
    </div>

    {#if ruleTile.tile !== null}
        <img
            class="PaintType.TILE"
            src={projectState.tilesets.getTile(
                ruleTile.tile.ref.tileset.id,
                ruleTile.tile.ref.tile.id,
            ).dataURL}
            alt="PaintType.TILE"
        />
    {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <sl-button
            onkeydown={(e: KeyboardEvent) => {
                if (e.key === "Enter" && selectedTile !== null)
                    ruleTile.tile = { ...selectedTile };
            }}
            onclick={() => {
                if (selectedTile !== null) {
                    ruleTile.tile = { ...selectedTile };
                }
            }}
            class="tile-placeholder tile"
        ></sl-button>
    {/if}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-icon-button
        onclick={onDelete}
        onkeydown={(e: KeyboardEvent) => e.key === "Enter" && onDelete()}
        library="pixelarticons"
        name="close"
    >
    </sl-icon-button>
</div>

<style>
    #wrapper {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    #btns-directions {
        display: grid;
        grid-template-areas:
            "nw n ne"
            "e . w"
            "sw s se";
    }

    .tile,
    .tile::part(base) {
        height: 100%;
        width: auto;
        aspect-ratio: 1/1;
        image-rendering: pixelated;
    }

    sl-button {
        --padding: 0;
    }

    sl-button::part(base) {
        width: 32px;
        height: 32px;
    }

    .excluded::part(base) {
        background-color: rgb(64, 255, 64);
    }

    .optional::part(base) {
        background: rgb(61, 8, 255);
    }

    .required::part(base) {
        background-color: var(--sl-color-rose-600);
    }
</style>
