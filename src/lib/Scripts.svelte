<script lang="ts">
  import { projectState } from "../state.svelte";
  import ContextMenu from "./ContextMenu.svelte";

    const newScript = () => {
        const numNamedNewScript = projectState.scripts.filter(s => s.name.match(/New script(\(\d\))?/)).length;
        projectState.scripts.push({name: `New script${numNamedNewScript === 0 ? "" : "(" + numNamedNewScript + ")"}` , content: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n')});
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
    
    {#each projectState.scripts as userScript, idx} 
  
    <sl-tree-item>
            <ContextMenu 
    menuItems={[{label: "Delete", icon: "close"}, {label: "Rename", icon: "edit-box"}]}
    onSelect={() => {}}
  >   
       
        <p>{userScript.name}</p>
        </ContextMenu>
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

