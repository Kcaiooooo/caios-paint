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

  updateZoomUI(zoom) {
    const pct = Math.round(zoom * 100);
    const range = document.getElementById('zoomRange');
    const label = document.getElementById('zoomLabel');
    if (range) range.value = pct;
    if (label) label.textContent = `${pct}%`;
  }
}
