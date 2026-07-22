import { BaseTool } from './baseTool.js';

export class BrushTool extends BaseTool {
  constructor(canvasManager, paletteManager, historyManager) {
    super(canvasManager, paletteManager, historyManager);
    this.brushType = 'round'; // round, calligraphy1, calligraphy2, airbrush, oil, crayon, marker, pencil_nat, watercolor
    this.lastPos = null;
  }

  setBrushType(type) {
    this.brushType = type;
  }

  onMouseDown(e, pos) {
    this.isDrawing = true;
    this.isRightClick = e.button === 2;
    this.lastPos = pos;
    this.drawStroke(pos, pos);
  }

  onMouseMove(e, pos) {
    this.renderCursor(pos);
    if (!this.isDrawing) return;
    this.drawStroke(this.lastPos, pos);
    this.lastPos = pos;
  }

  renderCursor(pos) {
    const oCtx = this.canvasManager.oCtx;
    this.canvasManager.clearOverlay();

    const size = Math.max(2, this.strokeWidth);
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

  drawStroke(from, to) {
    const ctx = this.canvasManager.ctx;
    const color = this.getColor(this.isRightClick);
    const size = Math.max(1, this.strokeWidth);

    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    switch (this.brushType) {
      case 'round': {
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        break;
      }

      case 'calligraphy1': {
        ctx.lineWidth = size;
        ctx.lineCap = 'square';
        ctx.beginPath();
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const steps = Math.max(1, Math.floor(dist));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t;
          ctx.fillRect(x - size / 2, y - size / 4, size, size / 3);
        }
        break;
      }

      case 'calligraphy2': {
        ctx.lineWidth = size;
        ctx.lineCap = 'square';
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const steps = Math.max(1, Math.floor(dist));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t;
          ctx.fillRect(x - size / 4, y - size / 2, size / 3, size);
        }
        break;
      }

      case 'airbrush': {
        const radius = size * 2.5;
        const density = Math.floor(radius * 3);
        for (let i = 0; i < density; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius;
          const px = to.x + Math.cos(angle) * r;
          const py = to.y + Math.sin(angle) * r;
          ctx.fillRect(px, py, 1, 1);
        }
        break;
      }

      case 'oil': {
        ctx.save();
        ctx.lineWidth = size * 1.2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        // Add texture strokes
        ctx.lineWidth = size * 0.4;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(from.x + 2, from.y + 2);
        ctx.lineTo(to.x + 2, to.y + 2);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'crayon': {
        ctx.save();
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const steps = Math.max(1, Math.floor(dist));
        ctx.globalAlpha = 0.6;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t;
          for (let j = 0; j < 5; j++) {
            const rx = (Math.random() - 0.5) * size;
            const ry = (Math.random() - 0.5) * size;
            ctx.fillRect(x + rx, y + ry, 2, 2);
          }
        }
        ctx.restore();
        break;
      }

      case 'marker': {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = size * 1.5;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'pencil_nat': {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = Math.max(1, size * 0.6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'watercolor': {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = size * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
        break;
      }
    }
  }
}
