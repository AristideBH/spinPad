<script lang="ts">
  // ───────────────────────────────────────────────────────────────────────
  //  LedMatrix.svelte — LED showcase as a grid of dots (2D canvas)
  //
  //  Drop-in, responsive, Svelte 5. A single <canvas> + one rAF loop.
  //
  //  MOTION (`mode`) and COLOR (`color`) decoupled:
  //    mode  : off | static | pulse | breathe | flow | sweep | alert | rainbow
  //    color : solid (colors[0]) | gradient (interpolated over colors[])
  //
  //  EQUALIZER (optional): `pulses` provides reactive counters (one per
  //  source, e.g. keys). Each increment injects energy that LIFTS the
  //  glow of the matching column (gaussian + gravity), blended into the
  //  current mode. `pop` 0..1: 0 = transparent blend, 1 = columns that burst.
  //    <LedMatrix mode="flow" pulses={() => keyVisuals.pressNonce} />
  //
  //  Efficient: capped DPR, pause off-screen, prefers-reduced-motion (frozen
  //  modes but reactive EQ), precomputed positions, auto-stop of the rAF.
  // ───────────────────────────────────────────────────────────────────────
  import { cn } from '$shared/utils.js';
  import { KEY_LAYOUT } from '$shared/constants/key-layout.js';

  // Key center positions [nx, ny] normalized to the 3-col × 4-row physical grid
  const KEY_POS: [number, number][] = [];
  for (const k of KEY_LAYOUT) {
    KEY_POS[k.idx] = [
      (k.col - 1 + (k.colSpan - 1) * 0.5) / 2,
      (k.row - 1 + (k.rowSpan - 1) * 0.5) / 3,
    ];
  }

  type Mode = 'off' | 'static' | 'pulse' | 'breathe' | 'flow' | 'sweep' | 'alert' | 'rainbow';
  type ColorMode = 'solid' | 'gradient';
  type Falloff = 'bottom' | 'center' | 'top' | 'none';

  interface Props {
    /** Panel motion. */
    mode?: Mode;
    /** `solid` = colors[0]; `gradient` = interpolation over colors[]. */
    color?: ColorMode;
    /** Globally dims (panel "idle"). */
    muted?: boolean;
    /** Palette (hex / rgb / CSS name / `var(--token)`). */
    colors?: string[];
    /** Brightness ceiling 0..1. */
    brightness?: number;
    /** Animation speed multiplier. */
    speed?: number;
    /** Grid step in px (density). */
    cell?: number;
    /** Dot diameter / `cell` (0..1). */
    dotRatio?: number;
    /** Shape of the brightness mask (the "blob"). */
    falloff?: Falloff;
    /** Slight bloom: bright dots grow a little. */
    glow?: boolean;
    /**
     * Reactive equalizer (optional). REACTIVE accessor of an array of
     * monotonic counters (one per source; e.g. `() => keyVisuals.pressNonce`).
     * Each increment = an impulse that lifts the column ~ source. The
     * physics (attack/gravity/diffusion) is handled here; just emit pings.
     */
    pulses?: () => number[];
    /** EQ style: 0 = transparent blend, 1 = bursting columns (boost + light tint). */
    pop?: number;
    /** Global EQ intensity (bubbles + waves). Lower = more subtle. */
    eqGain?: number;
    /**
     * Encoder rotation (optional). REACTIVE accessor of a SIGNED cumulative
     * position (CW +, CCW -). Each delta emits a horizontal wave that sweeps
     * the grid in the rotation direction. E.g. `() => keyVisuals.encoderTurn`.
     */
    rotation?: () => number;
    /**
     * Per-key color overrides (optional). Key = physical key index
     * (0-9); value = RGB color 0–255. Dots near the key's physical
     * position adopt this color, the mode animation is preserved.
     */
    overrides?: Map<number, { r: number; g: number; b: number }>;
    class?: string;
  }

  let {
    mode = 'flow',
    color = 'gradient',
    muted = false,
    colors = ['#34d399', '#22d3ee', '#3b82f6', '#34d399'],
    brightness = 1,
    speed = 1,
    cell = 14,
    dotRatio = 0.45,
    falloff = 'bottom',
    glow = false,
    pulses,
    pop = 0,
    eqGain = 0.45,
    rotation,
    overrides,
    class: className,
  }: Props = $props();

  const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

  type RGB = [number, number, number];

  function parseRGB(s: string | null): RGB | null {
    if (!s) return null;
    if (s[0] === '#') {
      let h = s.slice(1);
      if (h.length === 3)
        h = h
          .split('')
          .map((c) => c + c)
          .join('');
      const n = Number.parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = s.match(/-?\d+\.?\d*/g); // rgb(...) / rgba(...)
    if (m && m.length >= 3) return [+m[0] | 0, +m[1] | 0, +m[2] | 0];
    return null;
  }

  // Palette interpolation, written into `out` (zero allocation, hot path).
  function writePaletteAt(out: RGB, pal: RGB[], f: number): void {
    const src = pal.length === 1 ? pal[0] : null;
    if (src) {
      out[0] = src[0];
      out[1] = src[1];
      out[2] = src[2];
      return;
    }
    const x = clamp01(f) * (pal.length - 1);
    const i = Math.floor(x);
    const a = pal[i];
    const b = pal[Math.min(i + 1, pal.length - 1)];
    const tt = x - i;
    out[0] = a[0] + (b[0] - a[0]) * tt;
    out[1] = a[1] + (b[1] - a[1]) * tt;
    out[2] = a[2] + (b[2] - a[2]) * tt;
  }

  function hslToRgb(h: number, s: number, l: number): RGB {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  const animated = $derived(mode !== 'off' && mode !== 'static');

  // Separate easing: FAST alpha (crisp lively anims) / SLOW color (soft fades).
  const TAU_A = 0.07;
  const TAU_C = 0.18;
  const EPS = 0.004; // stabilization threshold -> stop rAF

  // ── Equalizer settings ────────────────────────────────────────────────
  const EQ_BASE = 0.05; // height at rest (thin bottom line)
  const EQ_ATTACK = 0.9; // energy added per impulse
  const EQ_HALF = 0.35; // half-life of the fall (s) — gravity
  const EQ_SPREAD = 0.06; // horizontal σ (nx units) of the "hill"
  const EQ_REACH = 0.92; // max rise height
  const EQ_EDGE = 0.28; // softness of the top edge
  const EQ_FLOOR = 0.55; // share of the EQ visible during the mode's troughs
  // ── Wave settings (encoder rotation) ──────────────────────────────────
  const WAVE_DUR = 0.9; // crossing duration (s)
  const WAVE_SIGMA = 0.1; // front width (nx units)
  const WAVE_AMP = 0.6; // amplitude (before eqGain)
  const WAVE_MAX = 6; // max queue of simultaneous waves

  // Constant precomputations (pure functions of the constants above).
  const EQ_INV2S2 = 1 / (2 * EQ_SPREAD * EQ_SPREAD);
  const WAVE_INV2S2 = 1 / (2 * WAVE_SIGMA * WAVE_SIGMA);

  function setup(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cssW = 0;
    let cssH = 0;
    let visible = true;
    let snap = true; // 1st frame after (re)build: jump directly to the target
    let lastNow = 0;

    let dots: { x: number; y: number; nx: number; ny: number; mask: number }[] = [];
    // Smoothed displayed state, per dot (soft transitions).
    let dA = new Float32Array(0);
    let dR = new Float32Array(0);
    let dG = new Float32Array(0);
    let dB = new Float32Array(0);

    // Scratch color reused per dot (rewritten each iteration) — no alloc.
    const col: RGB = [0, 0, 0];
    // Frame context: recomputed at the top of `draw`, read by `commitDot`.
    let fKA = 1; // alpha easing (fast)
    let fKC = 1; // color easing (slow)
    let fCap = 1; // brightness ceiling (brightness × muted)
    let fR0 = 0; // base dot radius
    let fPal: RGB[] = [[255, 255, 255]]; // resolved palette (RGB) for the frame

    // EQ energy per SOURCE (stable on resize: not tied to dot columns).
    let nSrc = 0;
    let energy = new Float32Array(0);
    let prevN: number[] = [];
    let srcX: number[] = [];

    // Encoder waves: each sweeps the grid (dir +1 = L->R, -1 = R->L).
    let prevR = 0;
    let haveR = false;
    let waves: { dir: number; born: number }[] = [];

    const startT = performance.now();
    const rgbCache = new Map<string, RGB>();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce = mq.matches;

    // Tolerant color resolution: var()/oklch/CSS name via computed color,
    // fallback to fillStyle normalization. Memoized.
    function rgb(str: string): RGB {
      const hit = rgbCache.get(str);
      if (hit) return hit;
      let out: RGB | null = null;
      canvas.style.color = '';
      canvas.style.color = str.startsWith('--') ? `var(${str})` : str;
      out = parseRGB(getComputedStyle(canvas).color);
      canvas.style.color = '';
      if (!out) {
        ctx!.fillStyle = '#000';
        ctx!.fillStyle = str;
        out = parseRGB(ctx!.fillStyle as string);
      }
      out ??= [255, 255, 255];
      rgbCache.set(str, out);
      return out;
    }

    function maskOf(nx: number, ny: number): number {
      if (falloff === 'none') return 1;
      if (falloff === 'center') return clamp01(1 - Math.hypot(nx - 0.5, ny - 0.5) / 0.7071);
      if (falloff === 'top') return clamp01(1 - Math.hypot((nx - 0.5) * 1.1, ny - 0.1) / 0.95);
      // bottom (default): glow concentrated at bottom-center
      return clamp01(1 - Math.hypot((nx - 0.5) * 1.5, ny - 1.25) / 1);
    }

    function build() {
      const cols = Math.max(1, Math.ceil(cssW / cell));
      const rows = Math.max(1, Math.ceil(cssH / cell));
      const n = cols * rows;
      dots = new Array(n);
      let k = 0;
      for (let r = 0; r < rows; r++) {
        const ny = rows > 1 ? r / (rows - 1) : 0.5;
        for (let c = 0; c < cols; c++) {
          const nx = cols > 1 ? c / (cols - 1) : 0.5;
          dots[k++] = { x: c * cell + cell / 2, y: r * cell + cell / 2, nx, ny, mask: maskOf(nx, ny) };
        }
      }
      dA = new Float32Array(n);
      dR = new Float32Array(n);
      dG = new Float32Array(n);
      dB = new Float32Array(n);
      snap = true;
    }

    // Brightness factor (motion) of a dot at time t.
    function motion(nx: number, t: number): number {
      switch (mode) {
        case 'off':
          return 0.1; // off = dots in dimmed color (panel visible, not lit)
        case 'static':
          return 1;
        case 'pulse': {
          // "lub-dub" heartbeat: two close bumps then rest (cadence ~1s)
          const p = (((t * 0.9) % 1) + 1) % 1;
          const beat = Math.exp(-((p - 0.0) ** 2) / 0.012) + 0.65 * Math.exp(-((p - 0.17) ** 2) / 0.012);
          return 0.2 + 0.8 * Math.min(1, beat);
        }
        case 'breathe': {
          // slow, organic swell: ease-in-out + long hold at the extremes
          const s = 0.5 + 0.5 * Math.sin(t * 1.0 - Math.PI / 2);
          const eased = s * s * s * (s * (s * 6 - 15) + 10); // smootherstep
          return 0.1 + 0.9 * eased;
        }
        case 'flow':
          return 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((nx * 1.6 - t) * Math.PI)); // gentle wave
        case 'sweep': {
          // crisp light band moving from RIGHT -> LEFT
          const band = 0.5 + 0.5 * Math.sin((nx + t * 0.45) * Math.PI * 2);
          return 0.15 + 0.85 * Math.pow(band, 2.5);
        }
        case 'alert': {
          // urgent strobe: hard square wave (edges softened by the alpha easing)
          const p = (((t * 1.5) % 1) + 1) % 1;
          return p < 0.5 ? 1 : 0.12;
        }
        case 'rainbow':
          return 1;
        default:
          return 1;
      }
    }

    // Reads the `pulses` counters, turns increments into energy.
    // On the 1st call (or if the source count changes) we PRIME without a burst.
    function ingest() {
      const arr = pulses?.();
      if (!arr) return;
      if (arr.length !== nSrc) {
        nSrc = arr.length;
        energy = new Float32Array(nSrc);
        prevN = Array.from(arr);
        srcX = Array.from({ length: nSrc }, () => Math.random()); // random positions
        return; // priming: no impulse for the pre-existing counters
      }
      for (let i = 0; i < nSrc; i++) {
        const dl = arr[i] - prevN[i];
        if (dl > 0) {
          srcX[i] = Math.random(); // each press falls back to a random (changing) column
          energy[i] = Math.min(1, energy[i] + EQ_ATTACK * Math.min(dl, 3));
        }
        prevN[i] = arr[i];
      }
    }

    // Reads the encoder rotation, turns each detent into a directional wave.
    function ingestRot(now: number) {
      const r = rotation?.();
      if (r === undefined) return;
      if (!haveR) {
        prevR = r;
        haveR = true;
        return; // priming: no wave for the initial position
      }
      const dr = r - prevR;
      prevR = r;
      if (dr === 0) return;
      const dir = dr > 0 ? 1 : -1;
      let count = Math.min(Math.abs(dr), 3);
      while (count-- > 0) {
        if (waves.length >= WAVE_MAX) waves.shift();
        waves.push({ dir, born: now });
      }
    }

    type Dot = { x: number; y: number; nx: number; ny: number; mask: number };

    // Base color of a dot -> written into the scratch `col`.
    // rainbow / solid / gradient, then per-key overrides.
    function baseColor(d: Dot, t: number): void {
      if (mode === 'rainbow') {
        const c = hslToRgb((d.nx * 300 + t * 60) % 360, 0.85, 0.6);
        col[0] = c[0];
        col[1] = c[1];
        col[2] = c[2];
      } else if (color === 'solid') {
        col[0] = fPal[0][0];
        col[1] = fPal[0][1];
        col[2] = fPal[0][2];
      } else {
        writePaletteAt(col, fPal, d.nx);
      }

      // Per-key color overrides: color the dots near the physical position
      if (overrides?.size) {
        let best: { r: number; g: number; b: number } | null = null;
        let minDist = 0.0625; // threshold = 0.25² (radius in normalized nx/ny space)
        for (const [kidx, ov] of overrides) {
          const pos = KEY_POS[kidx];
          if (!pos) continue;
          const dx = d.nx - pos[0];
          const dy = d.ny - pos[1];
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            best = ov;
          }
        }
        if (best) {
          col[0] = best.r;
          col[1] = best.g;
          col[2] = best.b;
        }
      }
    }

    // EQ: lifts the column's glow (blended into the mode). Returns the
    // additive contribution to `tv`; also applies the "pop" onto `col`.
    function eqLiftAt(d: Dot, v: number): number {
      let H = EQ_BASE;
      for (let sIdx = 0; sIdx < nSrc; sIdx++) {
        const e = energy[sIdx];
        if (e === 0) continue;
        const dx = d.nx - srcX[sIdx];
        H += e * Math.exp(-(dx * dx) * EQ_INV2S2);
      }
      if (H > EQ_REACH) H = EQ_REACH;
      const up = 1 - d.ny; // 0 bottom .. 1 top
      const lift = clamp01((H - up) / EQ_EDGE); // soft fill from the bottom
      if (lift <= 0) return 0;
      if (pop > 0) {
        const p = pop * lift; // "bursting" columns: pull toward light
        col[0] += (255 - col[0]) * 0.6 * p;
        col[1] += (255 - col[1]) * 0.6 * p;
        col[2] += (255 - col[2]) * 0.6 * p;
      }
      return eqGain * lift * (EQ_FLOOR + (1 - EQ_FLOOR) * v); // coupled to the mode, with a floor
    }

    // Directional horizontal waves (encoder) -> additive contribution to `tv`.
    function waveLiftAt(nx: number, now: number): number {
      let add = 0;
      for (let w = 0; w < waves.length; w++) {
        const prog = (now - waves[w].born) / 1000 / WAVE_DUR; // 0..1
        const front = waves[w].dir > 0 ? prog : 1 - prog;
        const wx = nx - front;
        add += (1 - prog) * WAVE_AMP * eqGain * Math.exp(-(wx * wx) * WAVE_INV2S2);
      }
      return add;
    }

    // EQ frame: ingestion + gravity. Returns the max energy (for stopping the rAF).
    function stepEnergy(dt: number): number {
      ingest();
      const grav = Math.pow(0.5, dt / EQ_HALF);
      let eMax = 0;
      for (let i = 0; i < nSrc; i++) {
        energy[i] *= grav;
        if (energy[i] < 0.002) energy[i] = 0;
        if (energy[i] > eMax) eMax = energy[i];
      }
      return eMax;
    }

    // Wave frame: encoder ingestion + aging of expired waves.
    function stepWaves(now: number): void {
      ingestRot(now);
      for (let w = waves.length - 1; w >= 0; w--) {
        if ((now - waves[w].born) / 1000 >= WAVE_DUR) waves.splice(w, 1);
      }
    }

    // Per-dot easing (fast alpha / slow color) + draw. Returns the residual.
    function commitDot(i: number, tv: number): number {
      const ta = clamp01(fCap * tv);
      const da = ta - dA[i];
      const dc = Math.max(Math.abs(col[0] - dR[i]), Math.abs(col[1] - dG[i]), Math.abs(col[2] - dB[i])) / 255;
      dA[i] += da * fKA;
      dR[i] += (col[0] - dR[i]) * fKC;
      dG[i] += (col[1] - dG[i]) * fKC;
      dB[i] += (col[2] - dB[i]) * fKC;

      const a = dA[i];
      if (a >= 0.01) {
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${dR[i] | 0},${dG[i] | 0},${dB[i] | 0},${a})`;
        ctx!.arc(dots[i].x, dots[i].y, glow ? fR0 * (0.8 + 0.5 * a) : fR0, 0, Math.PI * 2);
        ctx!.fill();
      }
      return Math.abs(da) > dc ? Math.abs(da) : dc;
    }

    // Renders a dot: color + lifts (EQ/waves) + easing/draw. Returns the residual.
    function renderDot(i: number, t: number, now: number, eqOn: boolean): number {
      const d = dots[i];
      const v = motion(d.nx, t);
      baseColor(d, t); // fills the scratch `col`
      let tv = d.mask * v; // base luminance (mode × blob)
      if (eqOn) tv += eqLiftAt(d, v); // EQ: lift + possible "pop" on col
      if (waves.length) tv += waveLiftAt(d.nx, now); // encoder waves
      return commitDot(i, tv);
    }

    function draw(now: number): boolean {
      const dt = lastNow ? (now - lastNow) / 1000 : 0;
      lastNow = now;
      // reduce-motion: freezes time -> static pattern (the EQ stays reactive)
      const t = reduce ? 0 : ((now - startT) / 1000) * speed;
      fKA = snap ? 1 : 1 - Math.exp(-dt / TAU_A);
      fKC = snap ? 1 : 1 - Math.exp(-dt / TAU_C);
      fCap = brightness * (muted ? 0.28 : 1);
      fR0 = (dotRatio * cell) / 2;
      fPal = colors.length ? colors.map(rgb) : [[255, 255, 255]];

      const eqOn = !!pulses;
      const eMax = eqOn ? stepEnergy(dt) : 0; // EQ: ingestion + gravity
      if (rotation) stepWaves(now); // encoder waves: ingestion + aging

      ctx!.clearRect(0, 0, cssW, cssH);
      let maxd = 0;
      for (let i = 0; i < dots.length; i++) {
        const resid = renderDot(i, t, now, eqOn);
        if (resid > maxd) maxd = resid;
      }

      snap = false;
      // Keep going as long as: mode animated, EQ energy active, or transition in progress.
      const running = animated && !reduce && visible;
      return running || eMax > 0.002 || waves.length > 0 || maxd > EPS;
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function loop(now: number) {
      if (draw(now)) raf = requestAnimationFrame(loop);
      else raf = 0;
    }

    // Starts the loop if needed (it auto-stops once stabilized).
    function run() {
      if (!visible) {
        stop();
        return;
      }
      if (!raf) {
        lastNow = 0;
        raf = requestAnimationFrame(loop);
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // capped: perf
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      run();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(canvas);

    const onReduce = () => {
      reduce = mq.matches;
      run();
    };
    mq.addEventListener('change', onReduce);

    resize();

    // Geometry: rebuilds (HARD change, no fade).
    $effect(() => {
      void cell;
      void falloff;
      if (cssW > 0) {
        build();
        run();
      }
    });

    // Appearance/motion: re-targets -> SOFT transition via the per-dot easing.
    $effect(() => {
      void mode;
      void color;
      void colors;
      void brightness;
      void muted;
      void speed;
      void dotRatio;
      void glow;
      void pop;
      void eqGain;
      void animated;
      void overrides;
      run();
    });

    // EQ / rotation impulses: wakes the loop as soon as a counter moves.
    // (Reactive read; the actual ingestion happens in `draw`.)
    $effect(() => {
      pulses?.();
      rotation?.();
      run();
    });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener('change', onReduce);
    };
  }
</script>

<div class={cn('relative isolate overflow-hidden ', className)} aria-hidden="true">
  <canvas {@attach setup} class="block w-full h-full"></canvas>
</div>
