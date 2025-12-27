<script lang="ts">
    import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
    import { projectState } from "../state.svelte";
    import {
        type TileRule,
        type TileAsset,
        type AutoTile,
        PaintType,
        TileRequirement,
    } from "../types";
    import RuleTileButton from "./RuleTileButton.svelte";

    type AutoTileDialogProps = {
        idx?: number;
        autoTile?: AutoTile;
        open: boolean;
    };

    let { open = $bindable(), autoTile, idx }: AutoTileDialogProps = $props();

    const hide = () => {
        open = false;
    };

    let selectedTile: TileAsset | null = $state(null);

    let name = $state(autoTile?.name ?? "New auto tile");

    const create16EmptyRules = (): TileRule[] => {
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
                    }) as TileRule,
            );
    };

    let rules: TileRule[] = $state(autoTile?.rules ?? create16EmptyRules());

    let isValid = $derived.by(() => {
        if (name === "") return false;

        if (rules.length === 0) return false;

        return true;
    });

    const saveRule = () => {
        if (autoTile !== undefined && idx !== undefined) {
            projectState.autoTiles.update(autoTile.id, { name, rules });
        } else {
            projectState.autoTiles.add(name, rules);
        }

        name = autoTile?.name ?? "New auto tile";
        rules = autoTile?.rules ?? [];
        open = false;
    };

    const newRule = () => {
        rules.push({
            id: crypto.randomUUID(),
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
            tile: null,
        });
    };

    const deleteRule = (idx: number) => {
        rules.splice(idx, 1);
    };
</script>

<sl-dialog onsl-after-hide={hide} label="Create auto tile" {open}>
    <div id="content-wrapper">
        <section id="add-rules">
            <sl-input
                onsl-change={(e: SlChangeEvent) => {
                    if (e.target) {
                        name = (e.target as SlInput).value;
                    }
                }}
                label="Name"
                type="text"
                value={name}
            >
            </sl-input>

            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <sl-button
                onclick={newRule}
                onkeydown={(e: KeyboardEvent) => {
                    if (e.key === "Enter") newRule();
                }}
            >
                Add rule
                <sl-icon label="Add rule" library="pixelarticons" name="plus"
                ></sl-icon></sl-button
            >

            <section id="section-help">
                <ul class="edges">
                    {#each [TileRequirement.REQUIRED, TileRequirement.EXCLUDED, TileRequirement.OPTIONAL] as edge}
                        <li class="edge">
                            <div class={`${edge} edge-mark`}></div>
                            <p>{edge.toLocaleString()}</p>
                        </li>
                    {/each}
                </ul>
            </section>

            <ul id="rules">
                {#each rules as rule, idx}
                    <RuleTileButton
                        onDelete={() => deleteRule(idx)}
                        {selectedTile}
                        bind:ruleTile={rules[idx]}
                    />
                {/each}
            </ul>
        </section>

        {#if projectState.tilesets.get().length > 0}
            <sl-tab-group id="tilesets">
                {#each projectState.tilesets.get() as tileset}
                    <sl-tab slot="nav" panel={tileset.name}
                        >{tileset.name}</sl-tab
                    >
                    <sl-tab-panel name={tileset.name}>
                        <ul class="tiles">
                            {#each tileset.tiles as tile, tileIdx}
                                <li
                                    class:selected={selectedTile &&
                                        selectedTile.ref.tileset.id ===
                                            tileset.id &&
                                        selectedTile.ref.tile.id === tile.id}
                                >
                                    <button
                                        onclick={() =>
                                            (selectedTile = {
                                                type: PaintType.TILE,
                                                ref: {
                                                    tile: { id: tile.id },
                                                    tileset: { id: tileset.id },
                                                },
                                            })}
                                        class="btn-tile"
                                    >
                                        <img
                                            class="img-tile"
                                            src={tile.dataURL}
                                            alt="PaintType.TILE"
                                        /></button
                                    >
                                </li>
                            {/each}
                        </ul>
                    </sl-tab-panel>
                {/each}
            </sl-tab-group>
        {:else}
            <sl-tab-group id="tilesets">
                <sl-tab slot="nav" panel={"empty"}>Load tileset</sl-tab>
                <sl-tab-panel name={"empty"}>
                    <div id="div-empty">
                        <sl-icon library="pixelarticons" name="chess"></sl-icon>
                    </div>
                </sl-tab-panel>
            </sl-tab-group>
        {/if}
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
        disabled={!isValid}
        slot="footer"
        variant="primary"
        onclick={saveRule}
        onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter") saveRule();
        }}
    >
        Save
    </sl-button>
</sl-dialog>

<style>
    .edges {
        display: flex;
        gap: 1rem;
    }
    .edge {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    .edge-mark {
        width: 1em;
        height: 1em;
    }

    .excluded {
        background-color: rgb(64, 255, 64);
    }

    .optional {
        background: rgb(61, 8, 255);
    }

    .required {
        background-color: var(--sl-color-rose-600);
    }

    sl-dialog {
        --width: 50%;
        height: 50%;
    }
    #content-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: stretch;

        height: 60dvh;
        width: 100%;
        gap: 1rem;
    }
    #add-rules {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow-y: auto;
        flex: 1;
        padding: 1rem;
    }

    #tilesets {
        padding: 1rem;
        flex: 1;
    }

    #div-empty {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    #rules {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow-y: auto;
    }

    .tiles {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        margin: 0;
        width: 100%;

        gap: 1px;
    }

    .btn-tile {
        aspect-ratio: 1/1;
        width: 100%;
        height: 100%;
        border: none;
        background-color: none;
        padding: 0;
        cursor: pointer;
    }

    .img-tile {
        aspect-ratio: 1/1;
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
    }

    .selected {
        outline: 1px solid lime !important;
    }

    sl-tab {
        padding: 0;
    }

    sl-tab-panel::part(base) {
        height: 100%;
        width: 100%;
        height: 55dvh;
    }

    sl-tab-panel {
        background-color: var(--color-4);
        --padding: 0;
        height: 100%;

        /* height: 240px; */
    }
</style>
