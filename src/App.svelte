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
  <TilemapEditor />
  <ToolBar />

</div>

<style>
  #menu {
    padding: 1rem;
    padding-bottom: 0;
  }

  #content {
    margin-top: 1rem;
    display: flex;
    flex-grow: 1;
    justify-content: flex-start;
    overflow-y: auto;
  }
</style>
