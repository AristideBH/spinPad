<script lang="ts">
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as Card from '$shared/components/ui/card/index.js';
  import { configState, exportProfiles, importProfiles } from '$shared/store/config.svelte.js';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';
  import { Download, Plus, Share, Upload } from '@lucide/svelte';
  import { createKeypadContext } from '../editor/keypad-context.svelte.js';
  import KeyGrid from '../editor/KeyGrid.svelte';
  import KeycodePicker from '../editor/KeycodePicker.svelte';
  import ProfileSwitcher from '../editor/ProfileSwitcher.svelte';
  import Encoder from '../editor/Encoder.svelte';
  import LayerSwitcher from '../editor/LayerSwitcher.svelte';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import { toast } from 'svelte-sonner';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { fly } from 'svelte/transition';

  const ctx = createKeypadContext();

  // Détection de retour à la ligne : on bascule le LayerSwitcher en onglets
  // horizontaux quand la colonne layer + le bloc clavier ne tiennent plus côte
  // à côte. La décision se base sur la largeur du conteneur vs une exigence
  // FIXE (colonne layer + gap + largeur min du clavier), JAMAIS sur la
  // géométrie post-bascule (offsetTop) : sinon `wrapped` se verrouille — passer
  // en w-full pousse toujours le clavier dessous, et on ne « dé-wrap » jamais.
  const LAYER_COL = 180; // max-w de la colonne layer en mode vertical
  const GAP = 16; // gap-4 entre colonne et clavier

  let contentEl = $state<HTMLElement | null>(null);
  let keypadEl = $state<HTMLElement | null>(null);
  let wrapped = $state(false);

  // Largeur min-content du bloc clavier (taille quasi constante) : mesurée via
  // une passe `width:min-content` ponctuelle, indépendante de l'état de wrap.
  let keypadMin = $state(0);
  $effect(() => {
    if (!keypadEl) return;
    const el = keypadEl;
    const prev = el.style.width;
    el.style.width = 'min-content';
    keypadMin = el.getBoundingClientRect().width;
    el.style.width = prev;
  });

  $effect(() => {
    if (!contentEl) return;
    const min = keypadMin; // dépendance réactive : recalcule quand mesuré
    const measure = () => {
      const cs = getComputedStyle(contentEl!);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const inner = contentEl!.clientWidth - padX;
      if (min > 0) wrapped = inner < LAYER_COL + GAP + min;
    };
    const obs = new ResizeObserver(measure);
    obs.observe(contentEl);
    measure();
    return () => obs.disconnect();
  });

  // Bridge training : SWn pressé sur device → ouvre le picker correspondant.
  $effect(() => {
    const target = trainingMode.requestedTarget;
    if (!target) return;
    trainingMode.requestedTarget = null;
    if (target.kind === 'key') ctx.openKeyPicker(target.idx);
    else ctx.openEncoderPicker(`encoder_${target.field}`);
  });

  let fileInput = $state<HTMLInputElement | null>(null);
  let selectedExport = $state<Set<number>>(new Set());
  let dialogOpen = $state(false);

  const profileList = $derived(configState.data?.profiles ?? []);
  const allSelected = $derived(profileList.length > 0 && selectedExport.size === profileList.length);

  function toggleSelect(i: number) {
    const next = new Set(selectedExport);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    selectedExport = next;
  }

  function toggleAll() {
    selectedExport = allSelected ? new Set() : new Set(profileList.map((_, i) => i));
  }

  function onImportClick() {
    fileInput?.click();
  }

  async function onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importProfiles(file);
      dialogOpen = false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[import-profiles]', msg);
      toast.error('Import échoué', { description: msg });
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function onExportClick() {
    if (selectedExport.size === 0) return;
    exportProfiles([...selectedExport].sort((a, b) => a - b));
  }
</script>

<Card.Root size="sm" class="gap-y-6!">
  <Card.Header class="flex items-start gap-1.5">
    <ProfileSwitcher />
  </Card.Header>

  <!-- Editor -->
  <div transition:fly={{ y: 20, duration: 350, delay: 200 }} class="relative">
    <Card.Content bind:ref={contentEl} class="flex flex-wrap items-start justify-start gap-x-4 gap-y-1">
      {#if ctx.layer}
        <div class={wrapped ? 'w-full' : 'grow min-w-[180px] max-w-[178px]'}>
          <LayerSwitcher orientation={wrapped ? 'horizontal' : 'vertical'} />
        </div>

        <div bind:this={keypadEl} class="flex flex-wrap gap-12 p-6 border grow rounded-2xl justify-evenly">
          <KeyGrid />
          <Encoder />
        </div>
      {/if}
    </Card.Content>
  </div>
</Card.Root>

<!-- Keycode Picker (two-stage : menu → live-record / liste) -->
<KeycodePicker />
