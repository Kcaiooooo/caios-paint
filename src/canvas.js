// Canvas & Viewport Manager
export class CanvasManager {
  constructor(mainCanvas, overlayCanvas, container, viewport) {
    this.mainCanvas = mainCanvas;
    this.overlayCanvas = overlayCanvas;
    this.container = container;
    this.viewport = viewport;
    this.scrollWrapper = document.getElementById('canvasScrollWrapper');

    this.ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
    this.oCtx = overlayCanvas.getContext('2d');

    this.width = mainCanvas.width;
    this.height = mainCanvas.height;

    this.zoom = 1.0; // 100%
    this.isResizing = false;
    this.resizeHandleType = null;
    this.startResizeWidth = 0;
    this.startResizeHeight = 0;
    this.startMouseX = 0;
    this.startMouseY = 0;

    this.onResizeCallbacks = [];

    this.initCanvasBackground();
    this.setupResizeHandles();
    this.updateScrollWrapperDimensions();
  }

  initCanvasBackground() {
    // Fill main canvas with solid white background initially
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  setupResizeHandles() {
    const handleRight = document.getElementById('handleRight');
    const handleBottom = document.getElementById('handleBottom');
    const handleCorner = document.getElementById('handleCorner');
    const tooltip = document.getElementById('resizeTooltip');

    const startDrag = (e, type) => {
      e.preventDefault();
      e.stopPropagation();
      this.isResizing = true;
      this.resizeHandleType = type;
      this.startResizeWidth = this.width;
      this.startResizeHeight = this.height;
      this.startMouseX = e.clientX;
      this.startMouseY = e.clientY;
      tooltip.style.display = 'block';
      this.updateTooltip(tooltip, this.width, this.height);

      const onMouseMove = (moveEvt) => {
        if (!this.isResizing) return;
        const dx = Math.round((moveEvt.clientX - this.startMouseX) / this.zoom);
        const dy = Math.round((moveEvt.clientY - this.startMouseY) / this.zoom);

        let newW = this.startResizeWidth;
        let newH = this.startResizeHeight;

        if (type === 'r' || type === 'rb') newW = Math.max(10, this.startResizeWidth + dx);
        if (type === 'b' || type === 'rb') newH = Math.max(10, this.startResizeHeight + dy);

        this.updateTooltip(tooltip, newW, newH);
        this.previewResizeDimensions(newW, newH);
      };

      const onMouseUp = (upEvt) => {
        if (!this.isResizing) return;
        this.isResizing = false;
        tooltip.style.display = 'none';

        const dx = Math.round((upEvt.clientX - this.startMouseX) / this.zoom);
        const dy = Math.round((upEvt.clientY - this.startMouseY) / this.zoom);

        let newW = this.startResizeWidth;
        let newH = this.startResizeHeight;

        if (type === 'r' || type === 'rb') newW = Math.max(10, this.startResizeWidth + dx);
        if (type === 'b' || type === 'rb') newH = Math.max(10, this.startResizeHeight + dy);

        this.resizeCanvas(newW, newH);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    handleRight.addEventListener('mousedown', (e) => startDrag(e, 'r'));
    handleBottom.addEventListener('mousedown', (e) => startDrag(e, 'b'));
    handleCorner.addEventListener('mousedown', (e) => startDrag(e, 'rb'));
  }

  updateTooltip(tooltip, w, h) {
    tooltip.textContent = `${w} x ${h}px`;
  }

  updateScrollWrapperDimensions(w = this.width, h = this.height) {
    if (this.scrollWrapper) {
      this.scrollWrapper.style.width = `${w * this.zoom}px`;
      this.scrollWrapper.style.height = `${h * this.zoom}px`;
    }
  }

  previewResizeDimensions(w, h) {
    this.container.style.width = `${w}px`;
    this.container.style.height = `${h}px`;
    this.updateScrollWrapperDimensions(w, h);
  }

  resizeCanvas(newW, newH, preserveContent = true) {
    let imgData = null;
    if (preserveContent) {
      imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    }

    this.width = newW;
    this.height = newH;

    this.mainCanvas.width = newW;
    this.mainCanvas.height = newH;
    this.overlayCanvas.width = newW;
    this.overlayCanvas.height = newH;

    this.container.style.width = `${newW}px`;
    this.container.style.height = `${newH}px`;
    this.updateScrollWrapperDimensions();

    // Fill new areas with white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, newW, newH);

    if (preserveContent && imgData) {
      this.ctx.putImageData(imgData, 0, 0);
    }

    this.notifyResize();
  }

  onResize(callback) {
    this.onResizeCallbacks.push(callback);
  }

  notifyResize() {
    this.onResizeCallbacks.forEach(cb => cb(this.width, this.height));
  }

  setZoom(zoomFactor) {
    this.zoom = Math.max(0.1, Math.min(8.0, zoomFactor));
    this.container.style.transform = `scale(${this.zoom})`;
    this.container.style.setProperty('--zoom', this.zoom);
    this.updateScrollWrapperDimensions();
  }

  clearOverlay() {
    this.oCtx.clearRect(0, 0, this.width, this.height);
  }

  getPointerPos(evt) {
    const rect = this.overlayCanvas.getBoundingClientRect();
    const x = Math.round((evt.clientX - rect.left) / this.zoom);
    const y = Math.round((evt.clientY - rect.top) / this.zoom);
    return { x, y };
  }

  getImageData() {
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  putImageData(imgData) {
    this.resizeCanvas(imgData.width, imgData.height, false);
    this.ctx.putImageData(imgData, 0, 0);
  }
}
