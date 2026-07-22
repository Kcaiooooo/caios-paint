import { BaseTool } from './baseTool.js';

export class SelectionTool extends BaseTool {
  constructor(canvasManager, paletteManager, historyManager) {
    super(canvasManager, paletteManager, historyManager);
    this.mode = 'rect'; // rect, free
    this.isTransparent = false;

    this.selectionActive = false;
    this.selRect = null; // { x, y, w, h }
    this.selectedImageData = null;
    this.originalCanvasBackup = null;

    this.isMoving = false;
    this.moveStartPos = null;
    this.selStartRect = null;

    this.freePoints = [];
    this.animationFrame = null;
    this.dashOffset = 0;
  }

  setMode(m) {
    this.mode = m;
  }

  setTransparent(bool) {
    this.isTransparent = bool;
    if (this.selectionActive) {
      this.renderOverlay();
    }
  }

  deactivate() {
    this.commitSelection();
    super.deactivate();
  }

  onMouseDown(e, pos) {
    if (this.selectionActive) {
      // Check if clicked inside active selection box
      if (
        this.selRect &&
        pos.x >= this.selRect.x &&
        pos.x <= this.selRect.x + this.selRect.w &&
        pos.y >= this.selRect.y &&
        pos.y <= this.selRect.y + this.selRect.h
      ) {
        this.isMoving = true;
        this.moveStartPos = pos;
        this.selStartRect = { ...this.selRect };
        return;
      } else {
        this.commitSelection();
      }
    }

    this.isDrawing = true;
    this.startPos = pos;
    this.selRect = { x: pos.x, y: pos.y, w: 0, h: 0 };
    if (this.mode === 'free') {
      this.freePoints = [pos];
    }
  }

