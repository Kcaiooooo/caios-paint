import { BaseTool } from './baseTool.js';

export class TextTool extends BaseTool {
  constructor(canvasManager, paletteManager, historyManager) {
    super(canvasManager, paletteManager, historyManager);
    this.activeEditor = null;
    this.fontFamily = 'Segoe UI, sans-serif';
    this.fontSize = 24;
    this.isBold = false;
    this.isItalic = false;
    this.isUnderline = false;
    this.isTransparentBg = true;
    this.textPos = null;
  }

  setFontFamily(family) {
    this.fontFamily = family;
    if (this.activeEditor) this.updateEditorStyle();
  }

  setFontSize(size) {
    this.fontSize = size;
    if (this.activeEditor) this.updateEditorStyle();
  }

  setBold(bool) {
    this.isBold = bool;
    if (this.activeEditor) this.updateEditorStyle();
  }

  setItalic(bool) {
    this.isItalic = bool;
    if (this.activeEditor) this.updateEditorStyle();
  }

  setUnderline(bool) {
    this.isUnderline = bool;
    if (this.activeEditor) this.updateEditorStyle();
  }

  setTransparentBg(bool) {
    this.isTransparentBg = bool;
    if (this.activeEditor) this.updateEditorStyle();
  }

  deactivate() {
    this.commitText();
    super.deactivate();
  }

  onMouseDown(e, pos) {
    if (this.activeEditor) {
      this.commitText();
      return;
    }

    this.textPos = pos;
    this.spawnEditor(pos);
  }

  spawnEditor(pos) {
    const editor = document.createElement('textarea');
    editor.className = 'text-floating-editor';

    const zoom = this.canvasManager.zoom;
    const rect = this.canvasManager.overlayCanvas.getBoundingClientRect();
    
    // Position text box directly over canvas location
    editor.style.left = `${pos.x * zoom}px`;
    editor.style.top = `${pos.y * zoom}px`;

    this.activeEditor = editor;
    this.updateEditorStyle();

    this.canvasManager.container.appendChild(editor);
    setTimeout(() => editor.focus(), 10);

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.commitText();
      }
    });
  }

  updateEditorStyle() {
    if (!this.activeEditor) return;
    const editor = this.activeEditor;
    const zoom = this.canvasManager.zoom;

    editor.style.fontSize = `${this.fontSize * zoom}px`;
    editor.style.fontFamily = this.fontFamily;
    editor.style.fontWeight = this.isBold ? 'bold' : 'normal';
    editor.style.fontStyle = this.isItalic ? 'italic' : 'normal';
    editor.style.textDecoration = this.isUnderline ? 'underline' : 'none';
    editor.style.color = this.paletteManager.color1;
    editor.style.backgroundColor = this.isTransparentBg ? 'transparent' : this.paletteManager.color2;
  }

  commitText() {
    if (!this.activeEditor) return;

    const text = this.activeEditor.value;
    if (text.trim().length > 0) {
      const ctx = this.canvasManager.ctx;
      ctx.save();

      let fontStyle = '';
      if (this.isItalic) fontStyle += 'italic ';
      if (this.isBold) fontStyle += 'bold ';

      ctx.font = `${fontStyle}${this.fontSize}px ${this.fontFamily}`;
      ctx.fillStyle = this.paletteManager.color1;
      ctx.textBaseline = 'top';

      const lines = text.split('\n');
      const lineHeight = this.fontSize * 1.2;

      // Draw background if not transparent
      if (!this.isTransparentBg) {
        let maxWidth = 0;
        lines.forEach(l => {
          const w = ctx.measureText(l).width;
          if (w > maxWidth) maxWidth = w;
        });
        ctx.fillStyle = this.paletteManager.color2;
        ctx.fillRect(this.textPos.x, this.textPos.y, maxWidth + 8, lines.length * lineHeight + 8);
        ctx.fillStyle = this.paletteManager.color1;
      }

      lines.forEach((line, index) => {
        ctx.fillText(line, this.textPos.x, this.textPos.y + index * lineHeight);
      });

      ctx.restore();
      this.historyManager.saveState();
    }

    if (this.activeEditor.parentNode) {
      this.activeEditor.parentNode.removeChild(this.activeEditor);
    }
    this.activeEditor = null;
  }
}
