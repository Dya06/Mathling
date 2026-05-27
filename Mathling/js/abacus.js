/* ============================================
   MATHLINGS — Animated Abacus Demonstration
   Correct bead movement:
   - Value 0: heaven bead up, earth beads down
   - Add 5: heaven bead moves down to the bar
   - Add 1-4: earth beads move up to the bar
   ============================================ */

class Abacus {
    constructor(container, options = {}) {
        this.container = container;
        this.rods = options.rods || 1;

        // Each rod state:
        // upper: 0 = heaven bead up, 1 = heaven bead down
        // lower: 0 = all earth beads down, 1-4 = number of earth beads pushed up
        this.state = [];

        this.animQueue = [];
        this.isAnimating = false;

        // Tune these if beads do not visually touch the divider nicely
        this.heavenMoveDownPx = options.heavenMoveDownPx || 42;
        this.heavenMoveDownPx = options.heavenMoveDownPx || 42;
        this.earthMoveUpPx = options.earthMoveUpPx || 34;

        for (let i = 0; i < this.rods; i++) {
            this.state.push({ upper: 0, lower: 0 });
        }

        this.injectMovementStyles();
        this.render();
        this.refreshBeads();
        this.updateValueDisplay();
    }

    injectMovementStyles() {
        if (document.getElementById('abacus-correct-movement-styles')) return;

        const style = document.createElement('style');
        style.id = 'abacus-correct-movement-styles';
        style.textContent = `
      /* Movement only. No colour-change teaching shortcut. */
      #abacusContainer .abacus-heaven-bead,
      #abacusContainer .abacus-earth-bead,
      .abacus-container .abacus-heaven-bead,
      .abacus-container .abacus-earth-bead {
        position: relative !important;
        transition: transform 0.35s ease !important;
        will-change: transform;
      }

      /* Stop older CSS from making active beads look like only their colour changed. */
      #abacusContainer .abacus-heaven-bead.active,
      #abacusContainer .abacus-earth-bead.active,
      .abacus-container .abacus-heaven-bead.active,
      .abacus-container .abacus-earth-bead.active {
        filter: none !important;
        box-shadow: inherit !important;
      }
    `;

        document.head.appendChild(style);
    }

    getValue() {
        const rod = this.state[0];
        return (rod.upper * 5) + rod.lower;
    }

    reset() {
        for (let i = 0; i < this.rods; i++) {
            this.state[i] = { upper: 0, lower: 0 };
        }

        this.refreshBeads();
        this.updateValueDisplay();
    }

