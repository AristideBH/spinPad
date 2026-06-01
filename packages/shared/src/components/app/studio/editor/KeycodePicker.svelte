<script lang="ts">
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import * as Drawer from '$shared/components/ui/drawer/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { IsMobile } from '$shared/store/is-mobile.svelte.js';
  import { HasFinePointer } from '$shared/lib/hooks/pointer.svelte.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import KeycodeList from './KeycodeList.svelte';
  import LiveRecordPanel from './LiveRecordPanel.svelte';
  import { Activity, ArrowLeft, List } from '@lucide/svelte';
  import { fly } from 'svelte/transition';

  const ctx = getKeypadContext();
  const isMobile = new IsMobile();
  const finePointer = new HasFinePointer();

  const subtitle = $derived(
    [ctx.profile?.name, ctx.layer?.name].filter(Boolean).join(' · '),
  );
</script>

{#snippet header()}
  <div class="flex items-center gap-2 pr-8 shrink-0">
    {#if ctx.pickerStage !== 'menu'}
      <Button variant="ghost" size="icon-sm" onclick={() => ctx.setStage('menu')} title="Retour">
        <ArrowLeft class="size-4" />
      </Button>
    {/if}
    <div class="min-w-0 text-left">
      <p class="font-mono text-sm font-semibold truncate">{ctx.editTargetLabel}</p>
      {#if subtitle}<p class="text-xs truncate text-muted-foreground">{subtitle}</p>{/if}
    </div>
  </div>
{/snippet}

{#snippet menu()}
  <Item.Group class="gap-2">
    <Item.Root variant="outline">
      {#snippet child({ props })}
        <button
          {...props}
          class={[props.class as string, 'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'].join(' ')}
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

    <Item.Root variant="outline">
      {#snippet child({ props })}
        <button {...props} class={[props.class as string, 'cursor-pointer'].join(' ')} onclick={() => ctx.setStage('list')}>
          <Item.Media variant="icon"><List class="size-5" /></Item.Media>
          <Item.Content>
            <Item.Title>Parcourir la liste</Item.Title>
            <Item.Description>Recherche et catégories de keycodes.</Item.Description>
          </Item.Content>
        </button>
      {/snippet}
    </Item.Root>
  </Item.Group>
{/snippet}

{#snippet body()}
  <div class="flex flex-col min-h-0 gap-3 p-4">
    {@render header()}
    <div class="relative flex flex-col flex-1 min-h-0">
      {#key ctx.pickerStage}
        <div
          class="flex flex-col flex-1 min-h-0"
          in:fly={{ x: ctx.pickerStage === 'menu' ? -16 : 16, duration: 150 }}
        >
          {#if ctx.pickerStage === 'menu'}
            {@render menu()}
          {:else if ctx.pickerStage === 'record'}
            <LiveRecordPanel />
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
    </Drawer.Content>
  </Drawer.Root>
{:else}
  <Dialog.Root bind:open={ctx.pickerOpen}>
    <Dialog.Content class="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
      <Dialog.Title class="sr-only">{ctx.editTargetLabel}</Dialog.Title>
      {@render body()}
    </Dialog.Content>
  </Dialog.Root>
{/if}
