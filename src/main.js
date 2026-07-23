import './style.css';
import { createIcons, icons } from 'lucide';
import { CanvasManager } from './canvas.js';
import { HistoryManager } from './history.js';
import { PaletteManager } from './palette.js';
import { DialogManager } from './dialogs.js';

import { PencilTool } from './tools/pencil.js';
import { BrushTool } from './tools/brush.js';
import { EraserTool } from './tools/eraser.js';
import { FloodFillTool } from './tools/fill.js';
import { EyedropperTool } from './tools/eyedropper.js';
import { ShapesTool } from './tools/shapes.js';
import { SelectionTool } from './tools/selection.js';
import { TextTool } from './tools/text.js';
import { ZoomTool } from './tools/zoom.js';

class PaintApp {
  constructor() {
    // Initialize Lucide icons
    createIcons({ icons });

    // Core Managers
    this.mainCanvas = document.getElementById('mainCanvas');
    this.overlayCanvas = document.getElementById('overlayCanvas');
    this.container = document.getElementById('canvasContainer');
    this.viewport = document.getElementById('viewport');

    this.canvasMgr = new CanvasManager(this.mainCanvas, this.overlayCanvas, this.container, this.viewport);
    this.historyMgr = new HistoryManager(this.canvasMgr);
    this.paletteMgr = new PaletteManager();
    this.dialogMgr = new DialogManager(this.canvasMgr, this.paletteMgr, this.historyMgr);

    // Tools Registry
    this.tools = {
      pencil: new PencilTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
      brush: new BrushTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
      eraser: new EraserTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
      fill: new FloodFillTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
      eyedropper: new EyedropperTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
      shapes: new ShapesTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
      selection: new SelectionTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
      text: new TextTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
      zoom: new ZoomTool(this.canvasMgr, this.paletteMgr, this.historyMgr),
    };

    this.currentTool = this.tools.pencil;
    this.currentToolName = 'pencil';
    this.currentSize = 3;

    this.initTheme();
    this.initUI();
    this.initCanvasEvents();
    this.initKeyboardShortcuts();
    this.updateStatusSize();
  }

