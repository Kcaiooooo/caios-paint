// Palette & Color Manager
export class PaletteManager {
  constructor() {
    this.color1 = '#000000'; // Primary / Left Click
    this.color2 = '#ffffff'; // Secondary / Right Click / Background
    this.activeSlot = 1; // 1 or 2

    // Preset MS Paint Standard Swatches (30 colors)
    this.presetSwatches = [
      '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
      '#ffffff', '#c3c3c3', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7', '#ffc90e', '#efe4b0', '#b97a57', '#ffaec9',
      '#550000', '#804000', '#004000', '#004080', '#400080', '#008080', '#800000', '#808000', '#008000', '#008080'
    ];

    this.customSwatches = JSON.parse(localStorage.getItem('paint_custom_swatches') || '[]') || [];
    this.onColorChangeCallbacks = [];

    this.initDOM();
  }

  initDOM() {
    this.gridEl = document.getElementById('paletteGrid');
    this.slot1Wrapper = document.getElementById('slotColor1Wrapper');
    this.slot2Wrapper = document.getElementById('slotColor2Wrapper');
    this.slot1Box = document.getElementById('slotColor1');
    this.slot2Box = document.getElementById('slotColor2');

    this.renderSwatches();

    this.slot1Wrapper.addEventListener('click', () => this.setActiveSlot(1));
    this.slot2Wrapper.addEventListener('click', () => this.setActiveSlot(2));
  }

  renderSwatches() {
    this.gridEl.innerHTML = '';
    const allColors = [...this.presetSwatches, ...this.customSwatches];
    
    allColors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color;
      swatch.title = color;

      swatch.addEventListener('click', (e) => {
        if (this.activeSlot === 1) {
          this.setColor1(color);
        } else {
          this.setColor2(color);
        }
      });

      swatch.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.setColor2(color);
      });

      this.gridEl.appendChild(swatch);
    });
  }

  setActiveSlot(slotNum) {
    this.activeSlot = slotNum;
    if (slotNum === 1) {
      this.slot1Wrapper.classList.add('active');
      this.slot2Wrapper.classList.remove('active');
    } else {
      this.slot2Wrapper.classList.add('active');
      this.slot1Wrapper.classList.remove('active');
    }
  }

  setColor1(hexColor) {
    this.color1 = hexColor;
    this.slot1Box.style.backgroundColor = hexColor;
    this.notifyChange();
  }

  setColor2(hexColor) {
    this.color2 = hexColor;
    this.slot2Box.style.backgroundColor = hexColor;
    this.notifyChange();
  }

  addCustomColor(hexColor) {
    if (!this.customSwatches.includes(hexColor)) {
      this.customSwatches.push(hexColor);
      if (this.customSwatches.length > 10) this.customSwatches.shift();
      localStorage.setItem('paint_custom_swatches', JSON.stringify(this.customSwatches));
      this.renderSwatches();
    }
    if (this.activeSlot === 1) this.setColor1(hexColor);
    else this.setColor2(hexColor);
  }

  swapColors() {
    const temp = this.color1;
    this.setColor1(this.color2);
    this.setColor2(temp);
  }

  onChange(cb) {
    this.onColorChangeCallbacks.push(cb);
  }

  notifyChange() {
    this.onColorChangeCallbacks.forEach(cb => cb({ color1: this.color1, color2: this.color2 }));
  }
}
