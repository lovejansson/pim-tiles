<script lang="ts">
    import {onMount, tick } from "svelte";
  import { guiState, projectState } from "../state.svelte";


    const {tileSize, tilemap} = $derived(projectState);
    const {gridColor, selectedTool} = $derived(guiState);


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

  

const handleMouseMove = (e: MouseEvent) => {

    const rect = canvasEl.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    mousePos.x = screenX;
    mousePos.y = screenY;

};

const handleClick = (e: MouseEvent) => {
    const rect = canvasEl.getBoundingClientRect();
    
    const screenX = e.clientX - rect.left; 
    const screenY = e.clientY - rect.top;

    const {x, y} = getWorldPos(ctx, {x: screenX, y: screenY})

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    tilemap.set(`${row},${col}`, {tilesetIdx: 0, tileIdx: 0});

};


function getWorldPos(ctx: CanvasRenderingContext2D, pos: {x: number, y: number }) {

    const inv = ctx.getTransform().invertSelf();

    const worldX = inv.a * pos.x + inv.c * pos.y + inv.e;
    const worldY = inv.b * pos.x + inv.d * pos.y + inv.f;

    return {x: worldX, y: worldY}
}

const handleWheel = (e: WheelEvent) => {


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

                zoom -=zoomFactor;
                zoomPos = getWorldPos(ctx, { x: mousePos.x, y: mousePos.y  });
                // Update current translation to account for zoompoint
                translation.x = mousePos.x - zoomPos.x * zoom;
                translation.y = mousePos.y - zoomPos.y * zoom;
            }
    }
    e.preventDefault();
    e.stopPropagation();
    
};  

const handleKeyDown = (e: KeyboardEvent) => {
    switch(e.key) {
        case "ArrowUp":
            translation.y += tileSize;
            break;
        case "ArrowDown":
            translation.y -= tileSize;
            break;
        case "ArrowLeft":
            translation.x += tileSize;
            break;
        case "ArrowRight":
            translation.x -= tileSize;
            break;
        case "+": 
        if(zoom <= 3.0) {
            zoom += 0.1;
            zoomPos = getWorldPos(ctx, { x: mousePos.x, y: mousePos.y  });
            // Update current translation to account for zoompoint
            translation.x = mousePos.x - zoomPos.x * zoom;
            translation.y = mousePos.y - zoomPos.y * zoom;
        }
            break;
        case "-":
            if(zoom > 0.8) {

                zoom -= 0.1;
                zoomPos = getWorldPos(ctx, { x: mousePos.x, y: mousePos.y  });
                // Update current translation to account for zoompoint
                translation.x = mousePos.x - zoomPos.x * zoom;
                translation.y = mousePos.y - zoomPos.y * zoom;
            }
        
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


    for (const [key, color] of tilemap) {
        const [ty, tx] = key.split(',').map(Number);
        
        ctx.fillStyle = "red";
        
        ctx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
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

<svelte:window onwheel={handleWheel} onkeydown={handleKeyDown} onmousemove={handleMouseMove} />

<canvas onclick={handleClick} bind:this={canvasEl}></canvas>

<style lang="postcss">

   canvas {
        background-color: var(--color-0);
        width: 100%;
        height: 100%;
    }

</style>
