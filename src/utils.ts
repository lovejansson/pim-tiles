import type { Cell, Vec2, Rect } from "./types";

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (ctx === null) throw new Error("ctx is null");

  ctx.imageSmoothingEnabled = false;

  return ctx;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob: Blob | null) => {
      if (blob === null) {
        reject(new Error("Failed to create blob of canvas"));
      } else {
        resolve(blob);
      }
    }, "image/png");
  });
}

async function dataURLToImageBitmap(dataURL: string) {
  const res = await fetch(dataURL);
  const blob = await res.blob();
  return await createImageBitmap(blob);
}

function isPointInRect(point: Vec2, rect: Rect) {
  return (
    point.x > rect.x &&
    point.x < rect.x + rect.width &&
    point.y > rect.y &&
    point.y < rect.y + rect.height
  );
}

function getNeighbours(
  cell: { row: number; col: number },
  rows: number,
  cols: number,
  includeDiagonalNeighbours: boolean = false,
) {
  const neighbours = [];

  const neighbourDiffs = includeDiagonalNeighbours
    ? [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ]
    : [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ];

  for (const [r, c] of neighbourDiffs) {
    if (
      cell.row + r >= 0 &&
      cell.row + r < rows &&
      cell.col + c >= 0 &&
      cell.col + c < cols
    ) {
      const n = { row: cell.row + r, col: cell.col + c };
      neighbours.push(n);
    }
  }

  return neighbours;
}

function download(blob: Blob, filename: string, extension: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${extension}`;
  a.click();
}

function isSameCell(cell1: Cell, cell2: Cell) {
  return cell1.row === cell2.row && cell1.col === cell2.col;
}

function isSamePos(pos1: Vec2, pos2: Vec2) {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

export {
  dataURLToImageBitmap,
  canvasToBlob,
  isSameCell,
  isPointInRect,
  getNeighbours,
  createCanvas,
  download,
  isSamePos,
};
