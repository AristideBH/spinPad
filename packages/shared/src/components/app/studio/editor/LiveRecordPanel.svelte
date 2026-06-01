<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import {
    buildComboMacroSteps,
    eventModifierKeycodes,
    isModifierCode,
    keyEventToKeycode,
    type Keycode,
  } from '$shared/constants/keycodes.js';
  import type { MacroStep } from '$shared/constants/config-schema.js';
  import { createMacroFromSteps } from '$shared/store/config.svelte.js';
  import { KeyboardLayout } from '$shared/lib/hooks/keyboard-layout.svelte.js';
  import { Keyboard, Zap } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { getKeypadContext } from './keypad-context.svelte.js';

  const ctx = getKeypadContext();
  const layout = new KeyboardLayout();

  // ── Session de capture ────────────────────────────────────────
  let heldMods = $state<string[]>([]); // codes des modificateurs maintenus
  let nonModUsed = false; // une touche non-modificatrice a été pressée durant la session
  let unsupported = $state(false); // dernière touche non mappable
  let combo = $state<{ label: string; steps: MacroStep[] } | null>(null);

  const MOD_LABELS: Record<string, string> = {
    ControlLeft: 'Ctrl',
    ControlRight: 'Ctrl',
    ShiftLeft: 'Shift',
    ShiftRight: 'Shift',
    AltLeft: 'Alt',
    AltRight: 'Alt',
    MetaLeft: 'Gui',
    MetaRight: 'Gui',
  };

  /** Glyphe affiché pour la touche (suit la disposition hôte ; fallback label US). */
  function keyGlyph(e: KeyboardEvent, key: Keycode): string {
    return layout.label(e.code, key.label);
  }

  function comboLabel(mods: Keycode[], keyText: string): string {
    return [...mods.map((m) => m.label), keyText].join(' + ');
  }

  function onKeydown(e: KeyboardEvent) {
    // Escape : laisser passer pour fermer le picker (ne pas l'assigner).
    if (e.code === 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    if (combo) return; // en attente d'une décision macro → on ignore

    if (isModifierCode(e.code)) {
      if (!heldMods.includes(e.code)) heldMods = [...heldMods, e.code];
      return;
    }

    nonModUsed = true;
    unsupported = false;
    const key = keyEventToKeycode(e);
    if (!key) {
      unsupported = true;
      return;
    }
    const glyph = keyGlyph(e, key);
    const mods = eventModifierKeycodes(e);
    if (mods.length > 0) {
      combo = { label: comboLabel(mods, glyph), steps: buildComboMacroSteps(mods, key) };
    } else {
      toast.success(`Touche assignée : ${glyph}`);
      ctx.selectKeycode(key); // ferme le picker
    }
  }

  function onKeyup(e: KeyboardEvent) {
    e.preventDefault();
    if (combo) return;

    if (isModifierCode(e.code)) {
      heldMods = heldMods.filter((c) => c !== e.code);
      // Modificateur relâché seul (aucune touche pressée) → on l'assigne tel quel.
      if (heldMods.length === 0 && !nonModUsed) {
        const kc = keyEventToKeycode(e);
        if (kc) ctx.selectKeycode(kc);
      }
    }
    if (heldMods.length === 0) nonModUsed = false;
  }

  function confirmCombo() {
    if (!combo) return;
    const idx = createMacroFromSteps(combo.label, combo.steps);
    if (idx !== null) ctx.assignMacro(idx); // ferme le picker
    combo = null;
  }

  $effect(() => {
    window.addEventListener('keydown', onKeydown, true);
    window.addEventListener('keyup', onKeyup, true);
    return () => {
      window.removeEventListener('keydown', onKeydown, true);
      window.removeEventListener('keyup', onKeyup, true);
    };
  });
</script>

<div class="flex flex-col items-center justify-center gap-4 py-8 text-center">
  {#if combo}
    <Zap class="size-8 text-rose-400" />
    <div>
      <p class="font-mono text-lg font-semibold">{combo.label}</p>
      <p class="mt-1 text-sm text-muted-foreground">Combo détecté — une touche ne stocke qu'une action.</p>
    </div>
    <div class="flex gap-2">
      <Button onclick={confirmCombo} class="gap-1.5"><Zap class="size-4" /> Créer une macro</Button>
      <Button variant="outline" onclick={() => (combo = null)}>Annuler</Button>
    </div>
  {:else}
    <div class="record-cap" class:record-cap--armed={heldMods.length > 0}>
      <Keyboard class="size-7 text-muted-foreground" />
    </div>

    {#if heldMods.length > 0}
      <div class="flex gap-1">
        {#each heldMods as code (code)}
          <kbd class="px-2 py-0.5 text-xs font-semibold border rounded bg-muted">{MOD_LABELS[code] ?? code}</kbd>
        {/each}
      </div>
    {/if}

    {#if unsupported}
      <p class="text-sm text-destructive">Touche non supportée — utilise la liste.</p>
    {:else}
      <p class="text-sm text-muted-foreground">Appuie sur une touche de ton clavier pour l'assigner.</p>
    {/if}
  {/if}
</div>

<style>
  .record-cap {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: 12px;
    background-color: var(--card);
    box-shadow:
      0 4px 0 color-mix(in oklch, var(--card) 60%, var(--background)),
      inset 0 1px 0 rgba(255, 255, 255, 0.13),
      inset 0 -1px 0 rgba(0, 0, 0, 0.22);
    transition: box-shadow 100ms ease;
  }
  .record-cap--armed {
    box-shadow:
      0 4px 0 color-mix(in oklch, var(--card) 60%, var(--background)),
      0 0 0 2px var(--ring);
  }
</style>
