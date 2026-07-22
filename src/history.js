// Undo / Redo History Engine
export class HistoryManager {
  constructor(canvasManager, maxSteps = 50) {
    this.canvasManager = canvasManager;
    this.maxSteps = maxSteps;
    this.stack = [];
    this.pointer = -1;
    this.onStateChangeCallbacks = [];

    // Save initial state
    this.saveState();
  }

  saveState() {
    // Truncate redo history
    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1);
    }

    const snapshot = this.canvasManager.getImageData();
    this.stack.push(snapshot);

    if (this.stack.length > this.maxSteps) {
      this.stack.shift();
    } else {
      this.pointer++;
    }

    this.notifyStateChange();
  }

  undo() {
    if (this.canUndo()) {
      this.pointer--;
      const snapshot = this.stack[this.pointer];
      this.canvasManager.putImageData(snapshot);
      this.notifyStateChange();
    }
  }

  redo() {
    if (this.canRedo()) {
      this.pointer++;
      const snapshot = this.stack[this.pointer];
      this.canvasManager.putImageData(snapshot);
      this.notifyStateChange();
    }
  }

  canUndo() {
    return this.pointer > 0;
  }

  canRedo() {
    return this.pointer < this.stack.length - 1;
  }

  onChange(callback) {
    this.onStateChangeCallbacks.push(callback);
  }

  notifyStateChange() {
    this.onStateChangeCallbacks.forEach(cb => cb({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}
