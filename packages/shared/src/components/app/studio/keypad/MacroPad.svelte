<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$shared/components/ui/dialog/index.js';
  import { action } from '$shared/constants/action-types.js';
  import {
    MACRO_MAX_PER_PROFILE,
    MACRO_MAX_STEPS,
    MACRO_STEP_TYPE,
    type MacroStep,
    type MacroStepType,
  } from '$shared/constants/config-schema.js';
  import { getKeycodeLabel } from '$shared/constants/keycodes.js';
  import { configState, updateConfig } from '$shared/store/config.svelte.js';

  let macroEditorOpen = $state(false);
  let editingMacroIdx = $state(0);
  let macroSteps = $state<MacroStep[]>([]);

  const macros = $derived<MacroStep[][]>(
    (configState.data?.profiles?.[configState.activeProfileIndex]?.macros ?? []) as MacroStep[][],
  );

  function openMacroEditor(idx: number) {
    editingMacroIdx = idx;
    macroSteps = structuredClone(macros[idx] ?? []);
    macroEditorOpen = true;
  }

  function saveMacro() {
    const pi = configState.activeProfileIndex;
    const updated = [...(macros ?? [])];
    while (updated.length <= editingMacroIdx) updated.push([]);
    updated[editingMacroIdx] = macroSteps.slice(0, MACRO_MAX_STEPS);
    while (updated.length > 0 && updated[updated.length - 1].length === 0) updated.pop();
    updateConfig(`profiles.${pi}.macros`, updated);
    macroEditorOpen = false;
  }

  function addMacroStep(type: MacroStepType) {
    if (macroSteps.length >= MACRO_MAX_STEPS) return;
    macroSteps = [
      ...macroSteps,
      type === MACRO_STEP_TYPE.DELAY_MS ? { type, delay: 50 } : { type, keycode: 0x04 },
    ];
  }

  function removeMacroStep(idx: number) {
    macroSteps = macroSteps.filter((_, i) => i !== idx);
  }

  function updateMacroStep(idx: number, patch: Partial<MacroStep>) {
    macroSteps = macroSteps.map((s, i) => (i === idx ? { ...s, ...patch } : s));
  }

  function macroStepLabel(s: MacroStep): string {
    if (s.type === MACRO_STEP_TYPE.KEY_DOWN) return `↓ ${getKeycodeLabel(s.keycode ?? 0)}`;
    if (s.type === MACRO_STEP_TYPE.KEY_UP) return `↑ ${getKeycodeLabel(s.keycode ?? 0)}`;
    return `⏱ ${s.delay ?? 0}ms`;
  }
</script>

