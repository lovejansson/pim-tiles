<script lang="ts">
    import { projectState } from "../state.svelte";
    import ContextMenu from "./ContextMenu.svelte";
    import EditableText from "./EditableText.svelte";

    let { tilesetIdx } = $props();

    let isEditingName = $state(false);

    const handleSelectMenuItem = (item: any) => {
        if (item.value === "delete") {
            projectState.tilesets.splice(tilesetIdx, 1);
        } else if (item.value === "rename") {
            isEditingName = true;
        }
    };




</script>

<ContextMenu
    onSelect={handleSelectMenuItem}
    menuItems={[
        { label: "Rename", value: "rename", icon: "edit-box" },
        { label: "Delete", value: "delete", icon: "close" },
    ]}
>
      <EditableText bind:isEditing={isEditingName} text={projectState.tilesets[tilesetIdx].name} inputWidth={projectState.tilesets[tilesetIdx].name.length * 9}/>
</ContextMenu>

<style lang="postcss">
</style>
