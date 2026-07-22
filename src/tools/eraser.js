import { BaseTool } from './baseTool.js';

export class EraserTool extends BaseTool {
  constructor(canvasManager, paletteManager, historyManager) {
    super(canvasManager, paletteManager, historyManager);
    this.size = 12;
  }

  setEraserSize(s) {
    this.size = s;
  }

  onMouseDown(e, pos) {
    this.isDrawing = true;
    this.eraseAt(pos);
  }

  onMouseMove(e, pos) {
    this.renderCursor(pos);
    if (!this.isDrawing) return;
    this.eraseAt(pos);
  }

  onMouseUp(e, pos) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.historyManager.saveState();
  }

  eraseAt(pos) {
    const ctx = this.canvasManager.ctx;
    const size = Math.max(4, this.strokeWidth * 4);
    const half = Math.floor(size / 2);

    // MS Paint eraser fills with Secondary Color (Color 2)
    ctx.fillStyle = this.paletteManager.color2;
    ctx.fillRect(pos.x - half, pos.y - half, size, size);
  }

  renderCursor(pos) {
    const oCtx = this.canvasManager.oCtx;
    this.canvasManager.clearOverlay();

    const size = Math.max(4, this.strokeWidth * 4);
    const half = Math.floor(size / 2);

    oCtx.strokeStyle = '#000000';
    oCtx.lineWidth = 1;
    oCtx.strokeRect(pos.x - half, pos.y - half, size, size);

    oCtx.strokeStyle = '#ffffff';
    oCtx.strokeRect(pos.x - half - 1, pos.y - half - 1, size + 2, size + 2);
  }
}
