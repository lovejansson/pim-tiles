<script lang="ts">
  import { projectState } from "../state.svelte";
  import ScriptTreeItem from "./ScriptTreeItem.svelte";

  const newScript = () => {
      const numNamedNewScript = projectState.scripts.get().filter(s => s.name.match(/New script(\(\d\))?/)).length;
      projectState.scripts.add(`New script${numNamedNewScript === 0 ? "" : "(" + numNamedNewScript + ")"}` , ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'));
  }

</script>

<section id="scripts">

    <header>
        <h2>Scripts</h2>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
      onclick={newScript}
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter")  newScript()
      }}
    >
      <sl-icon  label="New script" library="pixelarticons" name="plus"
      ></sl-icon></sl-button>
    </header>

    <sl-tree selection="leaf">
        <sl-tree-item>
            <sl-icon library="pixelarticons" name="folder"></sl-icon>
            
              Scripts
    
    {#each projectState.scripts.get() as script, idx} 
  
    <sl-tree-item >
        <ScriptTreeItem script={script}/>
    </sl-tree-item>

    {/each}    
</sl-tree-item>  
    </sl-tree>
</section>

<style lang="postcss">

    header {
        display: flex;
        justify-content: space-between;
    }
 
    #scripts {
        width: 320px !important;
        height:  100%;
    }
</style>

