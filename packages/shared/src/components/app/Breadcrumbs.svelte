<script lang="ts">
  import { page } from "$app/state";
  import * as Breadcrumb from "$shared/components/ui/breadcrumb/index.js";
  import { safeCapitalize } from "$shared/utils";

  type BreadcrumbItem = {
    label: string;
    href: string;
  };

  const breadcrumbs = $derived.by<BreadcrumbItem[]>(() => {
    const routeId = page.route?.id ?? "";
    const segments =
      routeId.length > 0 ? routeId.substring(1).split("/").filter(Boolean) : [];
    const crumbs: BreadcrumbItem[] = [];
    let path = "";
    for (const segment of segments) {
      path += `/${segment}`;
      crumbs.push({ label: safeCapitalize(segment), href: path });
    }
    return crumbs;
  });
</script>

{#if breadcrumbs.length}
  <Breadcrumb.Root>
    <Breadcrumb.List>
      {#each breadcrumbs as item, i}
        <Breadcrumb.Item>
          {#if i === breadcrumbs.length - 1}
            <Breadcrumb.Page>
              {item.label}
            </Breadcrumb.Page>
          {:else}
            <Breadcrumb.Link href={item.href}>
              {item.label}
            </Breadcrumb.Link>
          {/if}
        </Breadcrumb.Item>
        {#if i < breadcrumbs.length - 1}
          <Breadcrumb.Separator />
        {/if}
      {/each}
    </Breadcrumb.List>
  </Breadcrumb.Root>
{/if}
