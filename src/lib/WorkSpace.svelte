<script lang="ts">
    import TilemapEditor from "./TilemapEditor.svelte";
    import ScriptEditor from "./ScriptEditor.svelte";
  import { projectState } from "../state.svelte";
  import type { SlTabShowEvent } from "@shoelace-style/shoelace";

  let selectedTab = $state("tilemap")
    
  const handleTabShow = (e: SlTabShowEvent) => {
    selectedTab = e.detail.name;
  }

</script>

<div>
<sl-tab-group onsl-tab-show={handleTabShow}>
    {#each ["tilemap", ...projectState.scripts.map(s => s.name)] as tab} 
        <sl-tab class:selected-tab={selectedTab === tab} slot="nav" panel={tab}>{tab}</sl-tab>
    <sl-tab-panel class:active={selectedTab === tab} name={tab} >
        {#if tab === "tilemap"}
        <TilemapEditor/>
        {:else}
        <ScriptEditor />
        {/if}

    </sl-tab-panel>
    {/each}

</sl-tab-group>
</div>

<style lang="postcss">
/* Make div take full space in parent flex container */
div {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.selected-tab {
    border-top-color: var(--color-0);
      border-bottom: none;
}

sl-tab {
    border: 1px solid var(--color-2);
}

sl-tab:not(:first-child) {
        margin-left: -1px;   
 }
sl-tab-group {
  --track-color: transparent; /* hides the bottom line */
  --track-width: 0;           /* removes the height entirely */
}

sl-tab-group {
    display: flex;
    flex-direction: column;
    flex: 1;
}

sl-tab-group::part(base) {
    display: flex;
    flex-direction: column;
    flex: 1;
}

sl-tab-group::part(body) {
    flex: 1;
    display: flex; 
}

sl-tab-panel {
    --padding: 0;
}

/* Make each tab panel fill the tab group body */
sl-tab-panel.active{
    display: flex !important;
    flex-direction: column;
    flex: 1;
    
}

sl-tab-panel::part(base) {
    flex: 1;
    display: flex;
    flex-direction: column;
}

</style>
