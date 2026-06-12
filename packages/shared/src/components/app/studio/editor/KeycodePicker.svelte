<script lang="ts">
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import * as Drawer from '$shared/components/ui/drawer/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Kbd } from '$shared/components/ui/kbd/index.js';
  import { IsMobile } from '$shared/store/is-mobile.svelte.js';
  import { HasFinePointer } from '$shared/lib/hooks/pointer.svelte.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import KeycodeList from './KeycodeList.svelte';
  import LiveRecordPanel from './LiveRecordPanel.svelte';
  import KeyLedPicker from './KeyLedPicker.svelte';
  import { Activity, ArrowLeft, Lightbulb, List } from '@lucide/svelte';
  import { fly } from 'svelte/transition';

  const ctx = getKeypadContext();
  const isMobile = new IsMobile();
  const finePointer = new HasFinePointer();

  const subtitle = $derived([ctx.profile?.name, ctx.layer?.name].filter(Boolean).join(' · '));
</script>

{#snippet header()}
  <div class="flex items-center gap-2 px-4 py-3 border-b">
    {#if ctx.pickerStage !== 'menu'}
      <Button variant="ghost" size="icon-sm" onclick={() => ctx.setStage('menu')} title="Retour">
        <ArrowLeft class="size-4" />
      </Button>
    {/if}
    <div class="min-w-0 text-left">
      <p class="flex items-center gap-1.5 font-mono text-sm font-semibold truncate">
        <span class="truncate">{ctx.editTargetSw}</span>
        {#if ctx.editTargetCurrent}
          <span class="text-muted-foreground" aria-hidden="true">·</span>
          <Kbd class="shrink-0">{ctx.editTargetCurrent}</Kbd>
        {/if}
      </p>
      {#if subtitle}<p class="text-xs truncate text-muted-foreground">{subtitle}</p>{/if}
    </div>
  </div>
{/snippet}

{#snippet menu()}
  <Item.Group class="grid gap-2 sm:grid-cols-2">
    <Item.Root variant="outline" class="hover:bg-muted/50">
      {#snippet child({ props })}
        <button
          {...props}
          class={[
            props.class as string,
            'cursor-pointer flex-col items-start text-left disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
          disabled={!finePointer.current}
          onclick={() => ctx.setStage('record')}
        >
          <Item.Media variant="icon"><Activity class="size-5" /></Item.Media>
          <Item.Content>
            <Item.Title>Enregistrer en direct</Item.Title>
            <Item.Description>
              {finePointer.current
                ? 'Appuie sur une touche de ton clavier physique.'
                : 'Nécessite un clavier physique.'}
            </Item.Description>
          </Item.Content>
        </button>
      {/snippet}
    </Item.Root>

    <Item.Root variant="outline" class="hover:bg-muted/50">
      {#snippet child({ props })}
        <button
          {...props}
          class={[props.class as string, 'cursor-pointer flex-col items-start text-left'].join(' ')}
          onclick={() => ctx.setStage('list')}
        >
          <Item.Media variant="icon"><List class="size-5" /></Item.Media>
          <Item.Content>
            <Item.Title>Parcourir la liste</Item.Title>
            <Item.Description>Recherche et catégories de keycodes.</Item.Description>
          </Item.Content>
        </button>
      {/snippet}
    </Item.Root>

    <!-- Option LED : seulement pour les touches (pas l'encodeur) -->
    {#if ctx.editingField === 'key'}
      {@const ki = ctx.editingKey}
      {@const kled = ki !== null ? (ctx.layer?.key_leds?.[ki] ?? null) : null}
      {@const hasLed = kled !== null && kled.effect !== 'off'}
      <Item.Root variant="outline" class="hover:bg-muted/50 sm:col-span-2">
        {#snippet child({ props })}
          <button
            {...props}
            class={[props.class as string, 'cursor-pointer flex-col items-start text-left'].join(' ')}
            onclick={() => ctx.setStage('led')}
          >
            <Item.Media variant="icon">
              {#if hasLed}
                <span
                  class="rounded-full size-5 ring-1 ring-white/20"
                  style="background:rgb({kled!.r},{kled!.g},{kled!.b});box-shadow:0 0 8px 2px rgb({kled!.r},{kled!
                    .g},{kled!.b})"
                ></span>
              {:else}
                <Lightbulb class="opacity-50 size-5" />
              {/if}
            </Item.Media>
            <Item.Content>
              <Item.Title>Couleur LED</Item.Title>
              <Item.Description>
                {#if hasLed}
                  {kled!.effect} · #{[kled!.r, kled!.g, kled!.b].map((v) => v.toString(16).padStart(2, '0')).join('')}
                {:else}
                  Override la couleur de cette touche.
                {/if}
              </Item.Description>
            </Item.Content>
          </button>
        {/snippet}
      </Item.Root>
    {/if}
  </Item.Group>
{/snippet}

{#snippet body()}
  <div class="flex flex-col min-h-0 gap-0 p-0">
    {@render header()}
    <div class="relative flex flex-col flex-1 min-h-0 p-4">
      {#key ctx.pickerStage}
        <div class="flex flex-col flex-1 min-h-0" in:fly={{ x: ctx.pickerStage === 'menu' ? -16 : 16, duration: 150 }}>
          {#if ctx.pickerStage === 'menu'}
            {@render menu()}
          {:else if ctx.pickerStage === 'record'}
            <LiveRecordPanel />
          {:else if ctx.pickerStage === 'led'}
            <KeyLedPicker />
          {:else}
            <KeycodeList />
          {/if}
        </div>
      {/key}
    </div>
  </div>
{/snippet}

{#if isMobile.current}
  <Drawer.Root bind:open={ctx.pickerOpen}>
    <Drawer.Content class="max-h-[85vh]">
      <Drawer.Title class="sr-only">{ctx.editTargetLabel}</Drawer.Title>
      {@render body()}
      <Drawer.Footer></Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{:else}
  <Dialog.Root bind:open={ctx.pickerOpen}>
    <Dialog.Content class="sm:max-w-lg max-h-[85dvh] flex flex-col p-0 gap-0">
      <Dialog.Title class="sr-only">{ctx.editTargetLabel}</Dialog.Title>
      {@render body()}
    </Dialog.Content>
  </Dialog.Root>
{/if}
