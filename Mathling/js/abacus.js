/* ============================================
   MATHLINGS — Animated Abacus Demonstration
   Shows students how beads move for each formula step.
   ============================================ */

class Abacus {
  constructor(container, options = {}) {
    this.container = container;
    this.rods = options.rods || 1; // single rod for demo
    this.state = []; // each rod: { upper: 0|1, lower: 0-4 }
    this.animQueue = [];
    this.isAnimating = false;

    for (let i = 0; i < this.rods; i++) {
      this.state.push({ upper: 0, lower: 0 });
    }

    this.render();
  }

  /* Current value on the ones rod */
  getValue() {
    const rod = this.state[0];
    return (rod.upper * 5) + rod.lower;
  }

  /* Reset all beads to 0 */
  reset() {
    for (let i = 0; i < this.rods; i++) {
      this.state[i] = { upper: 0, lower: 0 };
    }
    this.refreshBeads();
    this.updateValueDisplay();
  }

  /* ---- Render the abacus frame ---- */
  render() {
    this.container.innerHTML = '';
    this.container.classList.add('abacus-demo-widget');

    // Step description area
    const stepInfo = document.createElement('div');
    stepInfo.className = 'abacus-step-info';
    stepInfo.id = 'abacus-step-info';
    stepInfo.textContent = 'Watch the abacus!';
    this.container.appendChild(stepInfo);

    // Value display
    const valueBox = document.createElement('div');
    valueBox.className = 'abacus-live-value';
    valueBox.id = 'abacus-value-display';
    valueBox.textContent = '0';
    this.container.appendChild(valueBox);

    // Frame
    const frame = document.createElement('div');
    frame.className = 'abacus-frame-interactive';

    // Upper section (heaven beads)
    const upperSection = document.createElement('div');
    upperSection.className = 'abacus-upper-section';
    for (let i = 0; i < this.rods; i++) {
      const rod = document.createElement('div');
      rod.className = 'abacus-rod-container';
      const line = document.createElement('div');
      line.className = 'abacus-rod-line';
      rod.appendChild(line);
      const bead = document.createElement('div');
      bead.className = 'abacus-heaven-bead';
      bead.id = `heaven-${i}`;
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
      const line = document.createElement('div');
      line.className = 'abacus-rod-line';
      rod.appendChild(line);
      // 4 earth beads (rendered top=3 to bottom=0)
      for (let j = 3; j >= 0; j--) {
        const bead = document.createElement('div');
        bead.className = 'abacus-earth-bead';
        bead.id = `earth-${i}-${j}`;
        rod.appendChild(bead);
      }
      lowerSection.appendChild(rod);
    }
    frame.appendChild(lowerSection);
    this.container.appendChild(frame);
  }

  /* ---- Refresh bead visuals from state ---- */
  refreshBeads() {
    for (let i = 0; i < this.rods; i++) {
      const heaven = document.getElementById(`heaven-${i}`);
      if (heaven) heaven.classList.toggle('active', this.state[i].upper === 1);
      for (let j = 0; j < 4; j++) {
        const earth = document.getElementById(`earth-${i}-${j}`);
        if (earth) earth.classList.toggle('active', j < this.state[i].lower);
      }
    }
  }

  updateValueDisplay() {
    const el = document.getElementById('abacus-value-display');
    if (el) {
      el.textContent = this.getValue();
      el.classList.remove('pulse-anim');
      void el.offsetWidth;
      el.classList.add('pulse-anim');
    }
  }

  updateStepInfo(text) {
    const el = document.getElementById('abacus-step-info');
    if (el) el.textContent = text;
  }

  /* ============================================
     ANIMATION ENGINE
     Animates a sequence of abacus operations
     for a question's rows.
     ============================================ */

  /*
   * Animate a full question.
   * rows = [2, 1, -2, 4]
   * The first number sets the starting value,
   * subsequent numbers are added/subtracted with animated bead moves.
   */
  async animateQuestion(rows, onDone) {
    this.reset();
    this.isAnimating = true;

    for (let i = 0; i < rows.length; i++) {
      const num = rows[i];
      if (i === 0) {
        // First number: set starting value
        this.updateStepInfo(`Start: set ${num}`);
        await this.animateSetValue(num);
      } else {
        // Subsequent: add or subtract
        if (num > 0) {
          this.updateStepInfo(`Add ${num} → using ${this.getAddMethod(num)}`);
          await this.animateAdd(num);
        } else {
          this.updateStepInfo(`Subtract ${Math.abs(num)} → using ${this.getSubMethod(Math.abs(num))}`);
          await this.animateSubtract(Math.abs(num));
        }
      }
      await this.delay(800);
    }

    this.updateStepInfo(`Answer: ${this.getValue()} ✓`);
    this.isAnimating = false;
    if (onDone) onDone();
  }

