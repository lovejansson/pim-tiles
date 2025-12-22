<script lang="ts">
    import { SlMenuItem } from "@shoelace-style/shoelace";
    import { guiState, projectState } from "../state.svelte";
    import ContextMenu from "./ui/ContextMenu.svelte";
    import ImageDialog from "./ImageDialog.svelte";
    import type { ImageLayerState, Image } from "../types";

    type ImageItemProps = {
        image: Image;
        idx: number;
    };

    const tilemapEditorState = $derived.by((): ImageLayerState => {
        if (guiState.tilemapEditorState.type === "image")
            return guiState.tilemapEditorState;

        throw new Error("Invalid UI state");
    });

    let { image, idx }: ImageItemProps = $props();

    let viewImageDialogIsOpen = $state(false);

    const handleSelectMenuItem = (item: SlMenuItem) => {
        if (item.value === "delete") {
            const isUsedInLayer = projectState.layers.some((layer) => {
                if (layer.type === "image") {
                    return layer.data.some((i) => i.id === image.id);
                }
                return false;
            });

            if (isUsedInLayer) {
                guiState.notification = {
                    variant: "danger",
                    title: "Delete image",
                    msg: "This image is used in one or more layers and cannot be deleted.",
                };
                return;
            }

            projectState.images.splice(idx, 1);

        } else if (item.value === "view") {
            viewImageDialogIsOpen = true;
        }
    };

    const selectImage = () => {
        tilemapEditorState.selectedAsset = { ref: { id: image.id } };
    };

</script>

<ContextMenu
    onSelect={handleSelectMenuItem}
    menuItems={[
        { label: "View", value: "view", icon: "edit-box" },
        { label: "Delete", value: "delete", icon: "close" },
    ]}
>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <sl-button
        class:selected={guiState.tilemapEditorState.type === "image" &&
            guiState.tilemapEditorState.selectedAsset !== null &&
            guiState.tilemapEditorState.selectedAsset.ref.id === image.id}
        onclick={selectImage}
        onkeydown={selectImage}>{image.filename}</sl-button
    >
</ContextMenu>

<ImageDialog {image} bind:open={viewImageDialogIsOpen} />

<style lang="postcss">
    .selected::part(base) {
        background-color: rgb(112, 253, 121);
    }
</style>
