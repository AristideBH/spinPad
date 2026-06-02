<script lang="ts">
  import { Undo2, Redo2, Check, FlaskConical, Info } from '@lucide/svelte';
  import { configState, undo, redo, canUndo, canRedo } from '$shared/store/config.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { startPolling, stopPolling } from '$shared/store/deviceStatus.svelte.js';
  import { keyVisuals } from '$shared/store/keyVisuals.svelte.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { Spinner } from '$shared/components/ui/spinner';
  import * as Popover from '$shared/components/ui/popover/index.js';
  import DemoSettings from './DemoSettings.svelte';
  import { cn } from '$shared';
  import Badge from '$shared/components/ui/badge/badge.svelte';

  // Démarrer le polling du statut device quand connecté ou en mode démo.
  // Le store route automatiquement vers le bon transport (serial / http / mock).
  $effect(() => {
    //@ts-expect-error - Vite injecte la variable d'env à la compilation, elle n'existe pas à l'exécution
    const shouldPoll = serial.connected || devMode.active || import.meta.env.VITE_TRANSPORT === 'http';
    if (shouldPoll) {
      startPolling(5000);
      return () => stopPolling();
    }
  });

  $effect(() => {
    if (serial.connected || devMode.active) {
      keyVisuals.start();
      return () => keyVisuals.stop();
    }
  });

  const isOnline = $derived(serial.connected || devMode.active);
</script>

{#if isOnline}
  <!-- Undo / Redo -->
  <ButtonGroup.Root>
    <Button size="icon" variant="outline" onclick={undo} disabled={!canUndo()} title="Annuler (Ctrl+Z)">
      <Undo2 class="size-4" />
    </Button>
    <Button size="icon" variant="outline" onclick={redo} disabled={!canRedo()} title="Rétablir (Ctrl+Y)">
      <Redo2 class="size-4" />
    </Button>
  </ButtonGroup.Root>
  <div class="grow"></div>

  <!-- Auto-save indicator / Force save -->
  {#if configState.isDirty}
    <Badge variant="ghost" class="gap-1.5">
      <Spinner /> Sauvegarde
    </Badge>
  {:else}
    <Badge variant="ghost" class="gap-1.5 text-muted-foreground">
      <Check /> Sauvegardé
    </Badge>
  {/if}

  <!-- Dev mode toggle (visible dès que le mode démo est actif) -->
  {#if devMode.active}
    <Popover.Root>
      <Popover.Trigger class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
        <FlaskConical class="size-4" />
      </Popover.Trigger>
      <Popover.Content align="end" class="w-80">
        <DemoSettings />
      </Popover.Content>
    </Popover.Root>
  {/if}

  <Button size="icon" variant="outline" title="Aide & documentation" href="./docs/studio-mode/">
    <Info class="size-4" />
  </Button>
{/if}
