<script lang="ts">
import { SlInput, SlSelect, type SlChangeEvent, type SlHideEvent} from '@shoelace-style/shoelace';
import { projectState } from '../state.svelte';

let { open = $bindable() } = $props();

const hide = ( ) => {
    open = false;
}
const show = () => open = true;


let name = $state("New layer");
let type: "tile" | "image" | "area" = $state("tile");

const saveLayer = () => {
    projectState.layers.push({name, type, data: [], isVisible: true });
    open = false;
}

</script>


<sl-dialog onsl-after-hide={hide} label="Create layer" open={open}>

        <sl-input  onsl-change={(e: SlChangeEvent) => {
                if(e.target) {
                    name = (e.target as SlInput).value;
                }
            }}  
            label="Layer name"  type="text" value={name}></sl-input>  
            
            <sl-select onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()} value={type} onsl-change={(e:SlChangeEvent) => {
                type = (e.target as SlSelect).value as "tile" | "area" | "image";
            }}>
                <sl-option value="tile">
                      <sl-icon slot="prefix" library="pixelarticons" name="chess"></sl-icon>
                    Tile
                </sl-option>
                <sl-option value="image">
                       <sl-icon slot="prefix"  library="pixelarticons" name="image"></sl-icon>
                    Image
                </sl-option>
                <sl-option value="area">
                      <sl-icon slot="prefix"  library="pixelarticons" name="image"></sl-icon>
                    Area
                </sl-option>
            </sl-select>

            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <sl-button 
            variant="primary"
            onclick={saveLayer}
            onkeydown={(e: KeyboardEvent) => {
                if (e.key === "Enter") saveLayer();
            }}
            >Save</sl-button>

</sl-dialog>


<style>

    sl-dialog::part(body) {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
        font-size: small;
    }

</style>
