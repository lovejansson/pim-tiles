<script lang="ts">
  import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
  import { guiState, projectState } from "../../state.svelte";
  import {
    type TileRule,
    type TileAsset,
    type AutoTile,
    TileRequirement,
  } from "../../types";
  import RuleTileButton from "./RuleTileButton.svelte";

  import TilesCanvas from "../tilesets/TilesetCanvas.svelte";

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
    autoTile?.rules ?? [
      {
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
      },
    ],
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

  const save = (e: MouseEvent) => {
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
      projectState.updateAutoTile({
        id: autoTile.id,
        name,
        rules: rules as TileRule[],
        defaultTile,
      });
    } else {
      projectState.createAutoTile(name, rules as TileRule[], defaultTile);
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
            (i & 8) === 8 ? TileRequirement.REQUIRED : TileRequirement.EXCLUDED,
          ne: TileRequirement.OPTIONAL,
          e:
            (i & 4) === 4 ? TileRequirement.REQUIRED : TileRequirement.EXCLUDED,
          se: TileRequirement.OPTIONAL,
          s:
            (i & 2) === 2 ? TileRequirement.REQUIRED : TileRequirement.EXCLUDED,
          sw: TileRequirement.OPTIONAL,
          w:
            (i & 1) === 1 ? TileRequirement.REQUIRED : TileRequirement.EXCLUDED,
          nw: TileRequirement.OPTIONAL,
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
            (n & 8) === 8 ? TileRequirement.REQUIRED : TileRequirement.EXCLUDED,
          ne: TileRequirement.OPTIONAL,
          e:
            (n & 4) === 4 ? TileRequirement.REQUIRED : TileRequirement.EXCLUDED,
          se: TileRequirement.OPTIONAL,
          s:
            (n & 2) === 2 ? TileRequirement.REQUIRED : TileRequirement.EXCLUDED,
          sw: TileRequirement.OPTIONAL,
          w:
            (n & 1) === 1 ? TileRequirement.REQUIRED : TileRequirement.EXCLUDED,
          nw: TileRequirement.OPTIONAL,
        },
        tile: null,
      });
    }

    hasAddedTileRulesByTemplate = true;
  };

  $effect(() => {
    console.log($state.snapshot(defaultTile));
  });
</script>

<sl-dialog onsl-after-hide={hide} label="Create auto tile" {open}>
  <sl-icon-button
    slot="header-actions"
    library="pixelarticons"
    name="close"
    onclick={hide}
  >
  </sl-icon-button>
  <div id="wrapper">
    <div id="wrapper-first">
      <section id="section-controls">
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

        <sl-button onclick={newRule}>
          Add rule
          <sl-icon label="Add rule" library="pixelarticons" name="plus"
          ></sl-icon></sl-button
        >

        <div>
          <sl-button
            disabled={hasAddedTileRulesByTemplate}
            onclick={createRoadTileRules}
            onkeydown={createRoadTileRules}
          >
            Add Roads NESW (16)
          </sl-button>

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
      </section>
      <section id="section-tilesets">
        {#if projectState.getTilesets().length > 0}
          <sl-tab-group>
            {#each projectState.getTilesets() as tileset}
              <sl-tab slot="nav" panel={tileset.name}>{tileset.name}</sl-tab>
              <sl-tab-panel name={tileset.name}>
                <TilesCanvas
                  {tileset}
                  onSelect={(selectedTiles) => {
                    selectedTile = selectedTiles[0];
                  }}
                />
              </sl-tab-panel>
            {/each}
          </sl-tab-group>
        {:else}
          <sl-tab-group>
            <sl-tab slot="nav" panel={"empty"}>Load tileset</sl-tab>
            <sl-tab-panel name={"empty"}>
              <div id="div-empty">
                <sl-icon library="pixelarticons" name="chess"></sl-icon>
                <p>Load a tileset in main toolbar.</p>
              </div>
            </sl-tab-panel>
          </sl-tab-group>
        {/if}
      </section>
    </div>
    <ul id="rules">
      <sl-button
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
            src={projectState.getTileDataUrl(defaultTile.ref.tile)}
            alt="tile"
          />
        {/if}
      </sl-button>
      {#each rules as _, idx}
        <li>
          <RuleTileButton
            onDelete={() => deleteRule(idx)}
            {selectedTile}
            bind:ruleTile={rules[idx]}
          />
        </li>
      {/each}
    </ul>
  </div>

  <sl-button disabled={!isValid} slot="footer" variant="primary" onclick={save}>
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
    --width: 800px;
  }

  #wrapper {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    align-items: flex-start;
    gap: 2rem;
  }

  #wrapper-first {
    display: flex;
    flex-direction: column;
  }

  #section-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
  }

  #section-tilesets {
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
    height: 55dvh;
    padding: 1rem;
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
    outline: 1px solid yellow !important;
  }

  sl-tab {
    padding: 0;
  }

  sl-tab-panel::part(base) {
    width: 400px;
    height: 55dvh;
    overflow-y: auto;
  }

  sl-tab-panel {
    background-color: var(--color-3);
    --padding: 0;
    height: 100%;
  }

  sl-dialog::part(body) {
    outline: none;
  }

  sl-dialog::part(close-button) {
    display: none;
  }

  sl-tab-panel::part(base) {
    height: 100%;
    width: 100%;
  }

  sl-tab-panel {
    background-color: var(--color-3);
    --padding: 0;
    height: 400px;
  }
</style>
