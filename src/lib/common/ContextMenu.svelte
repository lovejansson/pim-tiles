<script lang="ts">
  import { type SlSelectEvent } from "@shoelace-style/shoelace/dist/react/menu/index.js";

  let { menuItems, children, onSelect } = $props();

  let isOpen = $state(false);
  let placement = $state("bottom");
  let top = $state(0);
  let left = $state(0);
</script>

<div
  id="context-menu-backdrop"
  onclick={(e) => {
    isOpen = false;
    e.stopPropagation();
  }}
  class:open={isOpen}
></div>

<!-- Want the context menu to be able to open via keyboard -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  id="context-menu"
  tabindex={0}
  oncontextmenu={(e) => {
    isOpen = true;
    top = e.pageY;
    left = e.pageX;
    placement = e.pageY > window.innerHeight - 100 ? "top" : "bottom";
    e.preventDefault();
    e.stopPropagation();
  }}
>
  <sl-menu
    onsl-select={(e: SlSelectEvent) => {
      onSelect(e.detail.item);
      isOpen = false;
    }}
    class:open={isOpen}
    style={`top:${top}px;left:${left}px;transform:translateY(${placement === "top" ? -100 : 0}%);`}
  >
    {#each menuItems as mi}
      <sl-menu-item value={mi.value}>
        {mi.label}
        {#if mi.icon}
          <sl-icon slot="suffix" library="pixelarticons" name={mi.icon}
          ></sl-icon>
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

  #context-menu::focus {
    outline: 1px solid var(--color-0);

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
    display: block !important;
  }
</style>
