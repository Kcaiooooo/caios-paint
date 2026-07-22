import { BaseTool } from './baseTool.js';

export class FloodFillTool extends BaseTool {
  constructor(canvasManager, paletteManager, historyManager) {
    super(canvasManager, paletteManager, historyManager);
    this.tolerance = 20; // 0 to 100 tolerance
  }

  onMouseDown(e, pos) {
    this.isRightClick = e.button === 2;
    const fillColor = this.getColor(this.isRightClick);
    this.floodFill(pos.x, pos.y, fillColor);
  }

  hexToRgba(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
  }

  floodFill(startX, startY, fillColorHex) {
    const ctx = this.canvasManager.ctx;
    const w = this.canvasManager.width;
    const h = this.canvasManager.height;

    if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const fillRgba = this.hexToRgba(fillColorHex);
    const targetIdx = (startY * w + startX) * 4;
    const targetR = data[targetIdx];
    const targetG = data[targetIdx + 1];
    const targetB = data[targetIdx + 2];
    const targetA = data[targetIdx + 3];

    // If target color is identical to fill color, return
    if (
      targetR === fillRgba[0] &&
      targetG === fillRgba[1] &&
      targetB === fillRgba[2] &&
      targetA === fillRgba[3]
    ) return;

    const colorMatch = (r, g, b, a) => {
      const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB) + Math.abs(a - targetA);
      return diff <= this.tolerance * 4;
    };

    const queue = [startX, startY];
    const visited = new Uint8Array(w * h);
    visited[startY * w + startX] = 1;

    while (queue.length > 0) {
      const cy = queue.pop();
      const cx = queue.pop();

      const idx = (cy * w + cx) * 4;
      data[idx] = fillRgba[0];
      data[idx + 1] = fillRgba[1];
      data[idx + 2] = fillRgba[2];
      data[idx + 3] = fillRgba[3];

      // Check 4 neighbors
      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];

        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nPos = ny * w + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            const nIdx = nPos * 4;
            if (colorMatch(data[nIdx], data[nIdx + 1], data[nIdx + 2], data[nIdx + 3])) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.historyManager.saveState();
  }
}
