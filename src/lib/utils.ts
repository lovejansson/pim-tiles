import type { Point, Rect } from "../types";

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

function isPointInRect(point: Point, rect: Rect) {
    return point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height;
}

export {detectOS, isPointInRect}