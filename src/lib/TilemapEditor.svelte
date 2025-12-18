<script lang="ts">
    import {onMount, tick } from "svelte";
    import {  guiState, projectState } from "../state.svelte";
    import { isPointInRect } from "./utils";
  import type { Tile, TileRef } from "../types";

    const {tileSize} = $derived(projectState);
    const {gridColor, tilemapEditorState} = $derived(guiState);

    let shiftKeyIsDown = $state(false);
    let ctrlKeyIsDown = $state(false);
    let isMousDown = $state(false);
    let translation = $state({ x: 0, y: 0 });
    let zoom = $state(1);
    let zoomPos = $state({ x: 0, y: 0 });
    let mousePosCanvas = $state({ x: 0, y: 0 });  

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

    isMousDown = true;

    const rect = canvasEl.getBoundingClientRect();
    
    const screenX = e.clientX - rect.left; 
    const screenY = e.clientY - rect.top;

    const {x, y} = getWorldPos(ctx, {x: screenX, y: screenY});
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
      
    switch(tilemapEditorState.type){
        case "tile":
            switch(tilemapEditorState.selectedTool){
                case "paint":
                    if(tilemapEditorState.selectedAsset === null) {
                            guiState.notification = {variant: "neutral", title: "No asset", 
                        msg: "Select a tile!"};
                        break;
                    }

                    tilemapEditorState.selectedLayer.data.set(`${row}:${col}`, tilemapEditorState.selectedAsset.ref as TileRef);

                    break;
                case "erase":
                    tilemapEditorState.selectedLayer.data.delete(`${row}:${col}`);
                    break;
            }
    
            break;
        case "area":
                switch(tilemapEditorState.selectedTool){
                    case "paint":
                        if(tilemapEditorState.selectedAsset === null) {
                                guiState.notification = {variant: "neutral", title: "Select area", 
                            msg: "No area selected!"};
                            break;
                        }

                        tilemapEditorState.selectedLayer.data.set(`${row}:${col}`, tilemapEditorState.selectedAsset.ref);
                        
                        break;
                case "erase":
                      tilemapEditorState.selectedLayer.data.delete(`${row}:${col}`);
                    break;
            }
    
            break;
        case "image":
            if(ctrlKeyIsDown) {
                for(const i of  tilemapEditorState.selectedLayer.data.toReversed()) {

                    const image = projectState.images[i.id];

                    if(isPointInRect({x, y}, {x: i.x, y: i.y, width: image.width, height: image.height})) {
                        i.isSelected = true;
                        break;
                    }
                }
            } else if(tilemapEditorState.selectedLayer.data.find(i => i.isSelected)){
                for(const i of tilemapEditorState.selectedLayer.data) {
                    i.isSelected = false;
                }
            } else{

                if(tilemapEditorState.selectedAsset === null) {
                        guiState.notification = {variant: "neutral", title: "Select image", 
                    msg: "No image selected!"};
                    break;
                }
                
                tilemapEditorState.selectedLayer.data = [...tilemapEditorState.selectedLayer.data, 
                {...tilemapEditorState.selectedAsset.ref, x, y, isSelected: false}];
                
            }
            break;
    }
     
}

const handleMouseUp = () => {
    if(isMousDown) isMousDown = false;  
}

