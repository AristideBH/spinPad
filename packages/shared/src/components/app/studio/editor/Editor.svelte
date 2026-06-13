<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';
  import { createKeypadContext } from '../editor/keypad-context.svelte.js';
  import KeyGrid from '../editor/KeyGrid.svelte';
  import KeycodePicker from '../editor/keycode/KeycodePicker.svelte';
  import ProfileSwitcher from '../editor/profile/ProfileSwitcher.svelte';
  import Encoder from '../editor/encoder/Encoder.svelte';
  import LayerSwitcher from '../editor/LayerSwitcher.svelte';
  import { fly } from 'svelte/transition';

  const ctx = createKeypadContext();

  // Détection de retour à la ligne : on bascule le LayerSwitcher en onglets
  // horizontaux quand la colonne layer + le clavier ne tiennent plus côte à côte.
  //
  // On NE PRÉDIT PAS le wrap via les tailles intrinsèques (min/max-content) :
  // min-content sous-estime (clavier replié), max-content surestime (l'Encodeur
  // s'étire à des largeurs jamais rendues) et les deux divergent entre Chrome et
  // Firefox. À la place : PROBE synchrone. On impose la géométrie « côte à côte »
  // (colonne à sa largeur verticale, clavier au naturel) puis on demande au
  // navigateur si le clavier reste sur la même rangée -> on lit le wrap RÉEL du
  // moteur de rendu, identique dans tous les navigateurs.
  const LAYER_COL = 180; // largeur fixe de la colonne layer (vertical)
  // Hystérésis, exprimée comme un élargissement de la colonne sondée quand on
  // est déjà wrappé : pour dé-wrapper, le côte-à-côte doit tenir AVEC cette
  // marge. Absorbe le va-et-vient de scrollbar (~17px Chrome/Windows : wrap ->
  // plus haut -> scrollbar -> largeur chute). Firefox (overlay) n'a pas ce souci.
  const HYST = 32;

  let contentEl = $state<HTMLElement | null>(null);
  let layerEl = $state<HTMLElement | null>(null);
  let keypadEl = $state<HTMLElement | null>(null);
  let wrapped = $state(false);

  // Observe le conteneur, coalesce les rafales de resize sur un rAF. La fermeture
  // `measure` n'est pas réactive : lire `wrapped` dedans ne re-déclenche pas l'effet.
  $effect(() => {
    const content = contentEl;
    const layer = layerEl;
    const keypad = keypadEl;
    if (!content || !layer || !keypad) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      // Largeur de colonne sondée : +HYST quand déjà wrappé (marge anti-rebond).
      const probeW = `${wrapped ? LAYER_COL + HYST : LAYER_COL}px`;
      // Force la colonne à sa forme verticale (les classes Tailwind w-full /
      // max-w sont écrasées par le style inline le temps de la mesure), puis
      // lis si le clavier a basculé sous la colonne. Écriture/lecture/restau
      // synchrones -> aucune frame peinte entre -> pas de flash.
      const lw = layer.style.width;
      const lmw = layer.style.maxWidth;
      const lf = layer.style.flex;
      layer.style.width = probeW;
      layer.style.maxWidth = probeW;
      layer.style.flex = '0 0 auto';
      const stacked = keypad.getBoundingClientRect().top - layer.getBoundingClientRect().top > 1;
      layer.style.width = lw;
      layer.style.maxWidth = lmw;
      layer.style.flex = lf;
      if (stacked !== wrapped) wrapped = stacked; // n'écrit qu'au changement réel
    };
    const schedule = () => {
      raf ||= requestAnimationFrame(measure);
    };

    const obs = new ResizeObserver(schedule);
    obs.observe(content);
    schedule();
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  });

  // Bridge training : SWn pressé sur device → ouvre le picker correspondant.
  $effect(() => {
    const target = trainingMode.requestedTarget;
    if (!target) return;
    trainingMode.requestedTarget = null;
    if (target.kind === 'key') ctx.openKeyPicker(target.idx);
    else ctx.openEncoderPicker(`encoder_${target.field}`);
  });
</script>

<Card.Root size="sm" class="gap-y-5!">
  <div transition:fly={{ y: 50, duration: 350, delay: 220 }} class="relative">
    <Card.Header class="flex items-start gap-1.5">
      <ProfileSwitcher />
    </Card.Header>
  </div>

  <!-- Editor -->
  <div transition:fly={{ y: 20, duration: 600, delay: 350 }} class="relative">
    <Card.Content bind:ref={contentEl} class="flex flex-wrap items-start justify-start gap-x-4 gap-y-1">
      {#if ctx.layer}
        <div bind:this={layerEl} class={wrapped ? 'w-full' : 'grow min-w-[180px] max-w-[180px]'}>
          <LayerSwitcher orientation={wrapped ? 'horizontal' : 'vertical'} />
        </div>

        <div bind:this={keypadEl} class="flex flex-wrap gap-12 p-6 border justify-evenly grow rounded-2xl">
          <KeyGrid />
          <Encoder />
        </div>
      {/if}
    </Card.Content>
  </div>
</Card.Root>

<!-- Keycode Picker (two-stage : menu → live-record / liste) -->
<KeycodePicker />