  /* Describe the method used (for SF+4 formula) */
  getAddMethod(n) {
    const current = this.getValue();
    const earthFree = 4 - this.state[0].lower;
    // If we can add directly with earth beads
    if (n <= earthFree && this.state[0].upper === 0) return `+${n} directly`;
    if (n <= earthFree) return `+${n} directly`;
    // SF method: +5, then -complement
    if (this.state[0].upper === 0 && n > earthFree) return `+5, −${5 - n} (Small Friend)`;
    return `+${n}`;
  }

  getSubMethod(n) {
    const current = this.state[0].lower;
    if (n <= current) return `−${n} directly`;
    if (this.state[0].upper === 1) return `−5, +${5 - n} (Small Friend)`;
    return `−${n}`;
  }

  /* Set an absolute value (for the first number) */
  async animateSetValue(target) {
    if (target < 0) return;
    const heaven = target >= 5 ? 1 : 0;
    const earth = target - (heaven * 5);

    if (heaven) {
      this.state[0].upper = 1;
      this.refreshBeads();
      this.updateValueDisplay();
      await this.delay(500);
    }

    for (let i = 0; i < earth; i++) {
      this.state[0].lower = i + 1;
      this.refreshBeads();
      this.updateValueDisplay();
      await this.delay(300);
    }
  }

  /* Add a number with animated bead steps */
  async animateAdd(n) {
    const rod = this.state[0];
    const earthFree = 4 - rod.lower;

    if (n <= earthFree) {
      // Direct add: push earth beads up one by one
      for (let i = 0; i < n; i++) {
        rod.lower++;
        this.refreshBeads();
        this.updateValueDisplay();
        await this.delay(400);
      }
    } else if (rod.upper === 0) {
      // Small Friend: +5 then remove complement
      const complement = 5 - n;
      // Step 1: push heaven bead down (+5)
      this.updateStepInfo(`Step 1: +5 (heaven bead ↓)`);
      rod.upper = 1;
      this.refreshBeads();
      this.updateValueDisplay();
      await this.delay(600);
      // Step 2: remove complement earth beads
      if (complement > 0) {
        this.updateStepInfo(`Step 2: −${complement} (remove ${complement} earth bead${complement > 1 ? 's' : ''})`);
        for (let i = 0; i < complement; i++) {
          rod.lower--;
          this.refreshBeads();
          this.updateValueDisplay();
          await this.delay(400);
        }
      }
    } else {
      // Fallback: direct
      for (let i = 0; i < n; i++) {
        if (rod.lower < 4) { rod.lower++; }
        this.refreshBeads();
        this.updateValueDisplay();
        await this.delay(400);
      }
    }
  }

  /* Subtract a number with animated bead steps */
  async animateSubtract(n) {
    const rod = this.state[0];

    if (n <= rod.lower) {
      // Direct subtract: remove earth beads one by one
      for (let i = 0; i < n; i++) {
        rod.lower--;
        this.refreshBeads();
        this.updateValueDisplay();
        await this.delay(400);
      }
    } else if (rod.upper === 1) {
      // Remove heaven bead (-5), then add complement earth beads
      const complement = 5 - n;
      // Step 1: remove heaven bead (-5)
      this.updateStepInfo(`Step 1: −5 (heaven bead ↑)`);
      rod.upper = 0;
      this.refreshBeads();
      this.updateValueDisplay();
      await this.delay(600);
      // Step 2: add complement earth beads
      if (complement > 0) {
        this.updateStepInfo(`Step 2: +${complement} (add ${complement} earth bead${complement > 1 ? 's' : ''})`);
        for (let i = 0; i < complement; i++) {
          rod.lower++;
          this.refreshBeads();
          this.updateValueDisplay();
          await this.delay(400);
        }
      }
    } else {
      // Fallback
      for (let i = 0; i < n; i++) {
        if (rod.lower > 0) { rod.lower--; }
        this.refreshBeads();
        this.updateValueDisplay();
        await this.delay(400);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.Abacus = Abacus;
