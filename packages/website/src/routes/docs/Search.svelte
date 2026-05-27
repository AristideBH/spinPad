<script lang="ts">
    import * as InputGroup from "$shared/components/ui/input-group/index.js";
    import * as Kbd from "$shared/components/ui/kbd/index.js";
    import SearchIcon from "@lucide/svelte/icons/search";
</script>

<div class="flex flex-col w-full gap-6 max-w-2xs ms-auto">
  <InputGroup.Root>
    <InputGroup.Input placeholder="Search..." />
    <InputGroup.Addon>
      <SearchIcon />
    </InputGroup.Addon>
    <InputGroup.Addon align="inline-end">
      <Kbd.Root>⌘</Kbd.Root>
      <Kbd.Root>K</Kbd.Root>
    </InputGroup.Addon>
  </InputGroup.Root>
</div>