<script lang="ts">
  import { type SlSelectEvent } from "@shoelace-style/shoelace/dist/react/menu/index.js"
    
let { menuItems, children, onSelect } = $props();
  
let {isOpen, top, left, placement} = $state({isOpen: false, top: 0, left:0, placement: "bottom"});


</script>


<!-- svelte-ignore a11y_click_events_have_key_events -->
<div id="context-menu-backdrop" onclick={(e) => {
    isOpen = false
    e.stopPropagation()
}} class:open={isOpen}></div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    oncontextmenu={(e) => {
    isOpen = !isOpen;
    top = e.pageY;
    left = e.pageX;
    placement = e.pageY > window.innerHeight - 100 ? "top" : "bottom"
    e.preventDefault();
    e.stopPropagation();

    }}>
        <sl-menu onsl-select={(e: SlSelectEvent) => 
       { onSelect(e.detail.item)
        isOpen = false;

       }} class:open={isOpen} style={`top:${top}px;left:${left}px;transform:translateY(${placement === "top"? -100 : 0}%);`}>
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

