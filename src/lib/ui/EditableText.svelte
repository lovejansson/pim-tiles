<script lang="ts">
  import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";

  type EditableTextProps = {
    text: string;
    isEditing: boolean;
    inputWidth?: number;
  };

  let {
    text = $bindable(),
    isEditing = $bindable(),
    inputWidth,
  }: EditableTextProps = $props();

  let inputName: SlInput | null = $state(null);

  $effect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        if (inputName) inputName.focus();
      });
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if isEditing}
  <sl-input
    style={`width:${inputWidth}px`}
    value={text}
    size="small"
    bind:this={inputName}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter") {
        isEditing = false;
      }
    }}
    onblur={() => {
      isEditing = false;
    }}
    onsl-change={(e: SlChangeEvent) => {
      text = (e.target as SlInput).value;
    }}
  ></sl-input>
{:else}
  <p>{text}</p>
{/if}

<style lang="postcss">
  p {
    margin: 0;
    margin-right: auto;
  }
</style>
