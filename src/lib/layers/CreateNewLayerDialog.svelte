<script lang="ts">
  import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";
  import { PaintType } from "../../types";

  type CreateLayerDialogProps = {
    open: boolean;
    onCreate: (name: string, type: PaintType) => void;
  };
  let { open = $bindable(), onCreate }: CreateLayerDialogProps = $props();

  const hide = () => {
    open = false;
  };

  let name = $state("New layer");
  let layerType: PaintType = $state(PaintType.TILE);

  const saveLayer = () => {
    onCreate(name, layerType);
    open = false;
  };
</script>

<sl-dialog onsl-after-hide={hide} label="Create layer" {open}>
  <sl-icon-button
    slot="header-actions"
    library="pixelarticons"
    name="close"
    style="font-size: 1.6rem;"
    onclick={hide}
  >
  </sl-icon-button>
  <sl-input
    onsl-change={(e: SlChangeEvent) => {
      if (e.target) {
        name = (e.target as SlInput).value;
      }
    }}
    label="Name"
    type="text"
    value={name}
  ></sl-input>

  <sl-radio-group label="Type" value={layerType.toString()}>
    <sl-radio value={PaintType.TILE.toString()}>Tile</sl-radio>
    <sl-radio value={PaintType.AUTO_TILE.toString()}>Auto tile</sl-radio>
  </sl-radio-group>

  <sl-button variant="primary" onclick={saveLayer}>Save</sl-button>
</sl-dialog>

<style>
  sl-dialog::part(body) {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    font-size: small;
  }

  sl-dialog::part(close-button) {
    display: none;
  }

  sl-radio-group::part(form-control-input) {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
</style>
