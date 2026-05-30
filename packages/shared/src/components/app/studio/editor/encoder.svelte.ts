import { Spring } from 'svelte/motion';

export type EncoderField = 'encoder_cw' | 'encoder_ccw';

export interface EncoderKnobOptions {
  isTrainingActive: () => boolean;
  onTrigger: (field: EncoderField) => void;
}

// Encapsulates the rotary-knob physics: drag tracking, inertia slide, and the
// spring that snaps back to home. State that the encoder buttons also read
// (activeTriggeredButton) lives here so a single instance is shared between
// Knob.svelte and EncoderButtons.svelte.
export class EncoderKnob {
  #spring = new Spring(-90, {
    stiffness: 0.08,
    damping: 0.45,
  });

  isDragging = $state(false);
  isAnimatingEntrance = $state(true);
  isResetting = $state(false);
  activeTriggeredButton = $state<string | null>(null);

  #el: HTMLElement | null = null;

  // Non-reactive physics tracking
  #startAngle = 0;
  #lastAngle = 0;
  #velocity = 0;
  #lastTime = 0;
  #animationFrameId = 0;
  #delayTimeoutId: ReturnType<typeof setTimeout> | null = null;
  #dragEndTime = 0;
  #sessionDeltaAccumulator = 0;

  constructor(private opts: EncoderKnobOptions) {
    $effect(() => {
      const startTimeout = setTimeout(() => {
        this.#spring.target = 0;
      }, 50);

      const endTimeout = setTimeout(() => {
        this.isAnimatingEntrance = false;
      }, 900);

      return () => {
        clearTimeout(startTimeout);
        clearTimeout(endTimeout);
      };
    });
  }

  get rotation(): number {
    return this.#spring.current;
  }

  setElement(el: HTMLElement | null): void {
    this.#el = el;
  }

  #getAngle(clientX: number, clientY: number): number {
    if (!this.#el) return 0;
    const rect = this.#el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radians = Math.atan2(clientY - centerY, clientX - centerX);
    return radians * (180 / Math.PI);
  }

  handleStart = (e: MouseEvent | TouchEvent): void => {
    this.isDragging = true;

    cancelAnimationFrame(this.#animationFrameId);
    if (this.#delayTimeoutId) clearTimeout(this.#delayTimeoutId);
    this.#velocity = 0;
    this.#sessionDeltaAccumulator = 0;
    this.activeTriggeredButton = null;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    this.#startAngle = this.#getAngle(clientX, clientY);
    this.#lastAngle = this.#startAngle;

    this.#lastTime = performance.now();

    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('touchmove', this.handleMove, { passive: false });
    window.addEventListener('mouseup', this.handleEnd);
    window.addEventListener('touchend', this.handleEnd);
  };

  handleMove = (e: MouseEvent | TouchEvent): void => {
    if (!this.isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentTime = performance.now();
    const currentAngle = this.#getAngle(clientX, clientY);

    let deltaAngle = currentAngle - this.#lastAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    this.#sessionDeltaAccumulator += deltaAngle;

    const timeDelta = currentTime - this.#lastTime;
    if (timeDelta > 0) {
      this.#velocity = deltaAngle / timeDelta;
    }

    this.#spring.set(this.#spring.current + deltaAngle, { instant: true });

    this.#lastAngle = currentAngle;
    this.#lastTime = currentTime;
  };

  #updateInertia = (): void => {
    if (this.isDragging) return;

    const currentTime = performance.now();
    const timeDelta = currentTime - this.#lastTime;
    this.#lastTime = currentTime;

    const friction = 0.8;
    this.#velocity *= Math.pow(friction, timeDelta / 16);

    this.#spring.set(this.#spring.current + this.#velocity * timeDelta, { instant: true });

    if (Math.abs(this.#velocity) > 0.005) {
      this.#animationFrameId = requestAnimationFrame(this.#updateInertia);
    } else {
      this.#velocity = 0;
    }
  };

  handleClick = (): void => {
    // Blocks ghost clicks on drag-release
    this.#spring.target = 0;

    if (performance.now() - this.#dragEndTime < 100) return;

    // Blocks click when already home at zero
    if (Math.abs(this.#spring.current) < 0.5) return;

    const resetDirectionField = this.#spring.current > 0 ? 'encoder_ccw' : 'encoder_cw';
    this.isResetting = true;
    this.activeTriggeredButton = resetDirectionField;

    this.#spring.target = 0;

    setTimeout(() => {
      this.isResetting = false;
      this.activeTriggeredButton = null;
    }, 500);
  };

  handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      this.handleClick();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      this.#spring.set(this.#spring.current + 15, { instant: false });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      this.#spring.set(this.#spring.current - 15, { instant: false });
    }
  };

  handleScroll = (e: WheelEvent): void => {
    e.preventDefault();
    this.#spring.set(this.#spring.current - e.deltaY, { instant: false });
  };

  handleEnd = (): void => {
    this.isDragging = false;
    this.#dragEndTime = performance.now();

    window.removeEventListener('mousemove', this.handleMove);
    window.removeEventListener('touchmove', this.handleMove);
    window.removeEventListener('mouseup', this.handleEnd);
    window.removeEventListener('touchend', this.handleEnd);

    if (Math.abs(this.#sessionDeltaAccumulator) > 1) {
      const targetField: EncoderField = this.#sessionDeltaAccumulator > 0 ? 'encoder_cw' : 'encoder_ccw';
      this.activeTriggeredButton = targetField;

      if (this.#delayTimeoutId) clearTimeout(this.#delayTimeoutId);
      this.#delayTimeoutId = setTimeout(() => {
        if (this.opts.isTrainingActive()) {
          this.opts.onTrigger(targetField);
        }
        this.activeTriggeredButton = null;
      }, 450);
    }

    if (Math.abs(this.#velocity) > 0.05) {
      this.#lastTime = performance.now();
      this.#animationFrameId = requestAnimationFrame(this.#updateInertia);
    }
  };
}
