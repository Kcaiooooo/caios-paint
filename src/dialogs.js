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
    if (modal) {
      modal.classList.add('show');
      if (modalId === 'modalColorPicker' && this.syncColorPickerWithActiveColor) {
        this.syncColorPickerWithActiveColor();
      }
    }
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
    const hueCanvas = document.getElementById('hueCanvas');
    const hueDegreesVal = document.getElementById('hueDegreesVal');
    const colorPreviewBox = document.getElementById('colorPreviewBox');
    const colorPreviewHex = document.getElementById('colorPreviewHex');

    const inputR = document.getElementById('inputR');
    const inputG = document.getElementById('inputG');
    const inputB = document.getElementById('inputB');
    const inputHex = document.getElementById('inputHex');
    const btnAdd = document.getElementById('btnAddCustomColor');
    const btnNative = document.getElementById('btnNativeColorPicker');
    const nativeColorInput = document.getElementById('nativeColorInput');

    if (!spectrumCanvas || !hueCanvas) return;

    const sCtx = spectrumCanvas.getContext('2d');
    const hCtx = hueCanvas.getContext('2d');

    const sWidth = 240;
    const sHeight = 200;
    const hWidth = 240;
    const hHeight = 22;

    let currentHue = 0;   // 0 .. 360
    let currentSat = 1.0; // 0 .. 1
    let currentVal = 1.0; // 0 .. 1
    let selectedHex = '#000000';
    let isDraggingSpectrum = false;
    let isDraggingHue = false;

    // Render Rainbow Hue Bar Canvas
    const renderHueBar = () => {
      hCtx.clearRect(0, 0, hWidth, hHeight);

      // Rainbow gradient background
      const grad = hCtx.createLinearGradient(0, 0, hWidth, 0);
      grad.addColorStop(0.00, '#ff0000');
      grad.addColorStop(0.17, '#ffff00');
      grad.addColorStop(0.33, '#00ff00');
      grad.addColorStop(0.50, '#00ffff');
      grad.addColorStop(0.67, '#0000ff');
      grad.addColorStop(0.83, '#ff00ff');
      grad.addColorStop(1.00, '#ff0000');

      hCtx.fillStyle = grad;
      hCtx.fillRect(0, 0, hWidth, hHeight);

      // Draw Thumb Handle
      const hx = Math.max(6, Math.min(hWidth - 6, (currentHue / 360) * hWidth));

      hCtx.save();
      // Outer ring
      hCtx.fillStyle = '#ffffff';
      hCtx.strokeStyle = '#000000';
      hCtx.lineWidth = 2;
      hCtx.beginPath();
      hCtx.arc(hx, hHeight / 2, 7, 0, Math.PI * 2);
      hCtx.fill();
      hCtx.stroke();

      // Inner color dot
      const [hr, hg, hb] = this.hsvToRgb(currentHue, 1.0, 1.0);
      hCtx.fillStyle = `rgb(${hr}, ${hg}, ${hb})`;
      hCtx.beginPath();
      hCtx.arc(hx, hHeight / 2, 4, 0, Math.PI * 2);
      hCtx.fill();
      hCtx.restore();

      if (hueDegreesVal) hueDegreesVal.textContent = `${Math.round(currentHue)}°`;
    };

    // Render 2D Saturation / Value Spectrum Canvas
    const renderSpectrum = () => {
      sCtx.clearRect(0, 0, sWidth, sHeight);

      // 1. Fill base rectangle with pure Hue color
      const [hr, hg, hb] = this.hsvToRgb(currentHue, 1.0, 1.0);
      sCtx.fillStyle = `rgb(${hr}, ${hg}, ${hb})`;
      sCtx.fillRect(0, 0, sWidth, sHeight);

      // 2. Horizontal gradient overlay (white -> transparent)
      const gradWhite = sCtx.createLinearGradient(0, 0, sWidth, 0);
      gradWhite.addColorStop(0, '#ffffff');
      gradWhite.addColorStop(1, 'rgba(255, 255, 255, 0)');
      sCtx.fillStyle = gradWhite;
      sCtx.fillRect(0, 0, sWidth, sHeight);

      // 3. Vertical gradient overlay (transparent -> black)
      const gradBlack = sCtx.createLinearGradient(0, 0, 0, sHeight);
      gradBlack.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradBlack.addColorStop(1, '#000000');
      sCtx.fillStyle = gradBlack;
      sCtx.fillRect(0, 0, sWidth, sHeight);

      // 4. Reticle indicator at currentSat, currentVal
      const rx = currentSat * sWidth;
      const ry = (1.0 - currentVal) * sHeight;

      sCtx.save();
      // Outer ring
      sCtx.strokeStyle = '#ffffff';
      sCtx.lineWidth = 2.5;
      sCtx.beginPath();
      sCtx.arc(rx, ry, 6, 0, Math.PI * 2);
      sCtx.stroke();
      // Inner ring
      sCtx.strokeStyle = '#000000';
      sCtx.lineWidth = 1.5;
      sCtx.beginPath();
      sCtx.arc(rx, ry, 6, 0, Math.PI * 2);
      sCtx.stroke();
      sCtx.restore();
    };

    const updatePreviewAndInputs = (skipInputSync = false) => {
      selectedHex = this.hsvToHex(currentHue, currentSat, currentVal);
      colorPreviewBox.style.backgroundColor = selectedHex;
      colorPreviewHex.textContent = selectedHex.toUpperCase();

      if (!skipInputSync) {
        inputHex.value = selectedHex.toUpperCase();
        const [r, g, b] = this.hsvToRgb(currentHue, currentSat, currentVal);
        inputR.value = r;
        inputG.value = g;
        inputB.value = b;
      }
    };

    // 2D Spectrum Pointer Handlers
    const handleSpectrumPointer = (e) => {
      const rect = spectrumCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = Math.max(0, Math.min(sWidth, clientX - rect.left));
      const y = Math.max(0, Math.min(sHeight, clientY - rect.top));

      currentSat = x / sWidth;
      currentVal = 1.0 - y / sHeight;

      renderSpectrum();
      updatePreviewAndInputs();
    };

    spectrumCanvas.addEventListener('pointerdown', (e) => {
      isDraggingSpectrum = true;
      spectrumCanvas.setPointerCapture(e.pointerId);
      handleSpectrumPointer(e);
    });

    spectrumCanvas.addEventListener('pointermove', (e) => {
      if (isDraggingSpectrum) {
        handleSpectrumPointer(e);
      }
    });

    spectrumCanvas.addEventListener('pointerup', (e) => {
      if (isDraggingSpectrum) {
        isDraggingSpectrum = false;
        try { spectrumCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    });

    // Hue Canvas Pointer Handlers
    const handleHuePointer = (e) => {
      const rect = hueCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;

      const x = Math.max(0, Math.min(hWidth, clientX - rect.left));
      currentHue = (x / hWidth) * 360;
      if (currentHue >= 360) currentHue = 359.9;

      renderHueBar();
      renderSpectrum();
      updatePreviewAndInputs();
    };

    hueCanvas.addEventListener('pointerdown', (e) => {
      isDraggingHue = true;
      hueCanvas.setPointerCapture(e.pointerId);
      handleHuePointer(e);
    });

    hueCanvas.addEventListener('pointermove', (e) => {
      if (isDraggingHue) {
        handleHuePointer(e);
      }
    });

    hueCanvas.addEventListener('pointerup', (e) => {
      if (isDraggingHue) {
        isDraggingHue = false;
        try { hueCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    });

    // Input Events (RGB / HEX)
    [inputR, inputG, inputB].forEach(input => {
      input.addEventListener('input', () => {
        const r = Math.min(255, Math.max(0, parseInt(inputR.value) || 0));
        const g = Math.min(255, Math.max(0, parseInt(inputG.value) || 0));
        const b = Math.min(255, Math.max(0, parseInt(inputB.value) || 0));
        const [h, s, v] = this.rgbToHsv(r, g, b);
        currentHue = h;
        currentSat = s;
        currentVal = v;
        selectedHex = this.rgbToHex(r, g, b);
        colorPreviewBox.style.backgroundColor = selectedHex;
        colorPreviewHex.textContent = selectedHex.toUpperCase();
        inputHex.value = selectedHex.toUpperCase();
        renderHueBar();
        renderSpectrum();
      });
    });

    inputHex.addEventListener('input', () => {
      let val = inputHex.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        const [r, g, b] = this.hexToRgb(val);
        const [h, s, v] = this.rgbToHsv(r, g, b);
        currentHue = h;
        currentSat = s;
        currentVal = v;
        selectedHex = val.toUpperCase();
        colorPreviewBox.style.backgroundColor = selectedHex;
        colorPreviewHex.textContent = selectedHex;
        inputR.value = r;
        inputG.value = g;
        inputB.value = b;
        renderHueBar();
        renderSpectrum();
      }
    });

    // Native Color Picker Button
    if (btnNative && nativeColorInput) {
      btnNative.addEventListener('click', () => {
        nativeColorInput.value = selectedHex.length === 7 ? selectedHex : '#000000';
        nativeColorInput.click();
      });

      nativeColorInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        const [r, g, b] = this.hexToRgb(hex);
        const [h, s, v] = this.rgbToHsv(r, g, b);
        currentHue = h;
        currentSat = s;
        currentVal = v;
        selectedHex = hex.toUpperCase();
        colorPreviewBox.style.backgroundColor = selectedHex;
        colorPreviewHex.textContent = selectedHex;
        inputHex.value = selectedHex;
        inputR.value = r;
        inputG.value = g;
        inputB.value = b;
        renderHueBar();
        renderSpectrum();
      });
    }

    // Sync when modal opens
    this.syncColorPickerWithActiveColor = () => {
      const activeHex = this.paletteManager.activeSlot === 1 ? this.paletteManager.color1 : this.paletteManager.color2;
      const [r, g, b] = this.hexToRgb(activeHex || '#000000');
      const [h, s, v] = this.rgbToHsv(r, g, b);
      currentHue = h;
      currentSat = s;
      currentVal = v;
      selectedHex = activeHex.toUpperCase();
      colorPreviewBox.style.backgroundColor = selectedHex;
      colorPreviewHex.textContent = selectedHex;
      inputHex.value = selectedHex;
      inputR.value = r;
      inputG.value = g;
      inputB.value = b;
      renderHueBar();
      renderSpectrum();
    };

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

  rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return [h, s, v];
  }

  hexToRgb(hex) {
    let c = (hex || '#000000').replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16) || 0;
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}
