<script lang="ts">
  import {
    SlCheckbox,
    SlInput,
    type SlChangeEvent,
    type SlHideEvent,
  } from "@shoelace-style/shoelace";
  import { projectState } from "../state.svelte";

  let { open = $bindable() } = $props();

  const hide = () => {
    open = false;
  };

  let name = $state("New area");
  let color = $state("lime");
  let isWalkable = $state(false);

  const saveArea = () => {
    projectState.areas.add(name, color, isWalkable);
    open = false;
  };
</script>

<sl-dialog onsl-after-hide={hide} label="Create area" {open}>
  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        name = (e.target as SlInput).value;
      }
    }}
    label="Area name"
    type="text"
    value={name}
  ></sl-input>

  <sl-color-picker
    onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()}
    swatches="#000000; #FFFFFF; #2ada64; #bb46eb; #FFD700; #00BFFF;
    "
    value={color}
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        color = (e.target as SlInput).value;
      }
      e.stopPropagation();
    }}
    label="Border color"
  ></sl-color-picker>

  <sl-checkbox
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        isWalkable = (e.target as SlCheckbox).checked;
      }
    }}
    checked={isWalkable}>Is Walkable</sl-checkbox
  >

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <sl-button
    variant="primary"
    onclick={saveArea}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") saveArea();
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
</style>
