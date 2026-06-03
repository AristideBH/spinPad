<script lang="ts">
  // Aperçu des effets LED WS2812 du SpinPad. Chaque carte rend une bande de 10
  // LEDs animée selon l'effet. Le cyan de marque sert de base ; Hyperion affiche
  // le spectre RGB réel (c'est l'effet arc-en-ciel — couleurs justifiées par le
  // contenu, pas une entorse au verrou d'accent). Figé sous prefers-reduced-motion.
  const effects = [
    { id: 'solid', name: 'Solid', desc: 'Couleur fixe par touche.' },
    { id: 'breathe', name: 'Breathe', desc: 'Respiration douce de toute la chaîne.' },
    { id: 'reactive', name: 'Reactive', desc: "S'allume à la frappe, puis s'estompe." },
    { id: 'mirror', name: 'Mirror', desc: 'Onde symétrique depuis le centre.' },
    { id: 'hyperion', name: 'Hyperion', desc: 'Cycle arc-en-ciel sur la chaîne.' },
  ];
  const leds = Array.from({ length: 10 }, (_, i) => i);
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
  {#each effects as fx (fx.id)}
    <div class="reveal flex flex-col gap-4 p-5 border rounded-2xl border-border/60 bg-card">
      <div class="strip strip--{fx.id}">
        {#each leds as n (n)}
          <span class="led" style="--n: {n}"></span>
        {/each}
      </div>
      <div>
        <h3 class="font-display text-base font-medium tracking-tight text-foreground">{fx.name}</h3>
        <p class="mt-1 text-xs leading-relaxed text-muted-foreground">{fx.desc}</p>
      </div>
    </div>
  {/each}
</div>

<style>
  .strip {
    display: flex;
    gap: 5px;
    padding: 12px;
    border-radius: 12px;
    background: color-mix(in oklch, var(--background) 70%, #000);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  .led {
    flex: 1;
    aspect-ratio: 1;
    border-radius: 9999px;
    /* État de base (statique / reduced-motion) : faible lueur cyan */
    background: color-mix(in oklch, var(--color-spinpad) 35%, transparent);
    box-shadow: 0 0 4px color-mix(in oklch, var(--color-spinpad) 30%, transparent);
  }

  /* Solid : chaîne pleinement allumée */
  .strip--solid .led {
    background: var(--color-spinpad);
    box-shadow: 0 0 8px color-mix(in oklch, var(--color-spinpad) 70%, transparent);
  }

  /* Hyperion : teinte par LED, base statique déjà colorée */
  .strip--hyperion .led {
    background: hsl(calc(var(--n) * 36) 90% 60%);
    box-shadow: 0 0 8px hsl(calc(var(--n) * 36) 90% 60% / 0.6);
  }

  @media (prefers-reduced-motion: no-preference) {
    .strip--breathe .led {
      animation: led-breathe 2.8s ease-in-out infinite;
    }
    .strip--reactive .led {
      animation: led-react 2.4s ease-out infinite;
      animation-delay: calc(var(--n) * 0.18s);
    }
    .strip--mirror .led {
      /* délai = distance au centre (4.5) → onde symétrique */
      animation: led-on 1.8s ease-in-out infinite;
      animation-delay: calc((4.5 - var(--n)) * 0.12s * var(--dir, 1));
    }
    /* abs() approximée via deux moitiés */
    .strip--mirror .led:nth-child(-n + 5) {
      animation-delay: calc((5 - var(--n)) * 0.12s);
    }
    .strip--mirror .led:nth-child(n + 6) {
      animation-delay: calc((var(--n) - 4) * 0.12s);
    }
    .strip--hyperion {
      animation: hue-cycle 3.6s linear infinite;
    }
  }

  @keyframes led-breathe {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
      box-shadow: 0 0 9px color-mix(in oklch, var(--color-spinpad) 75%, transparent);
    }
  }
  @keyframes led-react {
    0%,
    70%,
    100% {
      background: color-mix(in oklch, var(--color-spinpad) 22%, transparent);
      box-shadow: 0 0 3px color-mix(in oklch, var(--color-spinpad) 20%, transparent);
    }
    8% {
      background: var(--color-spinpad);
      box-shadow: 0 0 10px color-mix(in oklch, var(--color-spinpad) 85%, transparent);
    }
  }
  @keyframes led-on {
    0%,
    100% {
      background: color-mix(in oklch, var(--color-spinpad) 22%, transparent);
      box-shadow: 0 0 3px color-mix(in oklch, var(--color-spinpad) 20%, transparent);
    }
    50% {
      background: var(--color-spinpad);
      box-shadow: 0 0 10px color-mix(in oklch, var(--color-spinpad) 85%, transparent);
    }
  }
  @keyframes hue-cycle {
    to {
      filter: hue-rotate(360deg);
    }
  }
</style>
