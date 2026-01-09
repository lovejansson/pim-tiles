<script lang="ts">
    import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
    import { projectState } from "../state.svelte";
    import {
        type TileRule,
        type AutoTile,
        PaintType,
        TileRequirement,
        type TileRef,
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

    let name = $state(autoTile?.name ?? "New auto tile");

    let rules: TileRule[] = $state(autoTile?.rules ?? []);

    const save = () => {
        if (autoTile !== undefined && idx !== undefined) {
            projectState.autoTiles.update(autoTile.id, { name, rules });
        } else {
            projectState.autoTiles.add(name, rules);
        }

        name = autoTile?.name ?? "New auto tile";
        rules = autoTile?.rules ?? [];
        open = false;
    };

    const addRuleTile = (ref: TileRef) => {
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
            tile: { type: PaintType.TILE, ref },
        });
    };

    const deleteRuleTile = (ref: TileRef) => {
        const idx = rules.findIndex(
            (r) =>
                r.tile.ref.tile.id === ref.tile.id &&
                r.tile.ref.tileset.id === ref.tileset.id,
        );

        if (idx !== -1) {
            rules.splice(idx, 1);
        }
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
                                <li>
                                    <RuleTileButton
                                        {tileset}
                                        {tile}
                                        ruleTile={rules.find(
                                            (r) =>
                                                r.tile.ref.tile.id ===
                                                    tile.id &&
                                                r.tile.ref.tileset.id ===
                                                    tileset.id,
                                        )}
                                        onAdd={addRuleTile}
                                        onDelete={deleteRuleTile}
                                    />
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
        disabled={!name.trim().length || rules.length === 0}
        slot="footer"
        variant="primary"
        onclick={save}
        onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter") save();
        }}
    >
        Save
    </sl-button>
</sl-dialog>

<style>
    sl-dialog {
        --width: 50%;
        height: 50%;
    }
    #content-wrapper {
        display: flex;
        flex-direction: column;
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
    }

    #div-empty {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tiles {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        margin: 0;
        width: 100%;

        gap: 1px;
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
    }
</style>