  /* Theme System (System Auto / Light / Dark) */
  initTheme() {
    this.themeMode = localStorage.getItem('paint_theme_mode') || 'system';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Listen for OS System dark/light theme changes
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', () => {
        if (this.themeMode === 'system') {
          this.applyTheme();
        }
      });
    }

    // Top-Right Header Theme Dropdown Menu
    this.setupDropdown('btnThemeMenu', 'menuTheme');

    document.getElementById('themeOptSystem')?.addEventListener('click', () => this.setThemeMode('system'));
    document.getElementById('themeOptLight')?.addEventListener('click', () => this.setThemeMode('light'));
    document.getElementById('themeOptDark')?.addEventListener('click', () => this.setThemeMode('dark'));

    // View Tab Ribbon Radio Options
    document.querySelectorAll('input[name="ribbonTheme"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.setThemeMode(e.target.value);
      });
    });

    this.applyTheme();
  }

  setThemeMode(mode) {
    this.themeMode = mode;
    localStorage.setItem('paint_theme_mode', mode);
    this.applyTheme();
  }

  applyTheme() {
    let effectiveTheme = 'light';
    if (this.themeMode === 'system') {
      effectiveTheme = this.mediaQuery.matches ? 'dark' : 'light';
    } else {
      effectiveTheme = this.themeMode;
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Update Dropdown Checkmark Icons
    const checkSys = document.getElementById('checkThemeSystem');
    const checkLight = document.getElementById('checkThemeLight');
    const checkDark = document.getElementById('checkThemeDark');

    if (checkSys) checkSys.classList.toggle('hidden', this.themeMode !== 'system');
    if (checkLight) checkLight.classList.toggle('hidden', this.themeMode !== 'light');
    if (checkDark) checkDark.classList.toggle('hidden', this.themeMode !== 'dark');

    // Update View Tab Radio Buttons
    const radioSys = document.getElementById('radioThemeSystem');
    const radioLight = document.getElementById('radioThemeLight');
    const radioDark = document.getElementById('radioThemeDark');

    if (radioSys) radioSys.checked = (this.themeMode === 'system');
    if (radioLight) radioLight.checked = (this.themeMode === 'light');
    if (radioDark) radioDark.checked = (this.themeMode === 'dark');

    // Update Top-Right Header Icon & Tooltip
    const icon = document.getElementById('themeIcon');
    const btn = document.getElementById('btnThemeMenu');
    if (icon) {
      if (this.themeMode === 'system') {
        icon.setAttribute('data-lucide', 'laptop');
        if (btn) btn.title = `Tema: Seguir Sistema (Atualmente ${effectiveTheme === 'dark' ? 'Escuro' : 'Claro'})`;
      } else if (this.themeMode === 'dark') {
        icon.setAttribute('data-lucide', 'moon');
        if (btn) btn.title = 'Tema: Escuro';
      } else {
        icon.setAttribute('data-lucide', 'sun');
        if (btn) btn.title = 'Tema: Claro';
      }
      createIcons({ icons });
    }
  }

  /* UI Setup & Event Listeners */
  initUI() {
    // 1. Ribbon Tabs Toggle
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabName = tab.getAttribute('data-tab');
        document.getElementById('toolbarHome').classList.toggle('hidden', tabName !== 'home');
        document.getElementById('toolbarView').classList.toggle('hidden', tabName !== 'view');
      });
    });

    // 2. Dropdown Menus Setup
    this.setupDropdown('fileMenuBtn', 'fileDropdown');
    this.setupDropdown('btnSelectMenu', 'selectDropdown');
    this.setupDropdown('btnRotateMenu', 'rotateDropdown');
    this.setupDropdown('btnBrushMenu', 'brushDropdown');
    this.setupDropdown('btnOutlineStyle', 'outlineDropdown');
    this.setupDropdown('btnFillStyle', 'fillStyleDropdown');
    this.setupDropdown('btnSizeMenu', 'sizeDropdown');

    // 3. File Menu Actions
    document.getElementById('menuNew').addEventListener('click', () => this.newCanvas());
    document.getElementById('menuOpen').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', (e) => this.openFile(e));
    document.getElementById('menuSave').addEventListener('click', () => this.saveImage('png'));
    document.getElementById('menuSaveAs').addEventListener('click', () => this.saveImage('png'));
    document.getElementById('btnQuickSave').addEventListener('click', () => this.saveImage('png'));
    document.getElementById('menuResize').addEventListener('click', () => this.dialogMgr.openModal('modalResize'));
    document.getElementById('btnResizeModal').addEventListener('click', () => this.dialogMgr.openModal('modalResize'));

    // 4. Undo / Redo Buttons
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    btnUndo.addEventListener('click', () => this.historyMgr.undo());
    btnRedo.addEventListener('click', () => this.historyMgr.redo());

    this.historyMgr.onChange(({ canUndo, canRedo }) => {
      btnUndo.disabled = !canUndo;
      btnRedo.disabled = !canRedo;
    });

    // 5. Tools Buttons Binding
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const toolName = btn.getAttribute('data-tool');
        this.selectTool(toolName);
      });
    });

    // 6. Brushes Selection
    document.querySelectorAll('#brushDropdown .dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('#brushDropdown .dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const brushType = item.getAttribute('data-brush');
        this.tools.brush.setBrushType(brushType);
        document.getElementById('currentBrushLabel').textContent = item.textContent.trim();
        this.selectTool('brush');
      });
    });

    // 7. Shapes Selection
    document.querySelectorAll('.shape-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shape-item').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');

        const shapeType = btn.getAttribute('data-shape');
        this.tools.shapes.setShapeType(shapeType);
        this.selectTool('shapes');
      });
    });

    // Outline & Fill Styles
    document.querySelectorAll('#outlineDropdown .dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('#outlineDropdown .dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.tools.shapes.setOutlineStyle(item.getAttribute('data-outline'));
      });
    });

    document.querySelectorAll('#fillStyleDropdown .dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('#fillStyleDropdown .dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.tools.shapes.setFillStyle(item.getAttribute('data-fill'));
      });
    });

    // 8. Size / Stroke Slider, Input & Presets
    const strokeRange = document.getElementById('strokeSizeRange');
    const strokeNum = document.getElementById('strokeSizeNum');

    if (strokeRange) {
      strokeRange.addEventListener('input', (e) => {
        const sliderVal = parseInt(e.target.value);
        if (!isNaN(sliderVal)) {
          const pixelSize = this.sliderToSize(sliderVal);
          this.setStrokeSize(pixelSize, true);
        }
      });
      strokeRange.addEventListener('change', (e) => {
        const sliderVal = parseInt(e.target.value);
        if (!isNaN(sliderVal)) {
          const pixelSize = this.sliderToSize(sliderVal);
          this.setStrokeSize(pixelSize, true);
        }
      });
    }

    if (strokeNum) {
      strokeNum.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) this.setStrokeSize(val, false);
      });
      strokeNum.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) this.setStrokeSize(val, false);
      });
    }

    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const size = parseInt(chip.getAttribute('data-size'));
        this.setStrokeSize(size);
      });
    });

    // 9. Edit Colors Modal Button
    document.getElementById('btnEditColors').addEventListener('click', () => {
      this.dialogMgr.openModal('modalColorPicker');
    });

    // 10. Selection Options
    document.getElementById('selRect').addEventListener('click', () => {
      this.tools.selection.setMode('rect');
      this.selectTool('selection');
    });
    document.getElementById('selFree').addEventListener('click', () => {
      this.tools.selection.setMode('free');
      this.selectTool('selection');
    });
    document.getElementById('selAll').addEventListener('click', () => {
      this.selectTool('selection');
      this.tools.selection.selectAll();
    });
    document.getElementById('selTransparent').addEventListener('click', () => {
      const tool = this.tools.selection;
      tool.setTransparent(!tool.isTransparent);
      const label = document.getElementById('transparencyCheckLabel');
      label.textContent = tool.isTransparent ? '☑ Seleção Transparente' : '☐ Seleção Transparente';
    });

    // Clipboard Actions
    document.getElementById('btnPaste').addEventListener('click', () => this.pasteFromClipboard());
    document.getElementById('btnCut').addEventListener('click', () => this.tools.selection.cut());
    document.getElementById('btnCopy').addEventListener('click', () => this.tools.selection.copy());
    document.getElementById('btnCrop').addEventListener('click', () => this.tools.selection.crop());

    // Rotate Actions
    document.getElementById('rot90cw').addEventListener('click', () => this.rotateCanvas(90));
    document.getElementById('rot90ccw').addEventListener('click', () => this.rotateCanvas(-90));
    document.getElementById('rot180').addEventListener('click', () => this.rotateCanvas(180));
    document.getElementById('flipVert').addEventListener('click', () => this.flipCanvas('vertical'));
    document.getElementById('flipHoriz').addEventListener('click', () => this.flipCanvas('horizontal'));

    // Status Bar & Zoom Controls
    const zoomRange = document.getElementById('zoomRange');
    const zoomLabel = document.getElementById('zoomLabel');

    zoomRange.addEventListener('input', (e) => {
      const zoomVal = parseInt(e.target.value) / 100;
      this.canvasMgr.setZoom(zoomVal);
      zoomLabel.textContent = `${e.target.value}%`;
    });

    document.getElementById('btnZoomPlus').addEventListener('click', () => {
      const current = parseInt(zoomRange.value);
      const next = Math.min(800, current + 25);
      zoomRange.value = next;
      this.canvasMgr.setZoom(next / 100);
      zoomLabel.textContent = `${next}%`;
    });

    document.getElementById('btnZoomMinus').addEventListener('click', () => {
      const current = parseInt(zoomRange.value);
      const next = Math.max(10, current - 25);
      zoomRange.value = next;
      this.canvasMgr.setZoom(next / 100);
      zoomLabel.textContent = `${next}%`;
    });

    document.getElementById('btnFitScreen').addEventListener('click', () => {
      this.canvasMgr.setZoom(1.0);
      zoomRange.value = 100;
      zoomLabel.textContent = '100%';
    });

    document.getElementById('btnZoomIn').addEventListener('click', () => document.getElementById('btnZoomPlus').click());
    document.getElementById('btnZoomOut').addEventListener('click', () => document.getElementById('btnZoomMinus').click());
    document.getElementById('btnZoom100').addEventListener('click', () => document.getElementById('btnFitScreen').click());

    this.canvasMgr.onResize(() => this.updateStatusSize());
  }

  setupDropdown(triggerId, menuId) {
    const trigger = document.getElementById(triggerId);
    const menu = document.getElementById(menuId);
    if (!trigger || !menu) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m !== menu) m.classList.remove('show');
      });
      menu.classList.toggle('show');
    });

    window.addEventListener('click', () => menu.classList.remove('show'));
  }

  selectTool(toolName) {
    if (this.currentTool) {
      this.currentTool.deactivate();
    }

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tool') === toolName);
    });

    this.currentToolName = toolName;
    this.currentTool = this.tools[toolName];
    if (this.currentTool) {
      this.currentTool.setStrokeWidth(this.currentSize);
      this.updateCursorRing();
    }
  }

  sliderToSize(val) {
    const t = Math.max(0, Math.min(100, val)) / 100;
    return Math.max(1, Math.min(500, Math.round(1 + 499 * Math.pow(t, 2.5))));
  }

  sizeToSlider(size) {
    const clamped = Math.max(1, Math.min(500, size));
    const t = Math.pow((clamped - 1) / 499, 1 / 2.5);
    return Math.round(t * 100);
  }

  setStrokeSize(size, skipRangeSync = false) {
    size = Math.max(1, Math.min(500, parseInt(size) || 1));
    this.currentSize = size;

    const strokeRange = document.getElementById('strokeSizeRange');
    const strokeNum = document.getElementById('strokeSizeNum');
    const strokeVal = document.getElementById('strokeSizeVal');
    const strokeDot = document.getElementById('strokeDot');

    if (strokeRange && !skipRangeSync) {
      strokeRange.value = this.sizeToSlider(size);
    }
    if (strokeNum) strokeNum.value = size;
    if (strokeVal) strokeVal.textContent = `${size}px`;

    if (strokeDot) {
      const dotSize = Math.max(2, Math.min(32, size));
      strokeDot.style.width = `${dotSize}px`;
      strokeDot.style.height = `${dotSize}px`;
      strokeDot.style.backgroundColor = this.paletteMgr ? this.paletteMgr.color1 : '#000000';
    }

    document.querySelectorAll('.preset-chip').forEach(chip => {
      const chipSize = parseInt(chip.getAttribute('data-size'));
      chip.classList.toggle('active', chipSize === size);
    });

    Object.values(this.tools).forEach(tool => tool.setStrokeWidth(size));

    // RE-RENDER CURSOR RING IMMEDIATELY IN REAL TIME!
    this.updateCursorRing();
  }

  updateCursorRing() {
    if (!this.currentTool || !this.lastPointerPos || !this.isMouseOverCanvas) return;
    if (typeof this.currentTool.renderCursor === 'function') {
      this.currentTool.renderCursor(this.lastPointerPos);
    } else if (typeof this.currentTool.onMouseMove === 'function') {
      this.currentTool.onMouseMove({ synthetic: true }, this.lastPointerPos);
    }
  }

  /* Canvas Interaction Dispatcher */
  initCanvasEvents() {
    const overlay = this.overlayCanvas;

    overlay.addEventListener('contextmenu', (e) => e.preventDefault());

    overlay.addEventListener('mouseenter', (e) => {
      this.isMouseOverCanvas = true;
      this.lastPointerPos = this.canvasMgr.getPointerPos(e);
      this.updateCursorRing();
    });

    overlay.addEventListener('mouseleave', () => {
      this.isMouseOverCanvas = false;
      this.lastPointerPos = null;
      this.canvasMgr.clearOverlay();
    });

    overlay.addEventListener('mousedown', (e) => {
      const pos = this.canvasMgr.getPointerPos(e);
      this.lastPointerPos = pos;
      this.isMouseOverCanvas = true;
      if (this.currentTool) {
        this.currentTool.onMouseDown(e, pos);
      }
    });

    overlay.addEventListener('mousemove', (e) => {
      const pos = this.canvasMgr.getPointerPos(e);
      this.lastPointerPos = pos;
      this.isMouseOverCanvas = true;
      document.getElementById('statusPos').querySelector('span').textContent = `${pos.x}, ${pos.y}px`;

      if (this.currentTool) {
        this.currentTool.onMouseMove(e, pos);
      }
    });

    overlay.addEventListener('mouseup', (e) => {
      const pos = this.canvasMgr.getPointerPos(e);
      this.lastPointerPos = pos;
      if (this.currentTool) {
        this.currentTool.onMouseUp(e, pos);
      }
    });

    overlay.addEventListener('dblclick', (e) => {
      const pos = this.canvasMgr.getPointerPos(e);
      this.lastPointerPos = pos;
      if (this.currentTool && this.currentTool.onDblClick) {
        this.currentTool.onDblClick(e, pos);
      }
    });

    // Zoom on Ctrl + Mouse Wheel & Brush Size change on Alt + Mouse Wheel
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        const newZoom = Math.max(0.1, Math.min(8.0, this.canvasMgr.zoom + delta));
        this.canvasMgr.setZoom(newZoom);
        const pct = Math.round(newZoom * 100);
        document.getElementById('zoomRange').value = pct;
        document.getElementById('zoomLabel').textContent = `${pct}%`;
      } else if (e.altKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        this.setStrokeSize(this.currentSize + delta);
      }
    }, { passive: false });
  }

  /* Keyboard Shortcuts */
  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // New Canvas Hotkeys: Alt+N or Ctrl+Alt+N or Ctrl+Shift+N (browsers lock Ctrl+N for new window)
      if (e.key.toLowerCase() === 'n' && (e.altKey || (e.ctrlKey && e.shiftKey))) {
        e.preventDefault();
        this.newCanvas();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        // Ctrl + and Ctrl - for brush/eraser size adjustments
        if (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd') {
          e.preventDefault();
          this.setStrokeSize(this.currentSize + 2);
          return;
        }
        if (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          this.setStrokeSize(this.currentSize - 2);
          return;
        }

        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) this.historyMgr.redo();
            else this.historyMgr.undo();
            break;
          case 'y':
            e.preventDefault();
            this.historyMgr.redo();
            break;
          case 's':
            e.preventDefault();
            this.saveImage('png');
            break;
          case 'o':
            e.preventDefault();
            document.getElementById('fileInput').click();
            break;
          case 'n':
            e.preventDefault();
            this.newCanvas();
            break;
          case 'a':
            e.preventDefault();
            this.selectTool('selection');
            this.tools.selection.selectAll();
            break;
          case 'c':
            e.preventDefault();
            this.tools.selection.copy();
            break;
          case 'x':
            e.preventDefault();
            this.tools.selection.cut();
            break;
          case 'v':
            e.preventDefault();
            this.pasteFromClipboard();
            break;
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'p': this.selectTool('pencil'); break;
          case 'b': this.selectTool('fill'); break;
          case 'e': this.selectTool('eraser'); break;
          case 'i': this.selectTool('eyedropper'); break;
          case 't': this.selectTool('text'); break;
          case 'z': this.selectTool('zoom'); break;
          case 's': this.selectTool('selection'); break;
          case 'x': this.paletteMgr.swapColors(); break;
          case '[': this.setStrokeSize(this.currentSize - 2); break;
          case ']': this.setStrokeSize(this.currentSize + 2); break;
          case 'delete':
            this.tools.selection.deleteSelection();
            break;
        }
      }
    });
  }

  /* File & Image Operations */
  newCanvas() {
    if (this.currentTool) {
      this.currentTool.deactivate();
    }
    this.canvasMgr.clearOverlay();
    this.canvasMgr.resizeCanvas(1280, 720, false);
    document.getElementById('documentTitle').textContent = "Sem título - Caio's Paint";
    this.historyMgr.saveState();
  }

  openFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        this.canvasMgr.resizeCanvas(img.width, img.height, false);
        this.canvasMgr.ctx.drawImage(img, 0, 0);
        this.historyMgr.saveState();
        document.getElementById('documentTitle').textContent = `${file.name} - Caio's Paint`;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  saveImage(format = 'png') {
    const link = document.createElement('a');
    link.download = `imagem_paint.${format}`;
    link.href = this.mainCanvas.toDataURL(`image/${format}`);
    link.click();
  }

  pasteFromClipboard() {
    if (navigator.clipboard && navigator.clipboard.read) {
      navigator.clipboard.read().then(items => {
        for (const item of items) {
          if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
            item.getType(item.types.find(t => t.startsWith('image/'))).then(blob => {
              const img = new Image();
              img.onload = () => {
                this.selectTool('selection');
                this.tools.selection.pasteImage(img);
              };
              img.src = URL.createObjectURL(blob);
            });
          }
        }
      }).catch(err => console.error(err));
    }
  }

  rotateCanvas(angle) {
    const w = this.canvasMgr.width;
    const h = this.canvasMgr.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.mainCanvas, 0, 0);

    let newW = w, newH = h;
    if (Math.abs(angle) === 90) {
      newW = h;
      newH = w;
    }

    this.canvasMgr.resizeCanvas(newW, newH, false);
    const ctx = this.canvasMgr.ctx;

    ctx.save();
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(tempCanvas, -w / 2, -h / 2);
    ctx.restore();

    this.historyMgr.saveState();
  }

  flipCanvas(dir) {
    const w = this.canvasMgr.width;
    const h = this.canvasMgr.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.mainCanvas, 0, 0);

    const ctx = this.canvasMgr.ctx;
    ctx.save();
    if (dir === 'horizontal') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, h);
      ctx.scale(1, -1);
    }
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    this.historyMgr.saveState();
  }

  updateStatusSize() {
    const sizeEl = document.getElementById('statusSize');
    if (sizeEl) {
      sizeEl.querySelector('span').textContent = `${this.canvasMgr.width} x ${this.canvasMgr.height}px`;
    }
  }
}

// Launch application on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.paintApp = new PaintApp();
});
