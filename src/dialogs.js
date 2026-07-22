// Dialog Modals Manager
export class DialogManager {
  constructor(canvasManager, paletteManager, historyManager) {
    this.canvasManager = canvasManager;
    this.paletteManager = paletteManager;
    this.historyManager = historyManager;

    this.initResizeModal();
    this.initColorPickerModal();
    this.initModalCloseButtons();
  }

  initModalCloseButtons() {
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        this.closeModal(modalId);
      });
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  }

  /* 1. Resize & Skew Modal */
  initResizeModal() {
    const modal = document.getElementById('modalResize');
    const inputH = document.getElementById('resizeH');
    const inputV = document.getElementById('resizeV');
    const chkAspect = document.getElementById('chkAspect');
    const btnApply = document.getElementById('btnApplyResize');

    let isPercent = true;

    document.querySelectorAll('input[name="resizeUnit"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        isPercent = e.target.value === 'percent';
        if (isPercent) {
          inputH.value = 100;
          inputV.value = 100;
        } else {
          inputH.value = this.canvasManager.width;
          inputV.value = this.canvasManager.height;
        }
      });
    });

    inputH.addEventListener('input', () => {
      if (chkAspect.checked) {
        if (isPercent) {
          inputV.value = inputH.value;
        } else {
          const ratio = this.canvasManager.height / this.canvasManager.width;
          inputV.value = Math.round(inputH.value * ratio);
        }
      }
    });

    btnApply.addEventListener('click', () => {
      let newW = parseInt(inputH.value) || 100;
      let newH = parseInt(inputV.value) || 100;

      if (isPercent) {
        newW = Math.round(this.canvasManager.width * (newW / 100));
        newH = Math.round(this.canvasManager.height * (newH / 100));
      }

      newW = Math.max(1, newW);
      newH = Math.max(1, newH);

      this.canvasManager.resizeCanvas(newW, newH, true);
      this.historyManager.saveState();
      this.closeModal('modalResize');
    });
  }

  /* 2. Custom Color Picker Modal */
  initColorPickerModal() {
    const spectrumCanvas = document.getElementById('colorSpectrum');
    const hueSlider = document.getElementById('hueSlider');
    const colorPreviewBox = document.getElementById('colorPreviewBox');
    const colorPreviewHex = document.getElementById('colorPreviewHex');

    const inputR = document.getElementById('inputR');
    const inputG = document.getElementById('inputG');
    const inputB = document.getElementById('inputB');
    const inputHex = document.getElementById('inputHex');
    const btnAdd = document.getElementById('btnAddCustomColor');

    if (!spectrumCanvas) return;

    const sCtx = spectrumCanvas.getContext('2d');
    let currentHue = 0;
    let selectedHex = '#000000';

    const drawSpectrum = () => {
      sCtx.clearRect(0, 0, 220, 200);

      // Draw Saturation (horizontal) and Value (vertical) gradient
      for (let x = 0; x < 220; x++) {
        const sat = x / 220;
        const grad = sCtx.createLinearGradient(0, 0, 0, 200);
        const rgbStr = this.hsvToRgbStr(currentHue, sat, 1.0);
        grad.addColorStop(0, rgbStr);
        grad.addColorStop(1, '#000000');

        sCtx.fillStyle = grad;
        sCtx.fillRect(x, 0, 1, 200);
      }
    };

    drawSpectrum();

    hueSlider.addEventListener('input', (e) => {
      currentHue = parseInt(e.target.value);
      drawSpectrum();
    });

    const updatePreview = (hex) => {
      selectedHex = hex;
      colorPreviewBox.style.backgroundColor = hex;
      colorPreviewHex.textContent = hex.toUpperCase();
      inputHex.value = hex.toUpperCase();

      const [r, g, b] = this.hexToRgb(hex);
      inputR.value = r;
      inputG.value = g;
      inputB.value = b;
    };

    spectrumCanvas.addEventListener('click', (e) => {
      const rect = spectrumCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(219, Math.floor(e.clientX - rect.left)));
      const y = Math.max(0, Math.min(199, Math.floor(e.clientY - rect.top)));

      const sat = x / 220;
      const val = 1.0 - y / 200;
      const hex = this.hsvToHex(currentHue, sat, val);
      updatePreview(hex);
    });

    [inputR, inputG, inputB].forEach(input => {
      input.addEventListener('input', () => {
        const r = Math.min(255, Math.max(0, parseInt(inputR.value) || 0));
        const g = Math.min(255, Math.max(0, parseInt(inputG.value) || 0));
        const b = Math.min(255, Math.max(0, parseInt(inputB.value) || 0));
        const hex = this.rgbToHex(r, g, b);
        updatePreview(hex);
      });
    });

    inputHex.addEventListener('input', () => {
      if (/^#[0-9A-F]{6}$/i.test(inputHex.value)) {
        updatePreview(inputHex.value);
      }
    });

    btnAdd.addEventListener('click', () => {
      this.paletteManager.addCustomColor(selectedHex);
      this.closeModal('modalColorPicker');
    });
  }

  hsvToRgbStr(h, s, v) {
    const [r, g, b] = this.hsvToRgb(h, s, v);
    return `rgb(${r}, ${g}, ${b})`;
  }

  hsvToHex(h, s, v) {
    const [r, g, b] = this.hsvToRgb(h, s, v);
    return this.rgbToHex(r, g, b);
  }

  hsvToRgb(h, s, v) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor((h / 60) % 6);
    const f = (h / 60) - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}
