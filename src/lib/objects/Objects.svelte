<script lang="ts">
  import {
    guiState,
    projectState,
    ProjectStateError,
    tilemapEditorState,
  } from "../../projectState.svelte";
  import type { Object as ProjectObject, ObjectCategory } from "../../types";
  import { PaintType } from "../../types";
  import type { SlTabGroup } from "@shoelace-style/shoelace";
  import ContextMenu from "../common/ContextMenu.svelte";
  import ObjectDialog from "./ObjectDialog.svelte";

  const categories: { id: ObjectCategory; label: string }[] = [
    { id: "houses", label: "Houses" },
    { id: "nature", label: "Nature" },
    { id: "furniture", label: "Furniture" },
    { id: "decorations", label: "Decorations" },
    { id: "other", label: "Other" },
  ];

  let dialogIsOpen = $state(false);
  let editingObject: ProjectObject | null = $state(null);

  $effect(() => {
    if(dialogIsOpen === false) {
      editingObject = null;
    }
  })

  const editorState = $derived.by(() => {
    if (tilemapEditorState.type === PaintType.OBJECT) return tilemapEditorState;
    throw new Error("Invalid UI state");
  });

  const objectsByCategory = (category: ObjectCategory) =>
    projectState.getObjects().filter((object) => object.category === category);

  const selectObject = (object: ProjectObject) => {
    editorState.selectedAsset = {
      type: PaintType.OBJECT,
      ref: { id: object.id },
    };
  };

  const openCreateDialog = () => {
    editingObject = null;
    dialogIsOpen = true;
  };

  const openEditDialog = (object: ProjectObject) => {
    editingObject = object;
    dialogIsOpen = true;
  };

  const handleDialogSave = (object: ProjectObject) => {
    if (editingObject) {
      projectState.updateObject(object);
    } else {
      projectState.createObject(
        object.name,
        object.width,
        object.height,
        object.image,
        object.category,
      );
    }

    dialogIsOpen = false;
  };

  const handleContextMenu = (object: ProjectObject, item: any) => {
    if (item.value === "edit") {
      openEditDialog(object);
    }

    if (item.value === "remove") {
      try {
        projectState.deleteObject(object.id);
      } catch (e) {
        if (e instanceof ProjectStateError) {
          guiState.notification = {
            msg: e.message,
            title: "Delete object",
            variant: "danger",
          };
        }
      }

      if (editorState.selectedAsset?.ref.id === object.id) {
        editorState.selectedAsset = null;
      }
    }
  };
</script>

<section id="objects">
  <header>
    <h2>Objects</h2>
    <sl-button onclick={openCreateDialog}
      ><sl-icon label="New auto tile" library="pixelarticons" name="plus"
      ></sl-icon></sl-button
    >
  </header>

  <sl-tab-group>
    {#each categories as category}
      <sl-tab slot="nav" panel={category.id}>{category.label}</sl-tab>
    {/each}

    {#each categories as category}
      <sl-tab-panel name={category.id}>
        <div class="object-grid">
          {#each objectsByCategory(category.id) as object}
            <ContextMenu
              onSelect={(item: any) => handleContextMenu(object, item)}
              menuItems={[
                { label: "Edit", value: "edit", icon: "edit-box" },
                { label: "Remove", value: "remove", icon: "close" },
              ]}
              >{#if object.name.length > 7}
                <sl-tooltip content={object.name}>
                  <sl-button
                    class="btn-obj {editorState.selectedAsset?.ref.id ===
                    object.id
                      ? 'selected'
                      : ''}"
                    onclick={() => selectObject(object)}
                  >
                    <sl-icon library="pixelarticons" name="toke-square"
                    ></sl-icon>

                    <p class="obj-name">{object.name}</p>
                  </sl-button>
                </sl-tooltip>
              {:else}
                <sl-button
                  class="btn-obj {editorState.selectedAsset?.ref.id ===
                  object.id
                    ? 'selected'
                    : ''}"
                  onclick={() => selectObject(object)}
                >
                  <sl-icon library="pixelarticons" name="toke-square"></sl-icon>

                  <p class="obj-name">{object.name}</p>
                </sl-button>
              {/if}
            </ContextMenu>
          {/each}
        </div>

        {#if objectsByCategory(category.id).length === 0}
          <div id="div-empty">
            <sl-icon library="pixelarticons" name="toke-square"></sl-icon>
          </div>
        {:else}{/if}
      </sl-tab-panel>
    {/each}
  </sl-tab-group>

  <ObjectDialog
    bind:open={dialogIsOpen}
    object={editingObject}
    onSave={handleDialogSave}
  />
</section>

<style>
  #objects header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  #objects h2 {
    margin: 0;
    font-size: 1rem;
  }

  .object-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    /* margin-top: 1rem; */
    margin: 0.5rem;
    gap: 0.5rem;
  }

  .btn-obj::part(label) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .btn-obj {
    width: 100%;
  }

  .obj-name {
    margin: 0;
    max-width: 75px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  sl-tab {
    padding: 0;
  }

  #div-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  sl-tab-group {
    overflow-x: hidden;
  }

  sl-tab-group::part(nav) {
    overflow-x: hidden;
  }

  sl-tab-group::part(body) {
    overflow-x: hidden;
  }

  .selected::part(base) {
    background: lime;
  }

  sl-tab-panel::part(base) {
    height: 100%;
    width: 100%;
    overflow-x: hidden;
  }

  sl-tab-panel {
    background-color: var(--color-3);
    --padding: 0;
    height: 400px;
    overflow-x: hidden;
  }
</style>
