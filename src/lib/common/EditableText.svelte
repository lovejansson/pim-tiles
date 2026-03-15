<script lang="ts">
  import { SlInput, type SlChangeEvent } from "@shoelace-style/shoelace";

  type EditableTextProps = {
    text: string;
    isEditing: boolean;
    inputWidth?: string;
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

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->

  {#if isEditing}
    <sl-input
      style={`width:${inputWidth}`}
      value={text}
      size="small"
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === "Enter") {
          isEditing = false;
        }
      }}
      bind:this={inputName}
      onblur={() => {
        isEditing = false;
      }}
      onsl-change={(e: SlChangeEvent) => {
        text = (e.target as SlInput).value;
      }}
    ></sl-input>
  {:else}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <p>{text}</p>
  {/if}


<style lang="postcss">
  p {
    margin: 0;
    margin-right: auto;
  }

  p:focus {
    outline: 2px solid var(--color-0);
  }
</style>
