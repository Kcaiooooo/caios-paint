import { BaseTool } from './baseTool.js';

export class ZoomTool extends BaseTool {
  onMouseDown(e, pos) {
    const isRightClick = e.button === 2;
    let currentZoom = this.canvasManager.zoom;

    if (isRightClick) {
      currentZoom = Math.max(0.1, currentZoom / 1.25);
    } else {
      currentZoom = Math.min(8.0, currentZoom * 1.25);
    }

    this.canvasManager.setZoom(currentZoom);
    this.updateZoomUI(currentZoom);
  }

  onMouseMove(e, pos) {
    const oCtx = this.canvasManager.oCtx;
    this.canvasManager.clearOverlay();
    oCtx.save();
    oCtx.strokeStyle = '#000000';
    oCtx.lineWidth = 1;
    oCtx.beginPath();
    oCtx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    oCtx.stroke();
    oCtx.strokeStyle = '#ffffff';
    oCtx.beginPath();
    oCtx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
    oCtx.stroke();
    oCtx.restore();
  }

  updateZoomUI(zoom) {
    const pct = Math.round(zoom * 100);
    const range = document.getElementById('zoomRange');
    const label = document.getElementById('zoomLabel');
    if (range) range.value = pct;
    if (label) label.textContent = `${pct}%`;
  }
}
