import { BaseTool } from './baseTool.js';

export class ShapesTool extends BaseTool {
  constructor(canvasManager, paletteManager, historyManager) {
    super(canvasManager, paletteManager, historyManager);
    this.shapeType = 'line';
    this.outlineStyle = 'solid'; // none, solid, crayon, marker, oil, natural, watercolor
    this.fillStyle = 'none'; // none, solid, crayon, marker, oil, natural, watercolor
    this.startPos = null;

    // Bezier curve state
    this.curveStep = 0; // 0: drag line, 1: control1, 2: control2
    this.curveStart = null;
    this.curveEnd = null;
    this.curveCtrl1 = null;

    // Polygon state
    this.polyPoints = [];
  }

  setShapeType(type) {
    this.shapeType = type;
    this.resetState();
  }

  setOutlineStyle(style) {
    this.outlineStyle = style;
  }

  setFillStyle(style) {
    this.fillStyle = style;
  }

  resetState() {
    this.curveStep = 0;
    this.polyPoints = [];
    this.canvasManager.clearOverlay();
  }

  onMouseDown(e, pos) {
    this.isRightClick = e.button === 2;

    if (this.shapeType === 'curve') {
      if (this.curveStep === 0) {
        this.isDrawing = true;
        this.startPos = pos;
        this.curveStart = pos;
      } else if (this.curveStep === 1) {
        this.curveCtrl1 = pos;
        this.renderShape(this.canvasManager.ctx, this.curveStart, this.curveEnd, pos, pos);
        this.curveStep = 2;
      } else if (this.curveStep === 2) {
        this.renderShape(this.canvasManager.ctx, this.curveStart, this.curveEnd, this.curveCtrl1, pos);
        this.resetState();
        this.historyManager.saveState();
      }
      return;
    }

    if (this.shapeType === 'polygon') {
      if (this.polyPoints.length === 0) {
        this.polyPoints.push(pos);
      }
      this.polyPoints.push(pos);
      return;
    }

    this.isDrawing = true;
    this.startPos = pos;
  }

  onMouseMove(e, pos) {
    if (this.shapeType === 'curve') {
      if (this.isDrawing && this.curveStep === 0) {
        this.canvasManager.clearOverlay();
        this.renderShape(this.canvasManager.oCtx, this.startPos, pos);
      } else if (this.curveStep === 1) {
        this.canvasManager.clearOverlay();
        this.renderShape(this.canvasManager.oCtx, this.curveStart, this.curveEnd, pos, pos);
      } else if (this.curveStep === 2) {
        this.canvasManager.clearOverlay();
        this.renderShape(this.canvasManager.oCtx, this.curveStart, this.curveEnd, this.curveCtrl1, pos);
      }
      return;
    }

    if (this.shapeType === 'polygon' && this.polyPoints.length > 0) {
      this.canvasManager.clearOverlay();
      const currentPoints = [...this.polyPoints.slice(0, -1), pos];
      this.renderPolygon(this.canvasManager.oCtx, currentPoints);
      return;
    }

    if (!this.isDrawing) {
      this.renderCursor(pos);
      return;
    }

    this.canvasManager.clearOverlay();
    this.renderShape(this.canvasManager.oCtx, this.startPos, pos);
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
    if (this.shapeType === 'curve' && this.curveStep === 0 && this.isDrawing) {
      this.isDrawing = false;
      this.curveEnd = pos;
      this.curveStep = 1;
      return;
    }

    if (this.shapeType === 'polygon') return;

    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.canvasManager.clearOverlay();
    this.renderShape(this.canvasManager.ctx, this.startPos, pos);
    this.historyManager.saveState();
  }

  onDblClick(e, pos) {
    if (this.shapeType === 'polygon' && this.polyPoints.length > 2) {
      this.canvasManager.clearOverlay();
      this.renderPolygon(this.canvasManager.ctx, this.polyPoints);
      this.resetState();
      this.historyManager.saveState();
    }
  }

