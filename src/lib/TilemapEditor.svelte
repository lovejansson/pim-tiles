<script lang="ts">
    import {onMount, tick } from "svelte";
    import { guiState, projectState } from "../state.svelte";
    import { isPointInRect } from "./utils";


    const {tileSize} = $derived(projectState);
    const {gridColor, selectedTool} = $derived(guiState);

    const selectedLayer = $derived.by(() => {

        const layer = projectState.layers.find(l => l.id === guiState.selectedLayer);

        if(layer === undefined) throw new Error("Internal error: selected layer missing");
            return layer;
        }
    );

    let shiftKeyIsDown = $state(false);
    let ctrlKeyIsDown = $state(false);
    let isMouseDownImage = $state(false);
    let translation = $state({ x: 0, y: 0 });
    let zoom = $state(1);
    let zoomPos = $state({ x: 0, y: 0 });
    let mousePos = $state({ x: 0, y: 0 });  

    let canvasEl!: HTMLCanvasElement;
    let ctx!: CanvasRenderingContext2D;

    onMount(async () => {
        ctx = canvasEl.getContext('2d')!;
        await tick();
        canvasEl.width = canvasEl.clientWidth;
        canvasEl.height = canvasEl.clientHeight;
        
        update(0);
    });

const handleMouseDown = (e: MouseEvent) => {

    if(ctrlKeyIsDown) {
 const rect = canvasEl.getBoundingClientRect();
        
        const screenX = e.clientX - rect.left; 
        const screenY = e.clientY - rect.top;

        const {x, y} = getWorldPos(ctx, {x: screenX, y: screenY})

        
        if(selectedLayer.type === "image") {

           for(const i of selectedLayer.data.toReversed()) {
                const image = projectState.images[i.index];

                if(isPointInRect({x, y}, {x: i.x, y: i.y, width: image.width, height: image.height})) {
                    i.isSelected = true;
                    isMouseDownImage = true;
                    break;
                }
            }
        }
    }  
     
}

const handleMouseUp = (e: MouseEvent) => {
    if(isMouseDownImage) isMouseDownImage = false;  
}

const handleMouseMove = (e: MouseEvent) => {


    if(e.target !== canvasEl)  return;

    if(isMouseDownImage && selectedLayer.type === "image") {
    
        for(const i of selectedLayer.data){
            if(i.isSelected) {
          
                i.x += e.movementX * (1 / zoom);
                i.y += e.movementY * (1 / zoom);
            }
        }
    } else {
   
        const rect = canvasEl.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        mousePos.x = screenX;
        mousePos.y = screenY;
    }



};

    const handleClick = (e: MouseEvent) => {

        const rect = canvasEl.getBoundingClientRect();
        
        const screenX = e.clientX - rect.left; 
        const screenY = e.clientY - rect.top;

        const {x, y} = getWorldPos(ctx, {x: screenX, y: screenY})

        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);

    
        if(selectedLayer.type === "image") {
            if(guiState.selectedAsset?.type !== "image"){
                guiState.notification = {variant: "neutral", title: "Select an image", msg: "Select which image to place!"};
            return;
        }


        if(ctrlKeyIsDown) {
            for(const i of selectedLayer.data.toReversed()) {
                const image = projectState.images[i.index];

                
                if(isPointInRect({x, y}, {x: i.x, y: i.y, width: image.width, height: image.height})) {
                    i.isSelected = true;
                    break;
                }
            }
     

        } 
        else if (selectedLayer.data.find(i => i.isSelected) !== undefined) {
            selectedLayer.data.forEach(i => i.isSelected = false);
        } else {
            // Draw image on top of layer 
            
            selectedLayer.data = [...selectedLayer.data, ({...guiState.selectedAsset.ref, x, y, isSelected: false})];
        }
        
   
    }

    if(selectedTool === "paint") {
        if(guiState.selectedAsset) {
            switch(guiState.selectedAsset.type) {
                case "tile":
                    if(selectedLayer.type === "tile") {
                        selectedLayer.data.set(`${row},${col}`, {...guiState.selectedAsset.ref});
                    }
                break;
                case "image":
                    // Separate image layer map
                case "auto-tile":
                    // Separate paint with auto tile
            }
        }
    } else if(selectedTool === "erase") {
          if(selectedLayer.type !== "tile") throw Error("MKL")
        // TODO: If tile is painted with auto tile, update its neighbours
        selectedLayer.data.delete(`${row},${col}`);
    }

};


function getWorldPos(ctx: CanvasRenderingContext2D, pos: {x: number, y: number }) {

    const inv = ctx.getTransform().invertSelf();

    const worldX = inv.a * pos.x + inv.c * pos.y + inv.e;
    const worldY = inv.b * pos.x + inv.d * pos.y + inv.f;

    return {x: worldX, y: worldY}
}

