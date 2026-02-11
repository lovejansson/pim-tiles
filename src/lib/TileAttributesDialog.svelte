<script lang="ts">
  import {  SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
  import { projectState } from "../state.svelte";
  import type { Cell } from "../types";

  type TileAttributesDialogProps = {
    cell: Cell;
    open: boolean;
  };
  let { open = $bindable(), cell }: TileAttributesDialogProps = $props();

  const hide = () => {
    open = false;
  };

  const currentAttributes = $state(projectState.attributes.getTileAttributes(cell));

  let attributes: [string, string][] = $state(
    currentAttributes ? Array.from(currentAttributes.entries()) : [],
  );

  const save = () => {
    if (attributes.length !== 0) {
      projectState.attributes.update(cell, new Map(attributes));
    } else if (projectState.attributes.getTileAttributes(cell)) {
      projectState.attributes.delete(cell);
    }

    attributes = [];
    hide();
  };
</script>

<sl-dialog
  onsl-after-hide={hide}
  label={"Edit tile attributes (r" + cell.row + " c" + cell.col + ")"}
  {open}
>
{#if attributes.length > 0}

  <ul id="attributes">
    {#each attributes as [key, value], idx }
      <li class="attribute">
        <sl-input label="Name" type="text" value={key} 
         onsl-change={(e: SlChangeEvent) => {
      
            if (e.target) {
              attributes[idx][0] = (e.target as SlInput).value;
            }
          }}></sl-input>
        <sl-input
          onsl-change={(e: SlChangeEvent) => {
            if (e.target) {
              attributes[idx][1] = (e.target as SlInput).value;
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
  {:else}
  <p>No attributes added for tile.</p>
  {/if}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <sl-button
    variant="primary"
    onclick={() => attributes.push(["new", ""])}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") attributes.push(["new", ""]);
    }}
  >
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
   sl-dialog {
        --width: 50%;
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
