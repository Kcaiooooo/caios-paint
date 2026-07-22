// Base Tool Interface
export class BaseTool {
  constructor(canvasManager, paletteManager, historyManager) {
    this.canvasManager = canvasManager;
    this.paletteManager = paletteManager;
    this.historyManager = historyManager;
    this.isDrawing = false;
    this.strokeWidth = 3;
    this.isRightClick = false;
  }

  setStrokeWidth(w) {
    this.strokeWidth = w;
  }

  onMouseDown(e, pos) {}
  onMouseMove(e, pos) {}
  onMouseUp(e, pos) {}
  onKeyDown(e) {}
  deactivate() {
    this.canvasManager.clearOverlay();
  }

  getColor(isRightClick = false) {
    return isRightClick ? this.paletteManager.color2 : this.paletteManager.color1;
  }
}
