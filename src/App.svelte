<script lang="ts">
  import Menu from './lib/Menu.svelte';
    import Toast from './lib/Toast.svelte';
  import ToolBar from './lib/ToolBar.svelte';
  import WorkSpace from './lib/WorkSpace.svelte';
</script>

<Toast/>
<div id="menu">
  <Menu/>
  </div>
<div id="content">
  <ToolBar/>
  <WorkSpace/>
</div>

<style>
  #menu {
    padding: 1rem;
    padding-bottom: 0;
    /* border-bottom: 1px solid var(--color-2) */
    
  }

  #content {
    margin-top: 1rem;
    display: flex;
    flex-grow: 1;
    justify-content: flex-start;
    overflow-y: auto;
  }
</style>
