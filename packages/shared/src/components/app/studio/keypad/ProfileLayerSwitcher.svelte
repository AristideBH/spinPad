<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$shared/components/ui/select/index.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { getKeypadContext } from './keypad-context.svelte.js';

  const ctx = getKeypadContext();

  let profileValue = $state(String(configState.activeProfileIndex));
  let layerValue = $state(String(configState.activeLayerIndex));

  // Sync profile selector → store; reset layer whenever profile changes
  $effect(() => {
    configState.activeProfileIndex = +profileValue;
    layerValue = '0';
    configState.activeLayerIndex = 0;
  });

  // Sync layer selector → store
  $effect(() => {
    configState.activeLayerIndex = +layerValue;
  });
</script>

<div class="flex flex-col gap-1.5">
  <Label>Profil</Label>
  <Select type="single" bind:value={profileValue}>
    <SelectTrigger class="w-40">{ctx.profile?.name ?? 'Profil'}</SelectTrigger>
    <SelectContent>
      {#each configState.data?.profiles ?? [] as prof, i}
        <SelectItem value={String(i)} label={prof.name} />
      {/each}
    </SelectContent>
  </Select>
</div>

{#if ctx.profile}
  <div class="flex flex-col gap-1.5">
    <Label>Layer</Label>
    <Select type="single" bind:value={layerValue}>
      <SelectTrigger class="w-36">{ctx.layer?.name ?? 'Layer'}</SelectTrigger>
      <SelectContent>
        {#each ctx.profile.layers as l, i}
          <SelectItem value={String(i)} label={l.name} />
        {/each}
      </SelectContent>
    </Select>
  </div>
{/if}
