import { BaseTool } from './baseTool.js';

export class EyedropperTool extends BaseTool {
  onMouseDown(e, pos) {
    const ctx = this.canvasManager.ctx;
    const isRightClick = e.button === 2;

    if (pos.x < 0 || pos.x >= this.canvasManager.width || pos.y < 0 || pos.y >= this.canvasManager.height) return;

    const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    const hex = '#' + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);

    if (isRightClick) {
      this.paletteManager.setColor2(hex);
    } else {
      this.paletteManager.setColor1(hex);
    }
  }

  onMouseMove(e, pos) {
    const oCtx = this.canvasManager.oCtx;
    this.canvasManager.clearOverlay();
    oCtx.save();
    oCtx.strokeStyle = '#000000';
    oCtx.lineWidth = 1;
    oCtx.beginPath();
    oCtx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
    oCtx.stroke();
    oCtx.strokeStyle = '#ffffff';
    oCtx.beginPath();
    oCtx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    oCtx.stroke();
    oCtx.restore();
  }
}
