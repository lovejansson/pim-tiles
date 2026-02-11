<script lang="ts">
  import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
  import { projectState } from "../state.svelte";
  import type { Cell } from "../types";
  import {
	SvelteMap,
} from 'svelte/reactivity';

  type TileAttributesDialogProps = {
    cell: Cell;
    open: boolean;
  };
  let { open = $bindable(), cell }: TileAttributesDialogProps = $props();

  const hide = () => {
    open = false;
  };

  const attributes =
    $state(projectState.attributes.getTileAttributes(cell) ?  Array.from(projectState.attributes.getTileAttributes(cell)!.entries()) : []);

  const save = () => {
    if (attributes.length !== 0) {
      projectState.attributes.update(cell, new Map(attributes));
    } else if (projectState.attributes.getTileAttributes(cell)) {
      projectState.attributes.delete(cell);
    }

    open = false;
  };
</script>

<sl-dialog onsl-after-hide={hide} label="Edit tile attributes" {open}>
    <p>{cell.row}:{cell.col}</p>
  <ul>
    {#each attributes as [key, value], idx}
      <li class="attribute">
        <p>{key}</p>
        <sl-input
          onsl-change={(e: SlChangeEvent) => {
            if (e.target) {
                attributes[idx][1] = value;
            }
          }}
          label="Value"
          type="text"
          {value}
        ></sl-input>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <sl-icon-button
          onclick={() => attributes.splice(idx, 1)}
          onkeydown={(e: KeyboardEvent) =>
            e.key === "Enter" && attributes.splice(idx, 1)}
          library="pixelarticons"
          name="close"
        >
        </sl-icon-button>
      </li>
    {/each}
  </ul>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <sl-button variant="primary"
    onclick={() => attributes.push(["new", ""])}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") attributes.push(["new", ""]);
    }}>
        Add
  </sl-button>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <sl-button
    variant="primary"
    onclick={save}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") save();
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

  .attribute {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
</style>
