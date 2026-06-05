<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  OptionControls.svelte — Rendu générique des options d'un widget
  //
  //  Construit les contrôles depuis le descriptif `options` du WidgetDef :
  //  bool → Switch, text → Input, icon → IconPreview + dialogue IconEditor.
  // ───────────────────────────────────────────────────────────────
  import { Switch } from '$shared/components/ui/switch/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import IconPreview from '$shared/components/app/profiles/IconPreview.svelte';
  import IconEditor from '$shared/components/app/profiles/IconEditor.svelte';
  import type { WidgetConfig } from '$shared/constants/config-schema.js';
  import type { WidgetOption } from '../widgets/index.js';

  interface Props {
    widget: WidgetConfig;
    options: WidgetOption[];
    onPatch: (patch: Partial<WidgetConfig>) => void;
    onClose?: () => void;
  }
  let { widget, options, onPatch, onClose }: Props = $props();

  function value(o: WidgetOption): unknown {
    return (widget as unknown as Record<string, unknown>)[o.key] ?? o.default;
  }
</script>

{#each options as o (o.key)}
  {@const off = o.disabled?.(widget) ?? false}
  {#if o.kind === 'bool'}
    <div class="flex items-center justify-between px-1.5 py-1">
      <span class="text-xs" data-disabled={off ? '' : undefined}>{o.label}</span>
      <Switch
        checked={Boolean(value(o))}
        disabled={off}
        onCheckedChange={(v: boolean) => { onPatch({ [o.key]: v } as Partial<WidgetConfig>); onClose?.(); }}
      />
    </div>
  {:else if o.kind === 'text'}
    <div class="flex flex-col gap-1.5 px-1.5 py-1.5">
      <span class="text-xs text-muted-foreground">{o.label}</span>
      <Input
        value={String(value(o) ?? '')}
        maxlength={o.max}
        disabled={off}
        class="text-xs h-7"
        onkeydown={(e: KeyboardEvent) => {
          e.stopPropagation();
          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
        }}
        onblur={() => onClose?.()}
        oninput={(e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          onPatch({ [o.key]: o.max ? v.slice(0, o.max) : v } as Partial<WidgetConfig>);
        }}
      />
    </div>
  {:else if o.kind === 'icon'}
    <div class="flex flex-col gap-1.5 px-1.5 py-1.5">
      <span class="text-xs text-muted-foreground">{o.label}</span>
      <Dialog.Root>
        <Dialog.Trigger
          class="flex items-center gap-2 rounded-md border border-border p-1.5 text-xs hover:border-primary/50"
        >
          <IconPreview value={String(value(o) ?? '')} size={32} class="shrink-0 bg-background/40" />
          <span>Choisir une icône…</span>
        </Dialog.Trigger>
        <Dialog.Content class="sm:max-w-fit">
          <Dialog.Header>
            <Dialog.Title>{o.label}</Dialog.Title>
            <Dialog.Description class="sr-only">Choisis ou dessine l'icône.</Dialog.Description>
          </Dialog.Header>
          <IconEditor
            value={String(value(o) ?? '')}
            onchange={(b64) => onPatch({ [o.key]: b64 } as Partial<WidgetConfig>)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </div>
  {/if}
{/each}
