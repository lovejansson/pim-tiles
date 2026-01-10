<script lang="ts">
    import { projectState } from "../state.svelte";
    import {
        type TileRule,
        type TileAsset,
        TileRequirement,
        type TileConnections,
    } from "../types";

    type RuleTileButtonProps = {
        ruleTile: Omit<TileRule, "tile"> & { tile: TileAsset | null };
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

    const handleClickBtnDir = (
        e: KeyboardEvent | MouseEvent,
        direction: keyof TileConnections,
        connectionReq: TileRequirement,
    ) => {
        if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter")
            return;
        ruleTile.connections[direction] = getNextReq(connectionReq);
    };
</script>

<div id="wrapper">
    <!-- sl button handles it internally -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div id="btns-directions">
        {#each entries as [direction, connectionReq]}
            <sl-button
                style={`grid-area: ${direction};`}
                onclick={(e: MouseEvent) =>
                    handleClickBtnDir(e, direction, connectionReq)}
                onkeydown={(e: KeyboardEvent) =>
                    handleClickBtnDir(e, direction, connectionReq)}
                size="small"
                class={`${connectionReq} btn-dir`}
            >
            </sl-button>
        {/each}
    </div>

    {#if ruleTile.tile !== null}
        <img
            class="tile"
            src={projectState.tilesets.getTile(
                ruleTile.tile.ref.tileset.id,
                ruleTile.tile.ref.tile.id,
            ).dataURL}
            alt="tile"
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
            aria-label="Place tile here"
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
        gap: 0.25rem;
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

    .btn-dir::part(base) {
        width: 32px;
        height: 32px;
        border: 1px solid var(--color-0);
    }

    .excluded::part(base) {
        background-color: var(--sl-color-rose-600);
    }

    .optional::part(base) {
        background: var(--color-1);
    }

    .required::part(base) {
        background-color: var(--sl-color-rose-600);
        background-color: rgb(106, 231, 106);
    }
</style>
