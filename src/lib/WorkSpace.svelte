<script lang="ts">
    import TilemapEditor from "./TilemapEditor.svelte";
    import ScriptEditor from "./ScriptEditor.svelte";
    import { guiState, projectState } from "../state.svelte";
    import { SlTab, SlTabGroup, type SlCloseEvent, type SlTabShowEvent } from "@shoelace-style/shoelace";
    
    const handleTabShow = (e: SlTabShowEvent) => {
        guiState.selectedWorkspaceTab = e.detail.name;
    }

    let tabGroup: SlTabGroup;

    const closeScript = (e: SlCloseEvent) => {

        const tab = e.target as SlTab;

        const panel = tab.panel;

        const tabIdx = guiState.workspaceTabs.findIndex(wt => wt.label === panel);

        guiState.workspaceTabs.splice(tabIdx, 1);

        if(tab.active) {
            guiState.selectedWorkspaceTab = guiState.workspaceTabs[tabIdx - 1].label;
        }
    }


    $effect(() => {
        console.log(guiState.workspaceTabs.map(si => si.label))
    });

</script>

<div>
    <sl-tab-group bind:this={tabGroup} onsl-close={closeScript} onsl-tab-show={handleTabShow}>
        {#each guiState.workspaceTabs as tab}

            <sl-tab active={guiState.selectedWorkspaceTab === tab.label} slot="nav" panel={tab.label} closable={tab.value !==-1}>
                {tab.label}
            </sl-tab>

            <sl-tab-panel class:active={guiState.selectedWorkspaceTab === tab.label} name={tab}>
                {#if tab.value === -1}
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
    overflow-y: hidden;
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

sl-tab::part(base) {
    gap: 4px;
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
