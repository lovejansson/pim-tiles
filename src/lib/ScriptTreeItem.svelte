<script lang="ts">
 
  import ContextMenu from "./ContextMenu.svelte";

  let { userScript} = $props();

 let actionMenuIsOpen = false;

</script>

<div>
  <ContextMenu 
    menuItems={[{label: "Delete", icon: "close"}, {label: "Rename", icon: "edit-box"}]}
    onSelect={() => {}}
  >   
  <p>{userScript.name}</p></ContextMenu>
</div>


<style lang="postcss">
  div {
    width: 100%;
    background: red;
  }

</style>

