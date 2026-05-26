<script lang="ts">
  import { page } from "$app/state";
  import * as Breadcrumb from "../ui/breadcrumb/index.js";
  import { safeCapitalize } from "../../utils";

  type BreadcrumbItem = {
    label: string;
    href: string;
  };

  let breadcrumbs = $state<BreadcrumbItem[]>();

  $effect(() => {
    const routeId = page.route && page.route.id ? page.route.id : "";
    const segments =
      routeId.length > 0 ? routeId.substring(1).split("/").filter(Boolean) : [];
    const crumbs: BreadcrumbItem[] = [];
    let path = "";
    for (const segment of segments) {
      path += `/${segment}`;
      crumbs.push({
        label: safeCapitalize(segment),
        href: path,
      });
    }
    breadcrumbs = crumbs;
  });
</script>

{#if breadcrumbs}
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
