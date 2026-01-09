<script lang="ts">
    import { projectState } from "../state.svelte";
    import {
        type TileRule,
        type TileAsset,
        TileRequirement,
        type TileConnections,
        type TileRef,
        type Tileset,
        type Tile,
    } from "../types";

    type RuleTileButtonProps = {
        tileset: Tileset;
        tile: Tile;
        ruleTile?: TileRule;
        onDelete: (tile: TileRef) => void;
        onAdd: (tile: TileRef) => void;
    };
    let {
        tileset,
        tile,
        ruleTile = $bindable(),
        onDelete,
        onAdd,
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

    const create16EmptyRules = (): (Omit<TileRule, "tile"> & {
        tile: null;
    })[] => {
        return Array(16)
            .fill(null)
            .map(
                (_) =>
                    ({
                        id: crypto.randomUUID(),
                        tile: null,
                        connections: {
                            n: TileRequirement.OPTIONAL,
                            ne: TileRequirement.OPTIONAL,
                            e: TileRequirement.OPTIONAL,
                            se: TileRequirement.OPTIONAL,
                            s: TileRequirement.OPTIONAL,
                            sw: TileRequirement.OPTIONAL,
                            w: TileRequirement.OPTIONAL,
                            nw: TileRequirement.OPTIONAL,
                        },
                    }) as Omit<TileRule, "tile"> & { tile: null },
            );
    };

    const ruleTileConnections = $derived(
        Object.entries(
            ruleTile !== undefined
                ? ruleTile.connections
                : create16EmptyRules(),
        ) as [keyof TileConnections, TileRequirement][],
    );
</script>

<div id="wrapper">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <img class="img-tile" src={tile.dataURL} alt="PaintType.TILE" />
    <!-- 
        {#if ruleTileConnections && ruleTile}
            {#each ruleTileConnections as [direction, connectionReq]}
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
        {:else}
        
        {/if}
    </div> -->

        <sl-button
                style={`grid-area: c`}
                size="small"
                id="btn-center"
            >
            </sl-button>
            
</div>

<style>
    #wrapper {
        display: flex;
        gap: 1rem;
        align-items: center;
        position: relative;
    }

    #btns-directions {
        position: absolute;
        display: grid;
        grid-template-areas:
            "nw n ne"
            "e c w"
            "sw s se";
    }

    #btn-center {
        position: absolute;
        top: 50%;
        left: 50%;
        /* transform: translate(-50%, -50%); */
    }

    img {
        position: relative;
        width: 64px;
        height: 64px;
        image-rendering: pixelated;
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