    render() {
        this.container.innerHTML = '';
        this.container.classList.add('abacus-demo-widget');

        this.container.style.setProperty('--heaven-down-distance', `${this.heavenMoveDownPx}px`);
        this.container.style.setProperty('--earth-up-distance', `${this.earthMoveUpPx}px`);

        const stepInfo = document.createElement('div');
        stepInfo.className = 'abacus-step-info';
        stepInfo.id = 'abacus-step-info';
        stepInfo.textContent = 'Watch the abacus!';
        this.container.appendChild(stepInfo);

        const valueBox = document.createElement('div');
        valueBox.className = 'abacus-live-value';
        valueBox.id = 'abacus-value-display';
        valueBox.textContent = '0';
        this.container.appendChild(valueBox);

        const frame = document.createElement('div');
        frame.className = 'abacus-frame-interactive';

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

        const divider = document.createElement('div');
        divider.className = 'abacus-divider-bar';
        frame.appendChild(divider);

        const lowerSection = document.createElement('div');
        lowerSection.className = 'abacus-lower-section';

        for (let i = 0; i < this.rods; i++) {
            const rod = document.createElement('div');
            rod.className = 'abacus-rod-container';

            const line = document.createElement('div');
            line.className = 'abacus-rod-line';
            rod.appendChild(line);

            // Rendered top to bottom, but active beads start from j=0 = bottom bead
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

    refreshBeads() {
        for (let i = 0; i < this.rods; i++) {
            const rodState = this.state[i];

            // ==============================
            // HEAVEN BEAD
            // upper = 0 -> bead stays up
            // upper = 1 -> bead physically moves down
            // ==============================
            const heaven = document.getElementById(`heaven-${i}`);
            if (heaven) {
                heaven.classList.remove('active'); // stop colour-change logic

                heaven.style.position = 'relative';
                heaven.style.transition = 'top 0.35s ease';
                heaven.style.top = rodState.upper === 1 ? '38px' : '0px';
            }

            // ==============================
            // EARTH BEADS
            // lower = 0 -> all beads stay down
            // lower = 1 -> bottom bead moves up
            // lower = 2 -> bottom two beads move up
            // ==============================
            for (let j = 0; j < 4; j++) {
                const earth = document.getElementById(`earth-${i}-${j}`);

                if (earth) {
                    earth.classList.remove('active'); // stop colour-change logic

                    earth.style.position = 'relative';
                    earth.style.transition = 'top 0.35s ease';

                    if (j < rodState.lower) {
                        earth.style.top = '-24px'; // pushed up
                    } else {
                        earth.style.top = '0px'; // down
                    }
                }
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

        if (el) {
            el.textContent = text;
        }
    }

    async animateQuestion(rows, onDone) {
        this.reset();
        this.isAnimating = true;

        for (let i = 0; i < rows.length; i++) {
            const num = rows[i];

            if (i === 0) {
                this.updateStepInfo(`Start: set ${num}`);
                await this.animateSetValue(num);
            } else {
                if (num > 0) {
                    this.updateStepInfo(`Add ${num} → ${this.getAddMethod(num)}`);
                    await this.animateAdd(num);
                } else {
                    this.updateStepInfo(`Subtract ${Math.abs(num)} → ${this.getSubMethod(Math.abs(num))}`);
                    await this.animateSubtract(Math.abs(num));
                }
            }

            await this.delay(800);
        }

        this.updateStepInfo(`Answer: ${this.getValue()} ✓`);
        this.isAnimating = false;

        if (onDone) {
            onDone();
        }
    }

    getAddMethod(n) {
        const rod = this.state[0];
        const earthFree = 4 - rod.lower;

        if (n <= earthFree) {
            return `+${n} directly using earth bead${n > 1 ? 's' : ''}`;
        }

        if (rod.upper === 0) {
            return `+5, −${5 - n} using Small Friend`;
        }

        return `+${n}`;
    }

    getSubMethod(n) {
        const rod = this.state[0];

        if (n <= rod.lower) {
            return `−${n} directly using earth bead${n > 1 ? 's' : ''}`;
        }

        if (rod.upper === 1) {
            return `−5, +${5 - n} using Small Friend`;
        }

        return `−${n}`;
    }

    async animateSetValue(target) {
        if (target < 0) return;

        const rod = this.state[0];

        const heaven = target >= 5 ? 1 : 0;
        const earth = target - (heaven * 5);

        rod.upper = 0;
        rod.lower = 0;
        this.refreshBeads();
        this.updateValueDisplay();
        await this.delay(300);

        if (heaven === 1) {
            this.updateStepInfo(`Set 5: heaven bead down`);
            rod.upper = 1;
            this.refreshBeads();
            this.updateValueDisplay();
            await this.delay(500);
        }

        for (let i = 0; i < earth; i++) {
            this.updateStepInfo(`Add earth bead ${i + 1}`);
            rod.lower = i + 1;
            this.refreshBeads();
            this.updateValueDisplay();
            await this.delay(350);
        }
    }

    async animateAdd(n) {
        const rod = this.state[0];
        const earthFree = 4 - rod.lower;

        if (n <= earthFree) {
            for (let i = 0; i < n; i++) {
                rod.lower++;
                this.updateStepInfo(`+1 earth bead up`);
                this.refreshBeads();
                this.updateValueDisplay();
                await this.delay(400);
            }

            return;
        }

        if (rod.upper === 0) {
            const complement = 5 - n;

            this.updateStepInfo(`Step 1: +5, heaven bead down`);
            rod.upper = 1;
            this.refreshBeads();
            this.updateValueDisplay();
            await this.delay(600);

            if (complement > 0) {
                this.updateStepInfo(`Step 2: −${complement}, earth bead${complement > 1 ? 's' : ''} down`);

                for (let i = 0; i < complement; i++) {
                    if (rod.lower > 0) {
                        rod.lower--;
                    }

                    this.refreshBeads();
                    this.updateValueDisplay();
                    await this.delay(400);
                }
            }

            return;
        }

        for (let i = 0; i < n; i++) {
            if (rod.lower < 4) {
                rod.lower++;
            }

            this.refreshBeads();
            this.updateValueDisplay();
            await this.delay(400);
        }
    }

    async animateSubtract(n) {
        const rod = this.state[0];

        if (n <= rod.lower) {
            for (let i = 0; i < n; i++) {
                rod.lower--;
                this.updateStepInfo(`−1 earth bead down`);
                this.refreshBeads();
                this.updateValueDisplay();
                await this.delay(400);
            }

            return;
        }

        if (rod.upper === 1) {
            const complement = 5 - n;

            this.updateStepInfo(`Step 1: −5, heaven bead up`);
            rod.upper = 0;
            this.refreshBeads();
            this.updateValueDisplay();
            await this.delay(600);

            if (complement > 0) {
                this.updateStepInfo(`Step 2: +${complement}, earth bead${complement > 1 ? 's' : ''} up`);

                for (let i = 0; i < complement; i++) {
                    if (rod.lower < 4) {
                        rod.lower++;
                    }

                    this.refreshBeads();
                    this.updateValueDisplay();
                    await this.delay(400);
                }
            }

            return;
        }

        for (let i = 0; i < n; i++) {
            if (rod.lower > 0) {
                rod.lower--;
            }

            this.refreshBeads();
            this.updateValueDisplay();
            await this.delay(400);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.Abacus = Abacus;
