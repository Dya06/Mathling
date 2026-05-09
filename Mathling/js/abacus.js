/* ============================================
   MATHLINGS — Interactive Abacus Component
   A fully functional soroban-style abacus
   ============================================ */

/*
 * This is a client-side UI component — no backend needed.
 * The Abacus renders a soroban-style abacus with:
 *   - Configurable number of rods (columns)
 *   - 1 upper bead (heaven bead, value = 5) per rod
 *   - 4 lower beads (earth beads, value = 1 each) per rod
 *   - Click-to-toggle interaction for each bead
 *   - Real-time value display
 *   - Reset functionality
 *
 * Usage:
 *   const abacus = new Abacus(containerElement, { rods: 5 });
 *   abacus.getValue();  // returns current numeric value
 *   abacus.reset();     // resets all beads
 */

class Abacus {
  constructor(container, options = {}) {
    this.container = container;
    this.rods = options.rods || 5;
    this.onValueChange = options.onValueChange || null;

    // State: each rod tracks upper bead (0 or 1) and lower beads (0-4 active)
    this.state = [];
    for (let i = 0; i < this.rods; i++) {
      this.state.push({ upper: 0, lower: 0 });
    }

    this.render();
  }

  getValue() {
    let value = 0;
    for (let i = 0; i < this.rods; i++) {
      const placeValue = Math.pow(10, this.rods - 1 - i);
      const rodValue = (this.state[i].upper * 5) + this.state[i].lower;
      value += rodValue * placeValue;
    }
    return value;
  }

  reset() {
    for (let i = 0; i < this.rods; i++) {
      this.state[i] = { upper: 0, lower: 0 };
    }
    this.updateDisplay();
  }

  toggleUpper(rodIndex) {
    this.state[rodIndex].upper = this.state[rodIndex].upper ? 0 : 1;
    this.updateDisplay();
  }

  toggleLower(rodIndex, beadIndex) {
    const current = this.state[rodIndex].lower;
    // Click on a bead: if it's active (below the count), deactivate from this bead up
    // if inactive, activate from bottom to this bead
    if (beadIndex < current) {
      // Clicking an active bead — deactivate beads from this index up
      this.state[rodIndex].lower = beadIndex;
    } else {
      // Clicking an inactive bead — activate up to and including this bead
      this.state[rodIndex].lower = beadIndex + 1;
    }
    this.updateDisplay();
  }

  render() {
    this.container.innerHTML = '';
    this.container.classList.add('abacus-interactive');

    // Value display
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'abacus-live-value';
    valueDisplay.id = 'abacus-value-display';
    valueDisplay.textContent = '0';
    this.container.appendChild(valueDisplay);

    // Frame
    const frame = document.createElement('div');
    frame.className = 'abacus-frame-interactive';

    // Column labels row
    const labelsRow = document.createElement('div');
    labelsRow.className = 'abacus-labels-row';
    for (let i = 0; i < this.rods; i++) {
      const label = document.createElement('div');
      label.className = 'abacus-col-header';
      const placeNames = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands'];
      const placeLabels = ['1s', '10s', '100s', '1Ks', '10Ks'];
      const idx = this.rods - 1 - i;
      label.textContent = placeLabels[idx] || '';
      labelsRow.appendChild(label);
    }
    frame.appendChild(labelsRow);

    // Upper section (heaven beads)
    const upperSection = document.createElement('div');
    upperSection.className = 'abacus-upper-section';
    for (let i = 0; i < this.rods; i++) {
      const rod = document.createElement('div');
      rod.className = 'abacus-rod-container';

      // Rod line
      const line = document.createElement('div');
      line.className = 'abacus-rod-line';
      rod.appendChild(line);

      // Upper bead
      const bead = document.createElement('button');
      bead.className = `abacus-heaven-bead ${this.state[i].upper ? 'active' : ''}`;
      bead.setAttribute('aria-label', `Heaven bead, column ${i + 1}`);
      bead.dataset.rod = i;
      bead.addEventListener('click', () => this.toggleUpper(i));
      rod.appendChild(bead);

      upperSection.appendChild(rod);
    }
    frame.appendChild(upperSection);

    // Divider bar
    const divider = document.createElement('div');
    divider.className = 'abacus-divider-bar';
    frame.appendChild(divider);

    // Lower section (earth beads)
    const lowerSection = document.createElement('div');
    lowerSection.className = 'abacus-lower-section';
    for (let i = 0; i < this.rods; i++) {
      const rod = document.createElement('div');
      rod.className = 'abacus-rod-container';

      // Rod line
      const line = document.createElement('div');
      line.className = 'abacus-rod-line';
      rod.appendChild(line);

      // 4 earth beads (bottom to top)
      for (let j = 3; j >= 0; j--) {
        const bead = document.createElement('button');
        const isActive = j < this.state[i].lower;
        bead.className = `abacus-earth-bead ${isActive ? 'active' : ''}`;
        bead.setAttribute('aria-label', `Earth bead ${j + 1}, column ${i + 1}`);
        bead.dataset.rod = i;
        bead.dataset.bead = j;
        bead.addEventListener('click', () => this.toggleLower(i, j));
        rod.appendChild(bead);
      }

      lowerSection.appendChild(rod);
    }
    frame.appendChild(lowerSection);

    this.container.appendChild(frame);

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost btn-sm abacus-reset-btn';
    resetBtn.innerHTML = '↺ Reset Abacus';
    resetBtn.addEventListener('click', () => this.reset());
    this.container.appendChild(resetBtn);
  }

  updateDisplay() {
    const value = this.getValue();
    const display = document.getElementById('abacus-value-display');
    if (display) {
      display.textContent = value.toLocaleString();
      // Pulse animation on change
      display.classList.remove('pulse-anim');
      void display.offsetWidth; // force reflow
      display.classList.add('pulse-anim');
    }

    // Update bead active states visually
    const heavenBeads = this.container.querySelectorAll('.abacus-heaven-bead');
    heavenBeads.forEach((bead, i) => {
      bead.classList.toggle('active', this.state[i].upper === 1);
    });

    const rods = this.container.querySelectorAll('.abacus-lower-section .abacus-rod-container');
    rods.forEach((rod, i) => {
      const beads = rod.querySelectorAll('.abacus-earth-bead');
      // Beads are rendered top-to-bottom (j=3,2,1,0), but state counts from bottom
      beads.forEach((bead, bIdx) => {
        const j = 3 - bIdx; // reverse index since rendered top-to-bottom
        bead.classList.toggle('active', j < this.state[i].lower);
      });
    });

    // Notify callback
    if (this.onValueChange) this.onValueChange(value);
  }
}

// Export for use
window.Abacus = Abacus;
