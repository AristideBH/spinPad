<script lang="ts">
  // ───────────────────────────────────────────────────────────────────────
  //  LedMatrix.svelte — vitrine LED en grille de points (canvas 2D)
  //
  //  Drop-in, responsive, Svelte 5. Un seul <canvas> + une boucle rAF unique.
  //
  //  MOUVEMENT (`mode`) et COULEUR (`color`) découplés :
  //    mode  : off | static | pulse | breathe | flow | sweep | alert | rainbow
  //    color : solid (colors[0]) | gradient (interpolé sur colors[])
  //
  //  ÉQUALISEUR (optionnel) : `pulses` fournit des compteurs réactifs (un par
  //  source, ex. touches). Chaque incrément injecte de l'énergie qui SOULÈVE la
  //  lueur de la colonne correspondante (gaussienne + gravité), fondue dans le
  //  mode courant. `pop` 0..1 : 0 = fusion transparente, 1 = colonnes qui pètent.
  //    <LedMatrix mode="flow" pulses={() => keyVisuals.pressNonce} />
  //
  //  Efficace : DPR plafonné, pause hors-écran, prefers-reduced-motion (modes
  //  figés mais EQ réactif), positions précalculées, arrêt auto de la rAF.
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
    /** Mouvement du panneau. */
    mode?: Mode;
    /** `solid` = colors[0] ; `gradient` = interpolation sur colors[]. */
    color?: ColorMode;
    /** Atténue globalement (panneau « en veille »). */
    muted?: boolean;
    /** Palette (hex / rgb / nom CSS / `var(--token)`). */
    colors?: string[];
    /** Plafond de luminosité 0..1. */
    brightness?: number;
    /** Multiplicateur de vitesse d'animation. */
    speed?: number;
    /** Pas de la grille en px (densité). */
    cell?: number;
    /** Diamètre du point / `cell` (0..1). */
    dotRatio?: number;
    /** Forme du masque de luminosité (le « blob »). */
    falloff?: Falloff;
    /** Léger bloom : les points vifs grossissent un peu. */
    glow?: boolean;
    /**
     * Équaliseur réactif (optionnel). Accesseur RÉACTIF d'un tableau de
     * compteurs monotones (un par source ; ex. `() => keyVisuals.pressNonce`).
     * Chaque incrément = une impulsion qui soulève la colonne ~ source. La
     * physique (attaque/gravité/diffusion) est gérée ici ; émettez juste des pings.
     */
    pulses?: () => number[];
    /** Style EQ : 0 = fusion transparente, 1 = colonnes éclatantes (boost + teinte claire). */
    pop?: number;
    /** Intensité globale de l'EQ (bulles + vagues). Plus bas = plus discret. */
    eqGain?: number;
    /**
     * Rotation encodeur (optionnel). Accesseur RÉACTIF d'une position cumulée
     * SIGNÉE (CW +, CCW -). Chaque delta émet une vague horizontale qui balaie
     * la grille dans le sens de rotation. Ex. `() => keyVisuals.encoderTurn`.
     */
    rotation?: () => number;
    /**
     * Overrides de couleur par-touche (optionnel). Clé = index physique de la
     * touche (0-9) ; valeur = couleur RGB 0–255. Les dots proches de la position
     * physique de la touche adoptent cette couleur, animation du mode conservée.
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

  // Interpolation de palette, écrite dans `out` (zéro allocation, hot path).
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

  // Easing séparé : alpha RAPIDE (anims vives nettes) / couleur LENTE (fondus doux).
  const TAU_A = 0.07;
  const TAU_C = 0.18;
  const EPS = 0.004; // seuil de stabilisation -> arrêt rAF

  // ── Réglages équaliseur ───────────────────────────────────────────────
  const EQ_BASE = 0.05; // hauteur au repos (fine ligne du bas)
  const EQ_ATTACK = 0.9; // énergie ajoutée par impulsion
  const EQ_HALF = 0.35; // demi-vie de la chute (s) — gravité
  const EQ_SPREAD = 0.06; // σ horizontal (unités nx) de la « colline »
  const EQ_REACH = 0.92; // hauteur max de montée
  const EQ_EDGE = 0.28; // douceur du bord supérieur
  const EQ_FLOOR = 0.55; // part de l'EQ visible pendant les creux du mode
  // ── Réglages vague (rotation encodeur) ────────────────────────────────
  const WAVE_DUR = 0.9; // durée de traversée (s)
  const WAVE_SIGMA = 0.1; // largeur du front (unités nx)
  const WAVE_AMP = 0.6; // amplitude (avant eqGain)
  const WAVE_MAX = 6; // file max de vagues simultanées

  // Précalculs constants (fonctions pures des constantes ci-dessus).
  const EQ_INV2S2 = 1 / (2 * EQ_SPREAD * EQ_SPREAD);
  const WAVE_INV2S2 = 1 / (2 * WAVE_SIGMA * WAVE_SIGMA);

  function setup(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cssW = 0;
    let cssH = 0;
    let visible = true;
    let snap = true; // 1re frame après (re)build : saut direct à la cible
    let lastNow = 0;

    let dots: { x: number; y: number; nx: number; ny: number; mask: number }[] = [];
    // État affiché lissé, par point (transitions douces).
    let dA = new Float32Array(0);
    let dR = new Float32Array(0);
    let dG = new Float32Array(0);
    let dB = new Float32Array(0);

    // Couleur scratch réutilisée par dot (réécrite à chaque itération) — pas d'alloc.
    const col: RGB = [0, 0, 0];
    // Contexte de frame : recalculé en tête de `draw`, lu par `commitDot`.
    let fKA = 1; // easing alpha (rapide)
    let fKC = 1; // easing couleur (lent)
    let fCap = 1; // plafond luminosité (brightness × muted)
    let fR0 = 0; // rayon de base du point
    let fPal: RGB[] = [[255, 255, 255]]; // palette résolue (RGB) de la frame

    // Énergie EQ par SOURCE (stable au resize : non liée aux colonnes de points).
    let nSrc = 0;
    let energy = new Float32Array(0);
    let prevN: number[] = [];
    let srcX: number[] = [];

    // Vagues encodeur : chacune balaie la grille (dir +1 = G->D, -1 = D->G).
    let prevR = 0;
    let haveR = false;
    let waves: { dir: number; born: number }[] = [];

    const startT = performance.now();
    const rgbCache = new Map<string, RGB>();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce = mq.matches;

    // Résolution couleur tolérante : var()/oklch/nom CSS via couleur calculée,
    // repli sur normalisation fillStyle. Mémoïsée.
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
      // bottom (défaut) : lueur concentrée en bas-centre
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

    // Facteur de luminosité (mouvement) d'un point à l'instant t.
    function motion(nx: number, t: number): number {
      switch (mode) {
        case 'off':
          return 0.1; // éteint = points en couleur atténuée (panneau visible, non allumé)
        case 'static':
          return 1;
        case 'pulse': {
          // battement « lub-dub » : deux bumps rapprochés puis repos (cadence ~1s)
          const p = (((t * 0.9) % 1) + 1) % 1;
          const beat = Math.exp(-((p - 0.0) ** 2) / 0.012) + 0.65 * Math.exp(-((p - 0.17) ** 2) / 0.012);
          return 0.2 + 0.8 * Math.min(1, beat);
        }
        case 'breathe': {
          // gonflement lent et organique : ease-in-out + longue tenue aux extrêmes
          const s = 0.5 + 0.5 * Math.sin(t * 1.0 - Math.PI / 2);
          const eased = s * s * s * (s * (s * 6 - 15) + 10); // smootherstep
          return 0.1 + 0.9 * eased;
        }
        case 'flow':
          return 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((nx * 1.6 - t) * Math.PI)); // onde douce
        case 'sweep': {
          // bande lumineuse nette se déplaçant de DROITE -> GAUCHE
          const band = 0.5 + 0.5 * Math.sin((nx + t * 0.45) * Math.PI * 2);
          return 0.15 + 0.85 * Math.pow(band, 2.5);
        }
        case 'alert': {
          // strobe urgent : créneau dur (bords adoucis par l'easing alpha)
          const p = (((t * 1.5) % 1) + 1) % 1;
          return p < 0.5 ? 1 : 0.12;
        }
        case 'rainbow':
          return 1;
        default:
          return 1;
      }
    }

    // Lit les compteurs `pulses`, transforme les incréments en énergie.
    // Au 1er appel (ou si le nb de sources change) on AMORCE sans salve.
    function ingest() {
      const arr = pulses?.();
      if (!arr) return;
      if (arr.length !== nSrc) {
        nSrc = arr.length;
        energy = new Float32Array(nSrc);
        prevN = Array.from(arr);
        srcX = Array.from({ length: nSrc }, () => Math.random()); // positions aléatoires
        return; // amorçage : pas d'impulsion pour les compteurs préexistants
      }
      for (let i = 0; i < nSrc; i++) {
        const dl = arr[i] - prevN[i];
        if (dl > 0) {
          srcX[i] = Math.random(); // chaque appui retombe à une colonne aléatoire (changeante)
          energy[i] = Math.min(1, energy[i] + EQ_ATTACK * Math.min(dl, 3));
        }
        prevN[i] = arr[i];
      }
    }

    // Lit la rotation encodeur, transforme chaque cran en vague directionnelle.
    function ingestRot(now: number) {
      const r = rotation?.();
      if (r === undefined) return;
      if (!haveR) {
        prevR = r;
        haveR = true;
        return; // amorçage : pas de vague pour la position initiale
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

    // Couleur de base d'un dot -> écrite dans le scratch `col`.
    // rainbow / solid / gradient, puis overrides par-touche.
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

      // Per-key color overrides : colore les dots proches de la position physique
      if (overrides?.size) {
        let best: { r: number; g: number; b: number } | null = null;
        let minDist = 0.0625; // seuil = 0.25² (rayon en espace nx/ny normalisé)
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

    // EQ : soulève la lueur de la colonne (fondu dans le mode). Retourne la
    // contribution additive à `tv` ; applique au passage le « pop » sur `col`.
    function eqLiftAt(d: Dot, v: number): number {
      let H = EQ_BASE;
      for (let sIdx = 0; sIdx < nSrc; sIdx++) {
        const e = energy[sIdx];
        if (e === 0) continue;
        const dx = d.nx - srcX[sIdx];
        H += e * Math.exp(-(dx * dx) * EQ_INV2S2);
      }
      if (H > EQ_REACH) H = EQ_REACH;
      const up = 1 - d.ny; // 0 bas .. 1 haut
      const lift = clamp01((H - up) / EQ_EDGE); // remplissage doux depuis le bas
      if (lift <= 0) return 0;
      if (pop > 0) {
        const p = pop * lift; // colonnes qui « pètent » : tirage vers le clair
        col[0] += (255 - col[0]) * 0.6 * p;
        col[1] += (255 - col[1]) * 0.6 * p;
        col[2] += (255 - col[2]) * 0.6 * p;
      }
      return eqGain * lift * (EQ_FLOOR + (1 - EQ_FLOOR) * v); // couplé au mode, avec plancher
    }

    // Vagues horizontales directionnelles (encodeur) -> contribution additive à `tv`.
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

    // Frame EQ : ingestion + gravité. Retourne l'énergie max (pour l'arrêt rAF).
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

    // Frame vagues : ingestion encodeur + vieillissement des vagues expirées.
    function stepWaves(now: number): void {
      ingestRot(now);
      for (let w = waves.length - 1; w >= 0; w--) {
        if ((now - waves[w].born) / 1000 >= WAVE_DUR) waves.splice(w, 1);
      }
    }

    // Easing par point (alpha rapide / couleur lente) + tracé. Retourne le résidu.
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

    // Rend un point : couleur + lifts (EQ/vagues) + easing/tracé. Retourne le résidu.
    function renderDot(i: number, t: number, now: number, eqOn: boolean): number {
      const d = dots[i];
      const v = motion(d.nx, t);
      baseColor(d, t); // remplit le scratch `col`
      let tv = d.mask * v; // luminance de base (mode × blob)
      if (eqOn) tv += eqLiftAt(d, v); // EQ : lift + éventuel « pop » sur col
      if (waves.length) tv += waveLiftAt(d.nx, now); // vagues encodeur
      return commitDot(i, tv);
    }

    function draw(now: number): boolean {
      const dt = lastNow ? (now - lastNow) / 1000 : 0;
      lastNow = now;
      // reduce-motion : fige le temps -> motif statique (l'EQ reste réactif)
      const t = reduce ? 0 : ((now - startT) / 1000) * speed;
      fKA = snap ? 1 : 1 - Math.exp(-dt / TAU_A);
      fKC = snap ? 1 : 1 - Math.exp(-dt / TAU_C);
      fCap = brightness * (muted ? 0.28 : 1);
      fR0 = (dotRatio * cell) / 2;
      fPal = colors.length ? colors.map(rgb) : [[255, 255, 255]];

      const eqOn = !!pulses;
      const eMax = eqOn ? stepEnergy(dt) : 0; // EQ : ingestion + gravité
      if (rotation) stepWaves(now); // vagues encodeur : ingestion + vieillissement

      ctx!.clearRect(0, 0, cssW, cssH);
      let maxd = 0;
      for (let i = 0; i < dots.length; i++) {
        const resid = renderDot(i, t, now, eqOn);
        if (resid > maxd) maxd = resid;
      }

      snap = false;
      // Continue tant que : mode animé, énergie EQ active, ou transition en cours.
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

    // Démarre la boucle si besoin (elle s'auto-arrête une fois stabilisée).
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // plafonné : perf
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

    // Géométrie : reconstruit (changement NET, pas de fondu).
    $effect(() => {
      void cell;
      void falloff;
      if (cssW > 0) {
        build();
        run();
      }
    });

    // Apparence/mouvement : re-cible -> transition DOUCE via l'easing par point.
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

    // Impulsions EQ / rotation : réveille la boucle dès qu'un compteur bouge.
    // (Lecture réactive ; l'ingestion réelle se fait dans `draw`.)
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
