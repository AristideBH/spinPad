<script lang="ts">
  import { getDocsTree, type DocTreeNode } from '$lib/docs';
  import * as Item from '$shared/components/ui/item/index.js';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  const tree = getDocsTree();
</script>

<svelte:head>
    <title>Documentation: SpinPad</title>
</svelte:head>

<!-- Recursive: folders become section titles, docs become Item rows. -->
{#snippet section(items: DocTreeNode[], depth: number)}
  {@const docs = items.filter((n) => n.type === 'doc')}
  {@const folders = items.filter((n) => n.type === 'folder')}

  {#if docs.length > 0}
    <Item.Group>
      {#each docs as node (node.type === 'doc' ? node.entry.slug : '')}
        {#if node.type === 'doc'}
          <Item.Root variant="outline">
            {#snippet child({ props })}
              <a href={node.entry.url} {...props}>
                <Item.Media variant="icon">
                  <FileTextIcon class="size-5 text-muted-foreground" />
                </Item.Media>
                <Item.Content>
                  <Item.Title>{node.entry.title}</Item.Title>
                  {#if node.entry.description}
                    <Item.Description>{node.entry.description}</Item.Description>
                  {/if}
                </Item.Content>
                <Item.Actions>
                  <ChevronRightIcon
                    class="size-4 text-muted-foreground transition-transform group-hover/item:translate-x-0.5"
                  />
                </Item.Actions>
              </a>
            {/snippet}
          </Item.Root>
        {/if}
      {/each}
    </Item.Group>
  {/if}

  {#each folders as node (node.type === 'folder' ? node.path : '')}
    {#if node.type === 'folder'}
      <h2
        class="mt-10 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground"
        style="padding-left: {depth * 0.75}rem"
      >
        {node.label}
      </h2>
      {@render section(node.children, depth + 1)}
    {/if}
  {/each}
{/snippet}

<div class="max-w-3xl px-4 py-12 mx-auto">
    <h1 class="mb-2 text-3xl font-bold">Documentation</h1>
    <p class="mb-10 text-muted-foreground">Everything you need to know to configure and customize your SpinPad.</p>

    {#if tree.length > 0}
        {@render section(tree, 0)}
    {:else}
        <p class="text-muted-foreground">No documentation pages yet.</p>
    {/if}
</div>
