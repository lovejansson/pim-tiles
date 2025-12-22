<script lang="ts">
  import {  SlMenuItem } from "@shoelace-style/shoelace";
  import { getImageByRef, guiState } from "../state.svelte";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import type { ImageLayerState, Image, IdRef, Point } from "../types";

  type ObjectItemProps = {
    object: (IdRef & Point & {isSelected: boolean});
  }

    const tilemapEditorState = $derived.by(
        (): ImageLayerState => {
        if (guiState.tilemapEditorState.type === "image") return guiState.tilemapEditorState;

          throw new Error("Invalid UI state");
        }
    );

    let { object }: ObjectItemProps = $props();
    const image = $derived.by((): Image => {
      const image = getImageByRef(object);
      return image;
    });

    const handleSelectMenuItem = (item: SlMenuItem) => {
        if(item.value === "delete") {
            tilemapEditorState.selectedLayer.data = tilemapEditorState.selectedLayer.data.filter(i => !i.isSelected);
        } 
        
    }

    const selectImage = (e:MouseEvent) => {
      object.isSelected =   !object.isSelected;
      e.stopPropagation();
    }
  

</script>

<ContextMenu onSelect={handleSelectMenuItem} 
menuItems={[ 
{label: "Delete", value:"delete", icon: "close"}]}>
     <!-- svelte-ignore a11y_no_static_element_interactions -->
     <sl-button 
     class:selected={object.isSelected} 
     onclick={selectImage} onkeydown={selectImage}>{image.filename}</sl-button>
</ContextMenu>



<style lang="postcss">

 .selected::part(base) {
   background-color: rgb(112, 253, 121);
 }

</style>

