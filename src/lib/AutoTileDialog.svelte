<script lang="ts">
    import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
    import { guiState, projectState } from "../state.svelte";
    import {
        type TileRule,
        type TileAsset,
        type AutoTile,
        TileRequirement,
    } from "../types";
    import RuleTileButton from "./RuleTileButton.svelte";

    import TilesCanvas from "./TilesCanvas.svelte";

    type AutoTileDialogProps = {
        autoTile?: AutoTile;
        open: boolean;
    };

    let { open = $bindable(), autoTile }: AutoTileDialogProps = $props();

    const hide = () => {
        resetState();
        open = false;
    };

    let selectedTile: TileAsset | null = $state(null);

    let defaultTile: TileAsset | null = $state(autoTile?.defaultTile ?? null);

    let name = $state(autoTile?.name ?? "New auto tile");

    let hasAddedTileRulesByTemplate = $state(false);

    let rules: (Omit<TileRule, "tile"> & { tile: TileAsset | null })[] = $state(
        autoTile?.rules ?? [],
    );

    let isValid = $derived.by(() => {
        if (name === "") return false;

        if (rules.length === 0) return false;

        if (rules.find((r) => r.tile === null)) return false;

        if (defaultTile === null) return false;

        return true;
    });

    const resetState = () => {
        name = autoTile?.name ?? "New auto tile";
        rules = autoTile?.rules ?? [];
        hasAddedTileRulesByTemplate = false;
    };

    const save = (e: MouseEvent | KeyboardEvent) => {

        if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter")
            return;

        if (rules.find((r) => r.tile === null)) {
            guiState.notification = {
                variant: "danger",
                title: "Invalid auto tile",
                msg: "All rules must have a tile assigned.",
            };
            return;
        }

        if (defaultTile === null) {
            guiState.notification = {
                variant: "danger",
                title: "Invalid auto tile",
                msg: "Auto tile must have a default tile.",
            };
            return;
        }

        if (autoTile !== undefined) {
            projectState.autoTiles.update(autoTile.id, {
                name,
                rules: rules as TileRule[],
                defaultTile,
            });
        } else {
            projectState.autoTiles.add(name, rules as TileRule[], defaultTile);
        }

        resetState();
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

    const createRoadTileRules = () => {
        for (let i = 1; i < 16; ++i) {
            // nesw
            // 1000 = 8
            // 0100 = 4
            // 0010 = 2
            // 0001 = 1
            // Check connectivity by anding bits

            rules.push({
                id: crypto.randomUUID(),
                connections: {
                    n:
                        (i & 8) === 8
                            ? TileRequirement.REQUIRED
                            : TileRequirement.EXCLUDED,
                    ne: TileRequirement.EXCLUDED,
                    e:
                        (i & 4) === 4
                            ? TileRequirement.REQUIRED
                            : TileRequirement.EXCLUDED,
                    se: TileRequirement.EXCLUDED,
                    s:
                        (i & 2) === 2
                            ? TileRequirement.REQUIRED
                            : TileRequirement.EXCLUDED,
                    sw: TileRequirement.EXCLUDED,
                    w:
                        (i & 1) === 1
                            ? TileRequirement.REQUIRED
                            : TileRequirement.EXCLUDED,
                    nw: TileRequirement.EXCLUDED,
                },
                tile: null,
            });
        }

        hasAddedTileRulesByTemplate = true;
    };

    const createGroundTileRules = () => {
        // The numbers represent the bitmasks that I want
        for (const n of [3, 6, 7, 9, 11, 12, 13, 14, 15]) {
            rules.push({
                id: crypto.randomUUID(),
                connections: {
                    n:
                        (n & 8) === 8
                            ? TileRequirement.REQUIRED
                            : TileRequirement.EXCLUDED,
                    ne: TileRequirement.OPTIONAL,
                    e:
                        (n & 4) === 4
                            ? TileRequirement.REQUIRED
                            : TileRequirement.EXCLUDED,
                    se: TileRequirement.OPTIONAL,
                    s:
                        (n & 2) === 2
                            ? TileRequirement.REQUIRED
                            : TileRequirement.EXCLUDED,
                    sw: TileRequirement.OPTIONAL,
                    w:
                        (n & 1) === 1
                            ? TileRequirement.REQUIRED
                            : TileRequirement.EXCLUDED,
                    nw: TileRequirement.OPTIONAL,
                },
                tile: null,
            });
        }

        hasAddedTileRulesByTemplate = true;
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
            <div>
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <sl-button
                    disabled={hasAddedTileRulesByTemplate}
                    onclick={createRoadTileRules}
                    onkeydown={createRoadTileRules}
                >
                    Add Roads NESW (16)
                </sl-button>

                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <sl-button
                    disabled={hasAddedTileRulesByTemplate}
                    onclick={createGroundTileRules}
                    onkeydown={createGroundTileRules}
                >
                    Add Ground (9)
                </sl-button>
            </div>

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

            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <sl-button
                onkeydown={(e: KeyboardEvent) => {
                    if (e.key === "Enter" && selectedTile !== null)
                        defaultTile = { ...selectedTile };
                }}
                onclick={() => {
                    if (selectedTile !== null) {
                        defaultTile = { ...selectedTile };
                    }
                }}
                class="default-tile"
                aria-label="Place tile here"
            >
                {#if defaultTile !== null}
                    <img
                        src={projectState.tilesets.getTile(
                            defaultTile.ref.tileset.id,
                            defaultTile.ref.tile.id,
                        ).dataURL}
                        alt="tile"
                    />
                {/if}
            </sl-button>

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
                        <TilesCanvas
                            {tileset}
                            onSelect={(selectedTiles) =>
                                (selectedTile = selectedTiles[0].asset)}
                        />
                    </sl-tab-panel>
                {/each}
            </sl-tab-group>
        {:else}
            <sl-tab-group id="tilesets">
                <sl-tab slot="nav" panel={"empty"}>Load tileset</sl-tab>
                <sl-tab-panel name={"empty"}>
                    <div id="div-empty">
                        <sl-icon library="pixelarticons" name="chess"></sl-icon>
                        <p>Load a tileset in main toolbar.</p>
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
        onclick={save}
        onkeydown={save}
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
        border: 1px solid var(--color-0);
    }

    .excluded {
        background-color: var(--sl-color-rose-600);
    }

    .optional {
        background: var(--color-1);
    }

    .required {
        background-color: rgb(106, 231, 106);
    }

    .default-tile::part(base) {
        height: calc(32px * 3 + 0.5rem);
        width: calc(32px * 3 + 0.5rem);
        aspect-ratio: 1/1;
    }

    .default-tile::part(label) {
        padding: 0;
    }

    .default-tile img {
        height: 100%;
        width: 100%;
        image-rendering: pixelated;
    }

    sl-dialog {
        --width: 60%;
        height: 50%;
    }

    sl-dialog::part(body) {
        outline: none;
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
        gap: 1rem;
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
