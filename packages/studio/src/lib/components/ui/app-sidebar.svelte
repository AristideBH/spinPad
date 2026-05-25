<script lang="ts" module>
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
  import SendIcon from "@lucide/svelte/icons/send";

  const data = {
    user: {
      name: "AristideBH",
      email: "aristide.bruneau@gmail.com",
      avatar:
        "https://lh3.googleusercontent.com/ogw/AF2bZygWD1VnCuSLoYoJgUw9D81WnItSm2tUzgU2KF3NvbXNIOuV=s32-c-mo",
    },
    navMain: [
      {
        title: "Documentation",
        url: "/docs",
        icon: BookOpenIcon,
        isActive: false,
        items: [
          { title: "Introduction",  url: "/docs" },
          { title: "Get Started",   url: "/docs/get-started" },
          { title: "Keymap",        url: "/docs/keymap" },
          { title: "Changelog",     url: "/docs/changelog" },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoyIcon,
      },
      {
        title: "Feedback",
        url: "#",
        icon: SendIcon,
      },
    ],
  };
</script>

<script lang="ts">
  import NavMain from "./nav-main.svelte";
  import NavSecondary from "./nav-secondary.svelte";
  import NavUser from "./nav-user.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import CommandIcon from "@lucide/svelte/icons/command";
  import type { ComponentProps } from "svelte";

  let {
    ref = $bindable(null),
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href="/" {...props}>
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <CommandIcon class="size-4" />
              </div>
              <div class="grid flex-1 text-start text-sm leading-tight">
                <span class="truncate font-medium">SpinPad</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain items={data.navMain} />
    <NavSecondary items={data.navSecondary} class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser user={data.user} />
  </Sidebar.Footer>
  <Sidebar.Rail class="my-6" />
</Sidebar.Root>
