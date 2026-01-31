<script lang="ts">
  import Menu from "./lib/Menu.svelte";
  import TilemapEditor from "./lib/TilemapEditor.svelte";
  import Toast from "./lib/Toast.svelte";
  import ToolBar from "./lib/ToolBar.svelte";

</script>


  <Toast />
  <div id="menu">
    <Menu />
  </div>
  <div id="content">
    <ToolBar />
    <TilemapEditor />
  </div>


<style>
  #menu {
    padding: 0.5rem 1rem;
  }

  #content {
    display: flex;
    justify-content: flex-start;
    overflow-y: auto;
    flex-grow: 1;
  }
</style>
