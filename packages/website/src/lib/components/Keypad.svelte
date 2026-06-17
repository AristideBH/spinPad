<script lang="ts">
  // Presentational rendering of the SpinPad keypad — reuses the Studio keycap
  // language (KeyGrid.svelte): --card surface, 4px top-light relief, gloss,
  // 2u keys (SW1 wide, SW10 tall), layer chips. Static, not editable.
  // Animation: a cyan LED sweep runs across the keys in sequence + the encoder
  // dial turns slowly. All neutralized under prefers-reduced-motion.
  interface Key {
    sw: string;
    label: string;
    cls: string; // grid placement
    order: number; // rank in the LED sweep
    alt?: boolean; // 2u key (--muted surface)
    dots?: string[]; // layer color chips (top-right)
  }

  const keys: Key[] = [
    { sw: 'SW8', label: 'C', cls: 'col-start-1 row-start-1', order: 0, dots: ['bg-spinpad'] },
    { sw: 'SW1', label: 'MO(1)', cls: 'col-start-2 col-span-2 row-start-1', order: 1, alt: true },
    { sw: 'SW9', label: 'Z', cls: 'col-start-1 row-start-2', order: 2 },
    { sw: 'SW7', label: 'X', cls: 'col-start-2 row-start-2', order: 3, dots: ['bg-amber-400'] },
    { sw: 'SW2', label: 'V', cls: 'col-start-3 row-start-2', order: 4 },
    { sw: 'SW10', label: 'TG(2)', cls: 'col-start-1 row-start-3 row-span-2', order: 5, alt: true },
    { sw: 'SW6', label: 'L-Shift', cls: 'col-start-2 row-start-3', order: 6 },
    { sw: 'SW3', label: 'L-Ctrl', cls: 'col-start-3 row-start-3', order: 7, dots: ['bg-spinpad', 'bg-amber-400'] },
    { sw: 'SW5', label: 'Space', cls: 'col-start-2 row-start-4', order: 8 },
    { sw: 'SW4', label: 'L-GUI', cls: 'col-start-3 row-start-4', order: 9 },
  ];
</script>

<div
  class="keypad-wrap"
  role="img"
  aria-label="SpinPad layout: 10 programmable keys and a rotary encoder"
>
  <div class="keypad">
    {#each keys as k (k.sw)}
      <div class="keycap {k.cls}" class:keycap--alt={k.alt} style="--order: {k.order}">
        {#if k.dots}
          <span class="keycap-dots">
            {#each k.dots as d (d)}
              <span class="keycap-dot {d}"></span>
            {/each}
          </span>
        {/if}
        <span class="keycap-sw">{k.sw}</span>
        <span class="keycap-label">{k.label}</span>
        {#if k.alt}<span class="keycap-2u">2u</span>{/if}
      </div>
    {/each}
  </div>

  <!-- Encoder: Studio-style glossy knob, rotating dial -->
  <div class="knob-col">
    <div class="knob" aria-hidden="true">
      <div class="knob-dial"><span class="knob-tick"></span></div>
    </div>
    <span class="knob-label">Encoder</span>
  </div>
</div>

<style>
  .keypad-wrap {
    display: flex;
    align-items: center;
    gap: clamp(1.25rem, 4vw, 2.5rem);
    --cell: clamp(54px, 7vw, 78px);
    --gap: 12px;
    --keycap-side: color-mix(in oklch, var(--card) 60%, var(--background));
  }

  .keypad {
    display: grid;
    grid-template-columns: repeat(3, var(--cell));
    grid-template-rows: repeat(4, var(--cell));
    gap: var(--gap);
    filter: drop-shadow(0 8px 5px color-mix(in oklch, var(--background) 5%, transparent))
      drop-shadow(0 1px 0.75px var(--background));
  }

  .keycap {
    position: relative;
    border-radius: 10px;
    background-color: var(--card);
    box-shadow:
      0 4px 0 var(--keycap-side),
      inset 0 1px 0 rgba(255, 255, 255, 0.13),
      inset 0 -1px 0 rgba(0, 0, 0, 0.22);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    overflow: hidden;
    transition: transform 120ms ease-out;
  }
  /* Keycap gloss */
  .keycap::after {
    content: '';
    position: absolute;
    inset: 5px;
    border-radius: 500px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(0, 0, 0, 0.17) 100%);
    pointer-events: none;
  }
  /* Cyan LED halo — opacity animated in sequence (cf. Studio's .keycap-pulse) */
  .keycap::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      circle at 50% 50%,
      color-mix(in oklch, var(--color-spinpad) 55%, transparent) 0%,
      transparent 70%
    );
    opacity: 0;
    pointer-events: none;
  }
  .keycap--alt {
    background-color: var(--muted);
  }

  .keypad-wrap:hover .keycap {
    transform: translateY(-1px);
  }

  .keycap-sw {
    font-size: 8px;
    line-height: 1;
    color: var(--muted-foreground);
  }
  .keycap-label {
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    color: var(--foreground);
  }
  .keycap-2u {
    position: absolute;
    bottom: 4px;
    font-size: 7px;
    color: color-mix(in oklch, var(--muted-foreground) 50%, transparent);
  }
  .keycap-dots {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .keycap-dot {
    width: 4px;
    height: 4px;
    border-radius: 9999px;
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--background) 60%, transparent);
  }

  .knob-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
  }
  .knob {
    width: clamp(96px, 13vw, 148px);
    height: clamp(96px, 13vw, 148px);
    border-radius: 50%;
    background: radial-gradient(circle at 36% 30%, #ffffff 0%, #e4e4e7 38%, #b9bcc2 72%, #8e9196 100%);
    box-shadow:
      inset 0 2px 3px rgba(255, 255, 255, 0.9),
      inset 0 -6px 12px rgba(0, 0, 0, 0.28),
      0 10px 30px rgba(0, 0, 0, 0.45),
      0 0 0 1px color-mix(in oklch, var(--color-spinpad) 35%, transparent),
      0 0 28px color-mix(in oklch, var(--color-spinpad) 22%, transparent);
    position: relative;
  }
  /* Rotating dial: carries a marker that materializes the encoder's rotation */
  .knob-dial {
    position: absolute;
    inset: 0;
    border-radius: 50%;
  }
  .knob-tick {
    position: absolute;
    top: 8%;
    left: 50%;
    width: 3px;
    height: 16%;
    border-radius: 2px;
    background: color-mix(in oklch, var(--color-spinpad-dark) 80%, #000);
    transform: translateX(-50%);
    opacity: 0.55;
  }
  /* Glossy central cap */
  .knob::after {
    content: '';
    position: absolute;
    inset: 30%;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0.06) 70%);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
    z-index: 1;
  }
  .knob-label {
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    color: var(--muted-foreground);
  }

  /* ── Motion (neutralized under prefers-reduced-motion) ── */
  @media (prefers-reduced-motion: no-preference) {
    .keycap::before {
      /* 10 keys × 0.32s = sweep, then pause → 5s cycle */
      animation: led-scan 5s ease-in-out infinite;
      animation-delay: calc(var(--order) * 0.32s);
    }
    .knob-dial {
      animation: knob-spin 14s linear infinite;
    }
  }
  @keyframes led-scan {
    0%,
    6%,
    100% {
      opacity: 0;
    }
    2% {
      opacity: 0.9;
    }
  }
  @keyframes knob-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 480px) {
    .keypad-wrap {
      flex-direction: column;
    }
  }
</style>