const handleWheel = (e: WheelEvent) => {

    if(e.target !== canvasEl)  return;

    const delta = Math.sign(e.deltaY);

    const zoomFactor = 0.1;

    if(delta < 0) {
        if(zoom <= 5.0) {
            zoom += zoomFactor;
            zoomPos = getWorldPos(ctx, { x: mousePos.x, y: mousePos.y  });
            // Update current translation to account for zoompoint
            translation.x = mousePos.x - zoomPos.x * zoom;
            translation.y = mousePos.y - zoomPos.y * zoom;
        }
    } else {
    if(zoom > 0.5) {

                zoom -= zoomFactor;
                zoomPos = getWorldPos(ctx, { x: mousePos.x, y: mousePos.y  });
                // Update current translation to account for zoompoint
                translation.x = mousePos.x - zoomPos.x * zoom;
                translation.y = mousePos.y - zoomPos.y * zoom;
            }
    }

    e.stopPropagation();
    
};  

const handleKeyUp = (e: KeyboardEvent) => {
    if(e.key.toLowerCase() === "shift") shiftKeyIsDown = false;
    if(e.key.toLowerCase() === "meta" || e.key.toLowerCase() === "control")  ctrlKeyIsDown = false;
}

const handleKeyDown = (e: KeyboardEvent) => {

    if(e.shiftKey) shiftKeyIsDown = true;
    if(e.ctrlKey || e.metaKey)  ctrlKeyIsDown = true;

    console.log(e.key)
    switch(e.key.toLowerCase()) {
        case "arrowup":
        case "w":
            translation.y += tileSize;
            break;
        case "arrowdown":
        case "s":
            translation.y -= tileSize;
            break;
        case "arrowleft":
        case "a":
            translation.x += tileSize;
            break;
        case "arrowright":
        case "d":
            translation.x -= tileSize;
            break;
        case "+":
            if(zoom <= 5.0) {
            zoom += 0.1;
            zoomPos = getWorldPos(ctx, { x: mousePos.x, y: mousePos.y  });
            // Update current translation to account for zoompoint
            translation.x = mousePos.x - zoomPos.x * zoom;
            translation.y = mousePos.y - zoomPos.y * zoom;
        }
            break;
        case "-":
             if(zoom > 0.5) {

                zoom -= 0.1;
                zoomPos = getWorldPos(ctx, { x: mousePos.x, y: mousePos.y  });
                // Update current translation to account for zoompoint
                translation.x = mousePos.x - zoomPos.x * zoom;
                translation.y = mousePos.y - zoomPos.y * zoom;
            }
            break; 
        case "del":
        case "backspace":
            if(selectedLayer.type === "image")
                selectedLayer.data = selectedLayer.data.filter(l => !l.isSelected)
            break;
    
    }
};



function draw(ctx: CanvasRenderingContext2D) {

    ctx.resetTransform();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    ctx.translate(translation.x, translation.y);
    ctx.scale(zoom, zoom); 
 
    const {x0, x1, y0, y1} = getWorldBounds(ctx);

    const startX = Math.floor(x0 / tileSize) * tileSize;
    const startY = Math.floor(y0 / tileSize) * tileSize;

    ctx.beginPath();

    ctx.strokeStyle = gridColor;

    for (let y = startY; y <= y1; y += tileSize) {
        for (let x = startX; x <= x1; x += tileSize) {
            ctx.rect(x, y, tileSize, tileSize);
        }
    }

    ctx.stroke();

    for(const layer of projectState.layers) {
        if(layer.isVisible) {
            switch(layer.type) {
                case "tile":
                    for (const [key, tileRef] of layer.data) {
                        const [ty, tx] = key.split(',').map(Number);
                        ctx.drawImage(projectState.tilesets[tileRef.tilesetIdx].tiles[tileRef.tileIdx].bitmap, 
                        tx * tileSize, ty * tileSize, tileSize, tileSize)
                    }
                break;
                case "image":
                    for (const i of layer.data) {

                        const image = projectState.images[i.index];
               
                        ctx.drawImage(image.bitmap, i.x, i.y, image.width, image.height);

                        if(i.isSelected) {
                            ctx.strokeStyle = "lime";
                            ctx.strokeRect(i.x, i.y, image.width, image.height);
                        }
                    }
                case "area":
            }
        }
    }
}


function getWorldBounds(ctx: CanvasRenderingContext2D) {

    const m = ctx.getTransform().invertSelf();

    const topLeft = new DOMPoint(0, 0).matrixTransform(m);
    const bottomRight = new DOMPoint(canvasEl.width, canvasEl.height).matrixTransform(m);

    return {
        x0: topLeft.x,
        y0: topLeft.y,
        x1: bottomRight.x,
        y1: bottomRight.y
    };
}

function update(elasped: number){
    draw(ctx);
    requestAnimationFrame((elapsed) => update(elapsed));
}



</script>

<svelte:window onwheel={handleWheel} 
    onkeydown={handleKeyDown} 
    onkeyup={handleKeyUp} 
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}

 />

<canvas onclick={handleClick} bind:this={canvasEl}></canvas>

<style lang="postcss">

   canvas {
        background-color: var(--color-0);
        width: 100%;
        height: 100%;
    }

</style>
