import { BaseTool } from './baseTool.js';

export class PencilTool extends BaseTool {
  constructor(canvasManager, paletteManager, historyManager) {
    super(canvasManager, paletteManager, historyManager);
    this.lastPos = null;
  }

  onMouseDown(e, pos) {
    this.isDrawing = true;
    this.isRightClick = e.button === 2;
    this.lastPos = pos;

    const ctx = this.canvasManager.ctx;
    const size = Math.max(1, this.strokeWidth);
    const color = this.getColor(this.isRightClick);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  onMouseMove(e, pos) {
    this.renderCursor(pos);
    if (!this.isDrawing) return;
    const ctx = this.canvasManager.ctx;
    const color = this.getColor(this.isRightClick);
    const size = Math.max(1, this.strokeWidth);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.lastPos.x, this.lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    this.lastPos = pos;
  }

  renderCursor(pos) {
    const oCtx = this.canvasManager.oCtx;
    this.canvasManager.clearOverlay();

    const size = Math.max(1, this.strokeWidth);
    oCtx.save();
    oCtx.strokeStyle = '#000000';
    oCtx.lineWidth = 1;
    oCtx.beginPath();
    oCtx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
    oCtx.stroke();

    oCtx.strokeStyle = '#ffffff';
    oCtx.beginPath();
    oCtx.arc(pos.x, pos.y, (size / 2) + 1, 0, Math.PI * 2);
    oCtx.stroke();
    oCtx.restore();
  }

  onMouseUp(e, pos) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.historyManager.saveState();
  }
}
