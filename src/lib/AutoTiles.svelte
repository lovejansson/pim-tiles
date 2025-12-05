<script lang="ts">
  import type { SlInput, SlChangeEvent } from "@shoelace-style/shoelace";


type Rule = {

}

type AutoTile = {
    name: string;
    rules: Rule[];
}

 let fileInput: SlInput;
</script>

<section id="auto-tiles">
    <header>
            <h2>Auto tiles</h2>
                <sl-button  onclick={() => {
    fileInput?.showPicker()
    }}><sl-icon label="New layer" library="pixelarticons" name="plus"></sl-icon></sl-button>


    </header>


<sl-input bind:this={fileInput} type="file" style="display:none;" onsl-change={(e: SlChangeEvent) => {
    console.dir(e)  
}}></sl-input>
    <ul id="ul-auto-tiles">
          
    <li>Create an auto tile to paint with.</li>
   
    </ul>
</section>

<style lang="postcss">
        header {
        display: flex;
        justify-content: space-between;
    }
    #auto-tiles {
        
        width: 320px !important;
        height:  100%;
        
    }

    ul {
        background-color: var(--color-4);
             padding: 1rem 0;   
    }   

</style>

