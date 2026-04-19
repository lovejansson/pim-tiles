<script lang="ts">
  import {
    SlIconButton,
    SlInput,
    type SlChangeEvent,
  } from "@shoelace-style/shoelace";
  import { evaluateArithmeticExpr } from "../../arithmeticParser";

  type AttributesDialogProps = {
    title: string;
    attributes: [string, string][];
    inheritedAttributes?: [string, string][];
    onSave: () => void;
    open: boolean;
    img?: string;
  };

  let {
    title,
    open = $bindable(),
    attributes = $bindable(),
    inheritedAttributes,
    onSave,
    img,
  }: AttributesDialogProps = $props();

  let deleteButtons: SlIconButton[] = $state([]);
  let focusBtnIdx: number | null = $state(null);
  let attributeNameEls: SlInput[] = $state([]);

  $effect(() => {
    if (focusBtnIdx !== null) {
      deleteButtons[focusBtnIdx]?.focus();
      focusBtnIdx = null;
    }
  });

  const hide = () => {
    open = false;
  };

  const save = () => {
    onSave();
    hide();
  };

  const addNewAttribute = () => {
    const countNameNew = attributes.reduce(
      (acc, curr) => (acc += curr[0].startsWith("new") ? 1 : 0),
      0,
    );
    countNameNew > 0
      ? attributes.push([`new(${countNameNew})`, ""])
      : attributes.push(["new", ""]);

    requestAnimationFrame(() => {
      attributeNameEls[attributes.length - 1].focus();
    });
  };

  const deleteAttribute = (idx: number) => {
    const isLastAttr = idx === attributes.length - 1;
    attributes.splice(idx, 1);

    // Pick focus idx to advance focus to the next delete button in list

    if (isLastAttr) {
      if (attributes.length > 0) {
        focusBtnIdx = idx - 1;
      }
    } else {
      focusBtnIdx = idx + 1;
    }
  };

  const updateAttributeValue = (idx: number, value: string) => {
    attributes[idx][1] = value;
  };

  const updateAttributeKey = (idx: number, key: string) => {
    attributes[idx][0] = key;
  };
</script>

<sl-dialog onsl-after-hide={hide} label={title} {open}>
  <sl-icon-button
    slot="header-actions"
    library="pixelarticons"
    name="close"
    style="font-size: 1.6rem;"
    onclick={hide}
  >
  </sl-icon-button>

  {#if img !== undefined}
    <img src={img} alt="tile" />
  {/if}

  <section id="section-attributes">
    {#if inheritedAttributes?.length}
      <p style="font-size: smaller;margin:0;">
        Inherited from tile or autotile
      </p>
      {#each inheritedAttributes as [key, value]}
        <li class="attribute inherited-attribute">
          <sl-input disabled label="Name" type="text" value={key}></sl-input>
          <sl-input disabled label="Value" type="text" {value}></sl-input>
        </li>
      {/each}
    {/if}

    {#if attributes.length > 0}
      <ul id="attributes">
        {#each attributes as [key, value], idx}
          <li class="attribute">
            <sl-input
              bind:this={attributeNameEls[idx]}
              label="Name"
              type="text"
              value={key}
              onsl-change={(e: SlChangeEvent) => {
                if (e.target === null) return;
                updateAttributeKey(idx, (e.target as SlInput).value);
              }}
            ></sl-input>
            <sl-input
              onsl-change={(e: SlChangeEvent) => {
                if (e.target === null) return;
                const value = (e.target as SlInput).value;
                try {
                  const res = evaluateArithmeticExpr(value);
                  updateAttributeValue(idx,"");
                  updateAttributeValue(idx, res.toString());
                } catch (e) {
                  updateAttributeValue(idx, value);
                }
              }}
              label="Value"
              type="text"
              {value}
            ></sl-input>
            <sl-icon-button
              class="btn-delete"
              bind:this={deleteButtons[idx]}
              onclick={() => deleteAttribute(idx)}
              library="pixelarticons"
              name="close"
            >
            </sl-icon-button>
          </li>
        {/each}
      </ul>
    {/if}
    {#if !attributes.length && !inheritedAttributes?.length}
      <div id="no-attributes-added">
        <p>No attributes added.</p>
      </div>
    {/if}
  </section>
  <div slot="footer">
    <sl-button id="btn-add" variant="default" onclick={addNewAttribute}>
      Add
    </sl-button>
    <sl-button variant="primary" onclick={save}>Save</sl-button>
  </div>
</sl-dialog>

<style>
  sl-dialog::part(body) {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    font-size: small;
  }
  sl-dialog {
    --width: 600px;
  }

  sl-dialog::part(close-button) {
    display: none;
  }

  img {
    width: 64px;
    height: 64px;
    image-rendering: pixelated;
  }

  .btn-delete {
    font-size: 1.6rem;
    align-self: flex-end;
  }

  #section-attributes {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: fit-content;
  }

  #no-attributes-added {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  #btn-add {
    width: fit-content;
    align-self: flex-end;
  }

  #attributes {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .attribute {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
</style>
