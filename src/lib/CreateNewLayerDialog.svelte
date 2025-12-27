<script lang="ts">
  import {
    SlInput,
    SlSelect,
    type SlChangeEvent,
    type SlHideEvent,
  } from "@shoelace-style/shoelace";
  import { projectState } from "../state.svelte";
    import { PaintType } from "../types";

  type CreateLayerDialogProps = {open: boolean;}
  let { open = $bindable() }: CreateLayerDialogProps = $props();

  const hide = () => {
    open = false;
  };
 

  let name = $state("New layer");
  let layerType: PaintType.TILE | PaintType.IMAGE | PaintType.AREA | PaintType.AUTO_TILE = $state(PaintType.TILE);

  const saveLayer = () => {
    projectState.layers.add(name, layerType);
    open = false;
  };
</script>

<sl-dialog onsl-after-hide={hide} label="Create layer" {open}>
  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        name = (e.target as SlInput).value;
      }
    }}
    label="Layer name"
    type="text"
    value={name}
  ></sl-input>

  <sl-select
    onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()}
    value={layerType}
    onsl-change={(e: SlChangeEvent) => {
      layerType = +(e.target as SlSelect).value as PaintType.TILE | PaintType.AREA | PaintType.IMAGE;
    }}
  >
    <sl-option value=PaintType.TILE>
      <sl-icon slot="prefix" library="pixelarticons" name="chess"></sl-icon>
      Tile
    </sl-option>
    <sl-option value=PaintType.IMAGE>
      <sl-icon slot="prefix" library="pixelarticons" name=PaintType.IMAGE></sl-icon>
      Image
    </sl-option>
    <sl-option value=PaintType.AREA>
      <sl-icon slot="prefix" library="pixelarticons" name="section"></sl-icon>
      Area
    </sl-option>
    <sl-option value=PaintType.AUTO_TILE>
      <sl-icon slot="prefix" library="pixelarticons" name="grid"></sl-icon>
      Auto tile
    </sl-option>
  </sl-select>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <sl-button
    variant="primary"
    onclick={saveLayer}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") saveLayer();
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
