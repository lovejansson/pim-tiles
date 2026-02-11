import type { Point, Rect, Tile, Tileset } from "./types";

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

const splitIntoTiles = async (tileset: Tileset, tileSize: number): Promise<Tile[]> => {

    const tiles: Tile[] = [];

    for (let y = 0; y < tileset.height; y += tileSize) {
        for (let x = 0; x < tileset.width; x += tileSize) {
            tiles.push({ tilesetId: tileset.id, tilesetPos: { y, x } });
        }
    }

    return tiles;
}

function roundToDecimal(num: number, decimalPlaces: number) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(num * factor) / factor;
}

function bitmapToDataURL(bitmap: ImageBitmap) {
    const ctx = createOffScreenCanvas(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, 0, 0);
    return ctx.canvas.toDataURL('image/png');
}

async function dataURLToBitmap(dataURL: string) {
    const blob = await fetch(dataURL).then(r => r.blob());
    return await createImageBitmap(blob);
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


export { dataURLToBitmap, splitIntoTiles, bitmapToDataURL, roundToDecimal, isPointInRect, getNeighbours, detectOS, isTransparent, createOffScreenCanvas, download }