  onMouseMove(e, pos) {
    if (this.isMoving) {
      const dx = pos.x - this.moveStartPos.x;
      const dy = pos.y - this.moveStartPos.y;
      this.selRect.x = this.selStartRect.x + dx;
      this.selRect.y = this.selStartRect.y + dy;
      this.renderOverlay();
      this.notifyStatus();
      return;
    }

    if (!this.isDrawing) return;

    if (this.mode === 'rect') {
      const x = Math.min(this.startPos.x, pos.x);
      const y = Math.min(this.startPos.y, pos.y);
      const w = Math.abs(pos.x - this.startPos.x);
      const h = Math.abs(pos.y - this.startPos.y);
      this.selRect = { x, y, w, h };
    } else {
      this.freePoints.push(pos);
      // Compute bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      this.freePoints.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
      this.selRect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    this.renderOverlay();
    this.notifyStatus();
  }

  onMouseUp(e, pos) {
    if (this.isMoving) {
      this.isMoving = false;
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.selRect && this.selRect.w > 2 && this.selRect.h > 2) {
      this.liftSelection();
    } else {
      this.resetSelection();
    }
  }

  liftSelection() {
    const ctx = this.canvasManager.ctx;
    const { x, y, w, h } = this.selRect;

    // Backup current full canvas state before lifting
    this.originalCanvasBackup = this.canvasManager.getImageData();

    // Extract selected image data
    this.selectedImageData = ctx.getImageData(x, y, w, h);

    // Clear original area with Color 2 (background color)
    ctx.fillStyle = this.paletteManager.color2;
    ctx.fillRect(x, y, w, h);

    this.selectionActive = true;
    this.startMarchingAnts();
  }

  commitSelection() {
    if (!this.selectionActive || !this.selectedImageData) return;
    this.stopMarchingAnts();

    const ctx = this.canvasManager.ctx;
    const { x, y, w, h } = this.selRect;

    // Create temporary canvas to process transparency if enabled
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(this.selectedImageData, 0, 0);

    if (this.isTransparent) {
      const imgData = tempCtx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const keyRgba = this.hexToRgba(this.paletteManager.color2);
      for (let i = 0; i < data.length; i += 4) {
        if (
          Math.abs(data[i] - keyRgba[0]) < 10 &&
          Math.abs(data[i + 1] - keyRgba[1]) < 10 &&
          Math.abs(data[i + 2] - keyRgba[2]) < 10
        ) {
          data[i + 3] = 0; // Make transparent
        }
      }
      tempCtx.putImageData(imgData, 0, 0);
    }

    ctx.drawImage(tempCanvas, x, y);

    this.canvasManager.clearOverlay();
    this.resetSelection();
    this.historyManager.saveState();
  }

  cancelSelection() {
    if (!this.selectionActive) return;
    this.stopMarchingAnts();
    if (this.originalCanvasBackup) {
      this.canvasManager.putImageData(this.originalCanvasBackup);
    }
    this.canvasManager.clearOverlay();
    this.resetSelection();
  }

  resetSelection() {
    this.selectionActive = false;
    this.selRect = null;
    this.selectedImageData = null;
    this.originalCanvasBackup = null;
    this.freePoints = [];
    this.canvasManager.clearOverlay();
    this.notifyStatus(true);
  }

  hexToRgba(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
  }

  startMarchingAnts() {
    this.stopMarchingAnts();
    const animate = () => {
      this.dashOffset = (this.dashOffset + 1) % 16;
      this.renderOverlay();
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  stopMarchingAnts() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  renderOverlay() {
    const oCtx = this.canvasManager.oCtx;
    this.canvasManager.clearOverlay();

    if (!this.selRect) return;
    const { x, y, w, h } = this.selRect;

    // Draw active floating image piece if lifted
    if (this.selectionActive && this.selectedImageData) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.selectedImageData.width;
      tempCanvas.height = this.selectedImageData.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(this.selectedImageData, 0, 0);

      if (this.isTransparent) {
        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;
        const keyRgba = this.hexToRgba(this.paletteManager.color2);
        for (let i = 0; i < data.length; i += 4) {
          if (
            Math.abs(data[i] - keyRgba[0]) < 10 &&
            Math.abs(data[i + 1] - keyRgba[1]) < 10 &&
            Math.abs(data[i + 2] - keyRgba[2]) < 10
          ) {
            data[i + 3] = 0;
          }
        }
        tempCtx.putImageData(imgData, 0, 0);
      }

      oCtx.drawImage(tempCanvas, x, y, w, h);
    }

    // Draw Marching Ants border
    oCtx.save();
    oCtx.lineWidth = 1;
    oCtx.lineDashOffset = this.dashOffset;

    oCtx.strokeStyle = '#000000';
    oCtx.setLineDash([4, 4]);
    oCtx.strokeRect(x, y, w, h);

    oCtx.strokeStyle = '#ffffff';
    oCtx.lineDashOffset = this.dashOffset + 4;
    oCtx.setLineDash([4, 4]);
    oCtx.strokeRect(x, y, w, h);
    oCtx.restore();
  }

  selectAll() {
    this.commitSelection();
    this.selRect = { x: 0, y: 0, w: this.canvasManager.width, h: this.canvasManager.height };
    this.liftSelection();
  }

  crop() {
    if (!this.selRect || this.selRect.w <= 0 || this.selRect.h <= 0) return;
    const { x, y, w, h } = this.selRect;
    const croppedData = this.canvasManager.ctx.getImageData(x, y, w, h);
    this.stopMarchingAnts();
    this.canvasManager.resizeCanvas(w, h, false);
    this.canvasManager.ctx.putImageData(croppedData, 0, 0);
    this.resetSelection();
    this.historyManager.saveState();
  }

  deleteSelection() {
    if (!this.selectionActive) return;
    this.stopMarchingAnts();
    this.canvasManager.clearOverlay();
    this.resetSelection();
    this.historyManager.saveState();
  }

  cut() {
    if (!this.selectionActive) return;
    this.copy();
    this.deleteSelection();
  }

  copy() {
    if (!this.selectionActive || !this.selectedImageData) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.selectedImageData.width;
    tempCanvas.height = this.selectedImageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(this.selectedImageData, 0, 0);

    tempCanvas.toBlob((blob) => {
      if (blob && navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).catch(err => console.error(err));
      }
    });
  }

  pasteImage(img) {
    this.commitSelection();

    // Auto expand canvas if pasted image exceeds current canvas dimensions
    const neededW = Math.max(this.canvasManager.width, img.width);
    const neededH = Math.max(this.canvasManager.height, img.height);

    if (neededW > this.canvasManager.width || neededH > this.canvasManager.height) {
      this.canvasManager.resizeCanvas(neededW,neededH, true);
    }

    this.selRect = { x: 0, y: 0, w: img.width, h: img.height };

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);

    this.selectedImageData = tempCtx.getImageData(0, 0, img.width, img.height);
    this.selectionActive = true;
    this.startMarchingAnts();
  }

  notifyStatus(clear = false) {
    const selEl = document.getElementById('statusSel');
    if (clear || !this.selRect) {
      selEl.style.display = 'none';
    } else {
      selEl.style.display = 'flex';
      selEl.querySelector('span').textContent = `${this.selRect.w} x ${this.selRect.h}px`;
    }
  }
}
