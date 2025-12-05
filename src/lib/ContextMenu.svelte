<script lang="ts">
  import { type SlSelectEvent } from "@shoelace-style/shoelace/dist/react/menu/index.js";



    
let { menuItems, children, onSelect } = $props();
  
let {isOpen, top, left} = $state({isOpen: false, top: 0, left:0});

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div id="context-menu-backdrop" onclick={() => {
    isOpen = false
}} class:open={isOpen}></div>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div  oncontextmenu={(e) => {
    isOpen = !isOpen;
    top = e.pageY;
    left = e.pageX;
        e.preventDefault();
    }}>
        <sl-menu onsl-select={(e: SlSelectEvent) => 
       { onSelect(e.detail.item)
        isOpen = false;

       }} class:open={isOpen} style={`top:${top}px;left:${left}px`}>
            {#each menuItems as mi} 
            <sl-menu-item value={mi.value}>
                    {mi.label} 
                    {#if mi.icon} 
                        <sl-icon slot="suffix" library="pixelarticons" name={mi.icon} ></sl-icon>
                    {/if}
                </sl-menu-item>
            {/each}
    </sl-menu>
{@render children()}

</div>

<style lang="postcss">
sl-menu {
    display: none;
    position: fixed;
    z-index: 2;
}

 #context-menu-backdrop {
    display: none;
    position: fixed;
    top: 0;
    left: 0; 
    right: 0;
    bottom: 0;
    background-color: transparent;
    z-index: 1;
 }
 .open {
    display: block  !important;
 }


</style>