  renderShape(ctx, start, end, ctrl1 = null, ctrl2 = null) {
    ctx.save();
    const primaryColor = this.getColor(this.isRightClick);
    const secondaryColor = this.getColor(!this.isRightClick);
    const size = Math.max(1, this.strokeWidth);

    ctx.strokeStyle = primaryColor;
    ctx.fillStyle = secondaryColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    const drawPath = () => {
      ctx.beginPath();
      switch (this.shapeType) {
        case 'line':
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          break;

        case 'curve':
          ctx.moveTo(start.x, start.y);
          if (ctrl1 && ctrl2) {
            ctx.bezierCurveTo(ctrl1.x, ctrl1.y, ctrl2.x, ctrl2.y, end.x, end.y);
          } else {
            ctx.lineTo(end.x, end.y);
          }
          break;

        case 'rect':
          ctx.rect(x, y, w, h);
          break;

        case 'round_rect': {
          const r = Math.min(w, h) * 0.2;
          ctx.roundRect(x, y, w, h, r);
          break;
        }

        case 'oval':
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          break;

        case 'triangle':
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x, y + h);
          ctx.closePath();
          break;

        case 'right_triangle':
          ctx.moveTo(x, y);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x, y + h);
          ctx.closePath();
          break;

        case 'diamond':
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x + w, y + h / 2);
          ctx.lineTo(x + w / 2, y + h);
          ctx.lineTo(x, y + h / 2);
          ctx.closePath();
          break;

        case 'pentagon': {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const rx = w / 2;
          const ry = h / 2;
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const px = cx + rx * Math.cos(angle);
            const py = cy + ry * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        }

        case 'star': {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const outerR = Math.min(w, h) / 2;
          const innerR = outerR * 0.4;
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        }

        case 'arrow_right': {
          const stemH = h * 0.4;
          const headW = w * 0.4;
          ctx.moveTo(x, y + (h - stemH) / 2);
          ctx.lineTo(x + w - headW, y + (h - stemH) / 2);
          ctx.lineTo(x + w - headW, y);
          ctx.lineTo(x + w, y + h / 2);
          ctx.lineTo(x + w - headW, y + h);
          ctx.lineTo(x + w - headW, y + (h + stemH) / 2);
          ctx.lineTo(x, y + (h + stemH) / 2);
          ctx.closePath();
          break;
        }

        case 'speech_rect': {
          const tailW = w * 0.2;
          const tailH = h * 0.2;
          ctx.moveTo(x, y);
          ctx.lineTo(x + w, y);
          ctx.lineTo(x + w, y + h - tailH);
          ctx.lineTo(x + tailW * 2, y + h - tailH);
          ctx.lineTo(x + tailW, y + h);
          ctx.lineTo(x + tailW * 1.5, y + h - tailH);
          ctx.lineTo(x, y + h - tailH);
          ctx.closePath();
          break;
        }

        case 'heart': {
          const topCurveHeight = h * 0.3;
          ctx.moveTo(x + w / 2, y + topCurveHeight);
          ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + topCurveHeight);
          ctx.bezierCurveTo(x, y + (h + topCurveHeight) / 2, x + w / 2, y + h, x + w / 2, y + h);
          ctx.bezierCurveTo(x + w / 2, y + h, x + w, y + (h + topCurveHeight) / 2, x + w, y + topCurveHeight);
          ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + topCurveHeight);
          ctx.closePath();
          break;
        }

        case 'lightning': {
          ctx.moveTo(x + w * 0.5, y);
          ctx.lineTo(x + w * 0.1, y + h * 0.55);
          ctx.lineTo(x + w * 0.45, y + h * 0.55);
          ctx.lineTo(x + w * 0.3, y + h);
          ctx.lineTo(x + w * 0.9, y + h * 0.4);
          ctx.lineTo(x + w * 0.55, y + h * 0.4);
          ctx.closePath();
          break;
        }
      }
    };

    drawPath();

    if (this.fillStyle !== 'none' && this.shapeType !== 'line' && this.shapeType !== 'curve') {
      ctx.fill();
    }

    if (this.outlineStyle !== 'none' || this.shapeType === 'line' || this.shapeType === 'curve') {
      ctx.stroke();
    }

    ctx.restore();
  }

  renderPolygon(ctx, points) {
    if (points.length < 2) return;
    ctx.save();
    const primaryColor = this.getColor(this.isRightClick);
    const secondaryColor = this.getColor(!this.isRightClick);
    ctx.strokeStyle = primaryColor;
    ctx.fillStyle = secondaryColor;
    ctx.lineWidth = Math.max(1, this.strokeWidth);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    if (this.fillStyle !== 'none') ctx.fill();
    if (this.outlineStyle !== 'none') ctx.stroke();
    ctx.restore();
  }
}
