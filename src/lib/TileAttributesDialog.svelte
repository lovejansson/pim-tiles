<script lang="ts">
  import {
    SlIconButton,
    SlInput,
    type SlChangeEvent,
  } from "@shoelace-style/shoelace";
  import { projectState } from "../state.svelte";
  import type { Cell } from "../types";
  import { isSameCell } from "../utils";

  type TileAttributesDialogProps = {
    cell: Cell;
    open: boolean;
  };
  let { open = $bindable(), cell }: TileAttributesDialogProps = $props();

  const hide = () => {
    open = false;
  };

  let tile = $state(cell);

  // Using an array of tuples since the Map is not reactive!
  let attributes: [string, string][] = $state(
    Array.from(
      projectState.attributes.getTileAttributes(cell)?.entries() ?? [],
    ),
  );

  let deleteButtons: SlIconButton[] = $state([]);
  let focusBtnIdx: number | null = $state(null);

  // ! had do update state inside of an effect since i want to sync the attributes state with current tile and at the same time update the attributes in local component.
  $effect(() => {
    if (!isSameCell(cell, tile)) {
      tile = cell;
      const tileAttributes = projectState.attributes.getTileAttributes(tile);
      attributes = tileAttributes ? Array.from(tileAttributes.entries()) : [];
    }
  });

  $effect(() => {
    if (focusBtnIdx !== null) {
      deleteButtons[focusBtnIdx]?.focus();
      focusBtnIdx = null;
    }
  });

  const save = () => {
    if (attributes.length > 0) {
      projectState.attributes.update(tile, new Map(attributes));
    } else if (projectState.attributes.getTileAttributes(tile)) {
      projectState.attributes.delete(tile);
    }

    hide();
  };

  const addNewAttribute = () => {
    const countNameNew = attributes.reduce(
      (acc, curr) => (acc += curr[0].startsWith("new") ? 1 : 0),
      0,
    );
    countNameNew > 0
      ? attributes.push([`new(${countNameNew})`, ""])
      : attributes.push(["new", ""]);
  };

  const deleteAttribute = (idx: number) => {
    const isLastAttr = idx === attributes.length - 1;
    attributes.splice(idx, 1);

    // Pick focus idx to advance focus to the next delete button in list

    if (isLastAttr) {
      if (attributes.length > 0) {
        focusBtnIdx = idx - 1;
      }
    } else {
      focusBtnIdx = idx + 1;
    }
  };

  const updateAttributeValue = (idx: number, value: string) => {
    attributes[idx][1] = value;
  };

  const updateAttributeKey = (idx: number, key: string) => {
    attributes[idx][0] = key;
  };
</script>

<sl-dialog
  onsl-after-hide={hide}
  label={"Tile attributes (r" + tile.row + " c" + tile.col + ")"}
  {open}
  ><section id="section-attributes">
    {#if attributes.length > 0}
      <ul id="attributes">
        {#each attributes as [key, value], idx}
          <li class="attribute">
            <sl-input
              label="Name"
              type="text"
              value={key}
              onsl-change={(e: SlChangeEvent) => {
                if (e.target === null) return;
                updateAttributeKey(idx, (e.target as SlInput).value);
              }}
            ></sl-input>
            <sl-input
              onsl-change={(e: SlChangeEvent) => {
                if (e.target === null) return;
                updateAttributeValue(idx, (e.target as SlInput).value);
              }}
              label="Value"
              type="text"
              {value}
            ></sl-input>
            <sl-icon-button
              class="btn-delete"
              bind:this={deleteButtons[idx]}
              onclick={() => deleteAttribute(idx)}
              library="pixelarticons"
              name="close"
            >
            </sl-icon-button>
          </li>
        {/each}
      </ul>
      <sl-button id="btn-add" variant="default" onclick={addNewAttribute}>
        Add
      </sl-button>
    {:else}
      <div id="no-attributes-added">
        <p>No attributes added.</p>
        <sl-button
          id="btn-add"
          variant="default"
          size="small"
          onclick={addNewAttribute}
        >
          Add
        </sl-button>
      </div>
    {/if}
  </section>
  <div slot="footer">
    <sl-button variant="primary" onclick={save}>Save</sl-button>
  </div>
</sl-dialog>

<style>
  sl-dialog::part(body) {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    font-size: small;
  }
  sl-dialog {
    --width: 600px;
  }

  .btn-delete {
    font-size: 2rem;
    align-self: flex-end;
  }

  #section-attributes {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: fit-content;
  }

  #no-attributes-added {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  #btn-add {
    width: fit-content;
    align-self: flex-end;
  }

  #attributes {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .attribute {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
</style>
