import type { Point, Rect, Tile } from "./types";

function detectOS() {
    const platform = navigator.platform.toLowerCase();

    if (platform.includes('win')) {
        return 'Windows';
    } else if (platform.includes('mac')) {
        return 'Mac';
    } else {
        return 'Other';
    }
}

function createOffScreenCanvas(width: number, height: number) {

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx === null) throw new Error("ctx is null");

    return ctx;
}

const splitIntoTiles = async (spritesheet: ImageBitmap, tileSize: number): Promise<Tile[]> => {

    try {

        const ctx = createOffScreenCanvas(tileSize, tileSize);

        const tiles = [];

        for (let r = 0; r < spritesheet.height; r += tileSize) {
            for (let c = 0; c < spritesheet.width; c += tileSize) {

                ctx.drawImage(spritesheet, c, r, tileSize, tileSize, 0, 0, tileSize, tileSize);

                const tileImageData = ctx.getImageData(0, 0, tileSize, tileSize);
                const bitmap = await window.createImageBitmap(tileImageData);

                const dataURL = ctx.canvas.toDataURL("image/png");
                tiles.push({ id: crypto.randomUUID(), dataURL, bitmap, isTransparent: isTransparent(bitmap) });
                ctx.clearRect(0, 0, tileSize, tileSize);
            }
        }

        return tiles;

    } catch (e) {
        console.error(e);
        throw new Error("Failed to split spritesheet into tiles");
    }

}

function roundToDecimal(num: number, decimalPlaces: number) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(num * factor) / factor;
}

async function bitmapToDataURL(bitmap: ImageBitmap) {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error("ctx is null");
    ctx.drawImage(bitmap, 0, 0);

    return canvas.toDataURL('image/png');
}

function isPointInRect(point: Point, rect: Rect) {
    return point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height;
}


function getNeighbours(cell: { row: number, col: number }, includeDiagonalNeighbours: boolean = false) {

    const neighbours = [];

    const neighbourDiffs = includeDiagonalNeighbours ?
        [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]]
        :
        [[-1, 0], [0, 1], [1, 0], [0, -1]]

    for (const [r, c] of neighbourDiffs) {
        const n = { row: cell.row + r, col: cell.col + c };
        neighbours.push(n);
    }

    return neighbours;
}

function isTransparent(bitmap: ImageBitmap) {
    const ctx = createOffScreenCanvas(bitmap.width, bitmap.height);

    ctx.drawImage(bitmap, 0, 0);

    const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;


    for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) {
            return false;
        }
    }

    return true;
}

function download(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tilemap.json";
  a.click();
}


export { splitIntoTiles, bitmapToDataURL, roundToDecimal, isPointInRect, getNeighbours, detectOS, isTransparent, createOffScreenCanvas,download }