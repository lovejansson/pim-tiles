<script lang="ts">
  import {  SlMenuItem } from "@shoelace-style/shoelace";
  import {  guiState, projectState } from "../state.svelte";
  import ContextMenu from "./ui/ContextMenu.svelte";
  import { type ImageLayerState, type Image, type Point, type ImageAsset, PaintType } from "../types";

  type ObjectItemProps = {
    object: (ImageAsset & Point & {isSelected: boolean});
  }

    const tilemapEditorState = $derived.by(
        (): ImageLayerState => {
        if (guiState.tilemapEditorState.type === PaintType.IMAGE) return guiState.tilemapEditorState;

          throw new Error("Invalid UI state");
        }
    );

    let { object }: ObjectItemProps = $props();
      const image = $derived.by((): Image => {
      const image = projectState.images.getImage(object.ref.id);
      return image;
    });

    const handleSelectMenuItem = (item: SlMenuItem) => {
        if(item.value === "delete") {
            tilemapEditorState.selectedLayer.data = tilemapEditorState.selectedLayer.data.filter(i => !i.isSelected);
        } 
    }

    const selectImage = (e: MouseEvent) => {
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

