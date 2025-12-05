import type { Image, Tile } from "./types";

 const splitIntoTiles = async (spritesheet: ImageBitmap, tileSize: number): Promise<Tile[]> => {

    try {

    const canvas = document.createElement("canvas");
    canvas.width = tileSize;
    canvas.height = tileSize;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx === null) throw new Error("ctx is null");

    const tiles = [];

    for (let r = 0; r < spritesheet.height; r += tileSize) {
        for (let c = 0; c < spritesheet.width; c += tileSize) {

            ctx.drawImage(spritesheet, c, r, tileSize, tileSize, 0, 0, tileSize, tileSize);

            const tileImageData = ctx.getImageData(0, 0, tileSize, tileSize);
            const bitmap = await window.createImageBitmap(tileImageData);
            const dataURL = canvas.toDataURL("image/png");

            tiles.push({ dataURL, bitmap });

            ctx.clearRect(0, 0, tileSize, tileSize);

        } 
    }

    return tiles;
    }catch(e) {
        console.error(e);
        throw new Error("Failed to split spritesheet into tiles");
    }

 }

async function bitmapToDataURL(bitmap : ImageBitmap) {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if(ctx === null) throw new Error("ctx is null");
    ctx.drawImage(bitmap, 0, 0);

    return canvas.toDataURL('image/png');
}

 export {splitIntoTiles, bitmapToDataURL}