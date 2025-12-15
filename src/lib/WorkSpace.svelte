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
        <sl-tab slot="nav" panel={tab}>{tab}</sl-tab>
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