const handleMouseMove = (e: MouseEvent) => {

    if(!canvasEl)return;
    const rect = canvasEl.getBoundingClientRect();

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    mousePosCanvas.x = canvasX;
    mousePosCanvas.y = canvasY;

    const {x, y} = getWorldPos(ctx, {x: canvasX, y: canvasY});
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if(isMousDown) {
          switch(tilemapEditorState.type){
            case "tile":
                switch(tilemapEditorState.selectedTool) {
                    case "paint":
                        if(tilemapEditorState.selectedAsset !== null) {
                           tilemapEditorState.selectedLayer.data.set(`${row}:${col}`,tilemapEditorState.selectedAsset.ref as TileRef);
                        }
                        break;
                    case "erase":
                        tilemapEditorState.selectedLayer.data.delete(`${row}:${col}`);
                        break;
                }

                break;
            case "area":
                switch(tilemapEditorState.selectedTool) {
                    case "paint":
                         if(tilemapEditorState.selectedAsset !== null) {
                            tilemapEditorState.selectedLayer.data.set(`${row}:${col}`, tilemapEditorState.selectedAsset.ref);
                        }
                        break;
                    case "erase":
                        tilemapEditorState.selectedLayer.data.delete(`${row}:${col}`);
                        break;
                }
                break;
            case "image":
                if(ctrlKeyIsDown) {
                    for(const i of tilemapEditorState.selectedLayer.data){
                        if(i.isSelected) {
                            i.x += e.movementX * (1 / zoom);
                            i.y += e.movementY * (1 / zoom);
                        }
                    }
                }

                break;
        }
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
            zoomPos = getWorldPos(ctx, { x: mousePosCanvas.x, y: mousePosCanvas.y  });
            // Update current translation to account for zoompoint
            translation.x = mousePosCanvas.x - zoomPos.x * zoom;
            translation.y = mousePosCanvas.y - zoomPos.y * zoom;
        }
    } else {
    if(zoom > 0.5) {

                zoom -= zoomFactor;
                zoomPos = getWorldPos(ctx, { x: mousePosCanvas.x, y: mousePosCanvas.y  });
                // Update current translation to account for zoompoint
                translation.x = mousePosCanvas.x - zoomPos.x * zoom;
                translation.y = mousePosCanvas.y - zoomPos.y * zoom;
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
            zoomPos = getWorldPos(ctx, { x: mousePosCanvas.x, y: mousePosCanvas.y  });
            // Update current translation to account for zoompoint
            translation.x = mousePosCanvas.x - zoomPos.x * zoom;
            translation.y = mousePosCanvas.y - zoomPos.y * zoom;
        }
            break;
        case "-":
             if(zoom > 0.5) {

                zoom -= 0.1;
                zoomPos = getWorldPos(ctx, { x: mousePosCanvas.x, y: mousePosCanvas.y  });
                // Update current translation to account for zoompoint
                translation.x = mousePosCanvas.x - zoomPos.x * zoom;
                translation.y = mousePosCanvas.y - zoomPos.y * zoom;
            }
            break; 
        case "del":
        case "backspace":
            if(tilemapEditorState.type === "image")
                tilemapEditorState.selectedLayer.data = tilemapEditorState.selectedLayer.data.filter(l => !l.isSelected)
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
                        const [ty, tx] = key.split(':').map(Number);
                        ctx.drawImage(projectState.tilesets[tileRef.tilesetId].tiles[tileRef.tileId].bitmap, 
                        tx * tileSize, ty * tileSize, tileSize, tileSize)
                    }
                break;
                case "image":
                    for (const i of layer.data) {

                        const image = projectState.images[i.id];
               
                        ctx.drawImage(image.bitmap, i.x, i.y, image.width, image.height);

                        if(i.isSelected) {
                            ctx.strokeStyle = "lime";
                            ctx.strokeRect(i.x, i.y, image.width, image.height);
                        }
                    }
                    break;
                case "area":

                    for (const [key, areaRef] of layer.data) {

                        const [ty, tx] = key.split(':').map(Number);

                        ctx.strokeStyle = projectState.areas[areaRef.id].color;

                        ctx.strokeRect(tx * tileSize, ty * tileSize, tileSize, tileSize); 
                  
                    }

                    break;
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

<svelte:window
  onwheel={handleWheel}
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}

  onmouseup={handleMouseUp}
/>

<canvas  bind:this={canvasEl}  onmousemove={handleMouseMove}
  onmousedown={handleMouseDown} ></canvas>

<style lang="postcss">
  canvas {
    background-color: var(--color-0);
    width: 100%;
    height: 100%;
  }
</style>
