<script lang="ts">
  import { SlCheckbox, SlInput, type SlChangeEvent, type SlHideEvent, type SlInputEvent } from '@shoelace-style/shoelace';
import { appState } from '../state.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import app from '../main';

let { open = $bindable() } = $props();

const hide = ( ) => {
    open = false;
}
const show = () => open = true;

let tileSize = $state(appState.settings.tileSize);
let confirmTileSizeDialogIsOpen = $state(false);

const handleConfirm = () => {
    appState.settings.tileSize = tileSize;
    appState.tilemap = [];
    confirmTileSizeDialogIsOpen = false;
}

const handleCancel = () => {
    tileSize = appState.settings.tileSize;
    confirmTileSizeDialogIsOpen = false;
}
</script>

<sl-dialog onsl-after-hide={hide} label="Settings" open={open}>
        <sl-input  onsl-change={(e: SlChangeEvent) => {
                if(e.target) {
                    appState.projectName = (e.target as SlInput).value;
                }
            }}  
            label="Project name"  type="text" value={appState.projectName}></sl-input>   
        <sl-input
        
        onsl-change={(e: SlChangeEvent) => {   
              if(e.target) {
                tileSize = +(e.target as SlInput).value;
                confirmTileSizeDialogIsOpen = true;
              } 
       
        }} 
        placeholder="16 pixels is a good size" no-spin-buttons label="Tile size" type="number" value={tileSize}>
            <span slot="suffix">px</span>
        </sl-input>
        <sl-color-picker onsl-after-hide={(e: SlHideEvent) => e.stopPropagation()} swatches="#000000; #FFFFFF; #2ada64; #bb46eb; #FFD700; #00BFFF;
    " value={appState.settings.gridColor}   onsl-change={(e: SlChangeEvent) => {  
              if(e.target) {
                appState.settings.gridColor = (e.target as SlInput).value;
              } 
              e.stopPropagation()
        }}  label="Grid color"></sl-color-picker>

        <sl-checkbox onsl-change={(e: SlChangeEvent) => {
                if(e.target) {
                    appState.settings.showGrid = (e.target as SlCheckbox).checked;
                }
            }}   checked={appState.settings.showGrid}>Show grid</sl-checkbox>
</sl-dialog>

<ConfirmDialog open={confirmTileSizeDialogIsOpen} 
    label="Change tile size" 
    msg="Changing tile size will erase the 
    project. Are you sure you want to do that?" 
    cancel={handleCancel}
    confirm={handleConfirm}/>

<style>

    sl-dialog::part(body) {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
        font-size: small;
    }

    sl-color-picker {
        width: fit-content;
    }

</style>
