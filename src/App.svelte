<script lang="ts">
  import Menu from "./lib/Menu.svelte";
  import TilemapEditor from "./lib/TilemapEditor.svelte";
  import Toast from "./lib/common/Toast.svelte";
  import ToolBar from "./lib/ToolBar.svelte";

</script>


  <Toast />
 
  <div id="content">
    <ToolBar />
    <TilemapEditor />
  </div>


<style>

  #content {
    display: flex;
    justify-content: flex-start;
    overflow-y: auto;
    flex-grow: 1;
    overflow-x: hidden;
  }
</style>