<div class="mt-6">
  <div class="flex items-center justify-between mb-3">
    <h4 class="text-sm font-semibold">Macros</h4>
    <span class="text-xs text-muted-foreground">{macros.length}/{MACRO_MAX_PER_PROFILE} utilisées</span>
  </div>
  <div class="grid grid-cols-4 gap-1.5">
    {#each Array.from({ length: Math.min(macros.length + 1, MACRO_MAX_PER_PROFILE) }, (_, i) => i) as i}
      <button
        type="button"
        class="flex flex-col items-center gap-0.5 rounded-lg border border-border px-2 py-2 text-xs transition-colors hover:border-rose-500/60 hover:bg-rose-500/5"
        onclick={() => openMacroEditor(i)}
      >
        <span class="text-muted-foreground text-[10px]">M{i}</span>
        <span class="font-semibold">{macros[i]?.length ?? 0} étapes</span>
      </button>
    {/each}
  </div>
  <p class="mt-2 text-xs text-muted-foreground">
    Assigner une macro à une touche : choisir <span class="px-1 font-mono rounded bg-muted">Macro N</span> dans le sélecteur.
  </p>
</div>

<Dialog bind:open={macroEditorOpen}>
  <DialogContent class="max-w-md max-h-[80vh] flex flex-col">
    <DialogHeader>
      <DialogTitle>Macro {editingMacroIdx} — éditeur de séquence</DialogTitle>
    </DialogHeader>

    <div class="flex-1 pr-1 overflow-y-auto">
      {#if macroSteps.length === 0}
        <p class="py-4 text-xs text-center text-muted-foreground">Aucune étape. Ajoutez des actions ci-dessous.</p>
      {/if}
      <div class="flex flex-col gap-1 mb-3">
        {#each macroSteps as step, si}
          <div class="flex items-center gap-2 p-2 text-xs border rounded border-border">
            <span class="w-4 text-center text-muted-foreground">{si + 1}</span>
            <select
              class="bg-transparent border border-border rounded px-1 py-0.5 text-xs"
              value={step.type}
              onchange={(e: Event) =>
                updateMacroStep(si, { type: +(e.target as HTMLSelectElement).value as 0 | 1 | 2 })}
            >
              <option value={MACRO_STEP_TYPE.KEY_DOWN}>↓ Key Down</option>
              <option value={MACRO_STEP_TYPE.KEY_UP}>↑ Key Up</option>
              <option value={MACRO_STEP_TYPE.DELAY_MS}>⏱ Délai ms</option>
            </select>
            {#if step.type === MACRO_STEP_TYPE.DELAY_MS}
              <input
                type="number"
                min="1"
                max="1000"
                class="w-16 rounded border border-border bg-transparent px-1 py-0.5 text-xs text-right"
                value={step.delay ?? 50}
                onchange={(e: Event) =>
                  updateMacroStep(si, {
                    delay: Math.min(1000, Math.max(1, +(e.target as HTMLInputElement).value)),
                  })}
              />
              <span class="text-muted-foreground">ms</span>
            {:else}
              <input
                type="number"
                min="0"
                max="255"
                class="w-16 rounded border border-border bg-transparent px-1 py-0.5 text-xs text-right"
                value={step.keycode ?? 0}
                onchange={(e: Event) =>
                  updateMacroStep(si, { keycode: +(e.target as HTMLInputElement).value })}
              />
              <span class="flex-1 text-muted-foreground">{getKeycodeLabel(action(0, step.keycode ?? 0))}</span>
            {/if}
            <button
              type="button"
              class="ml-auto text-muted-foreground hover:text-destructive"
              onclick={() => removeMacroStep(si)}>✕</button
            >
          </div>
        {/each}
      </div>

      <div class="flex gap-1.5 flex-wrap">
        <button
          type="button"
          class="px-2 py-1 text-xs transition-colors border border-dashed rounded border-border hover:border-primary/60 hover:bg-accent"
          onclick={() => addMacroStep(MACRO_STEP_TYPE.KEY_DOWN)}
          disabled={macroSteps.length >= MACRO_MAX_STEPS}>+ Key Down</button
        >
        <button
          type="button"
          class="px-2 py-1 text-xs transition-colors border border-dashed rounded border-border hover:border-primary/60 hover:bg-accent"
          onclick={() => addMacroStep(MACRO_STEP_TYPE.KEY_UP)}
          disabled={macroSteps.length >= MACRO_MAX_STEPS}>+ Key Up</button
        >
        <button
          type="button"
          class="px-2 py-1 text-xs transition-colors border border-dashed rounded border-border hover:border-primary/60 hover:bg-accent"
          onclick={() => addMacroStep(MACRO_STEP_TYPE.DELAY_MS)}
          disabled={macroSteps.length >= MACRO_MAX_STEPS}>+ Délai</button
        >
      </div>
      <p class="mt-2 text-xs text-muted-foreground">
        {macroSteps.length}/{MACRO_MAX_STEPS} étapes
      </p>
    </div>

    <div class="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
      <Button variant="outline" size="sm" onclick={() => { macroEditorOpen = false; }}>Annuler</Button>
      <Button size="sm" onclick={saveMacro}>Enregistrer</Button>
    </div>
  </DialogContent>
</Dialog>
