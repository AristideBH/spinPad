<script lang="ts" module>
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import BotIcon from "@lucide/svelte/icons/bot";
  import ChartPieIcon from "@lucide/svelte/icons/chart-pie";
  import FrameIcon from "@lucide/svelte/icons/frame";
  import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
  import MapIcon from "@lucide/svelte/icons/map";
  import SendIcon from "@lucide/svelte/icons/send";
  import Settings2Icon from "@lucide/svelte/icons/settings-2";
  import SquareTerminalIcon from "@lucide/svelte/icons/square-terminal";

  const data = {
    user: {
      name: "AristideBH",
      email: "aristide.bruneau@gmail.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "What is SpinPad?",
        url: "#",
        icon: SquareTerminalIcon,
        items: [
          {
            title: "History",
            url: "#",
          },
          {
            title: "Starred",
            url: "#",
          },
          {
            title: "Settings",
            url: "#",
          },
        ],
      },
      {
        title: "Hardware",
        url: "#",
        icon: BotIcon,
        items: [
          {
            title: "PCB",
            url: "#",
          },
          {
            title: "3D Models",
            url: "#",
          },
          {
            title: "Assembly",
            url: "#",
          },
        ],
      },
      {
        title: "Documentation",
        url: "/docs",
        icon: BookOpenIcon,
        items: [
          {
            title: "Introduction",
            url: "#",
          },
          {
            title: "Get Started",
            url: "#",
          },
          {
            title: "Tutorials",
            url: "#",
          },
          {
            title: "Changelog",
            url: "#",
          },
        ],
      },
      {
        title: "Editor",
        url: "/editor",
        icon: Settings2Icon,
        isActive: true,
        items: [
          {
            title: "Keymap",
            url: "/editor/keymap",
          },
          {
            title: "Profiles",
            url: "/editor/profiles",
          },
          {
            title: "Bluetooth",
            url: "/editor/ble",
          },
          {
            title: "Display",
            url: "/editor/display",
          },
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
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: FrameIcon,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: ChartPieIcon,
      },
      {
        name: "Travel",
        url: "#",
        icon: MapIcon,
      },
    ],
  };
</script>

<script lang="ts">
  import NavMain from "./nav-main.svelte";
  import NavProjects from "./nav-projects.svelte";
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
            <a href="##" {...props}>
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
    <NavProjects projects={data.projects} />
    <NavSecondary items={data.navSecondary} class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser user={data.user} />
  </Sidebar.Footer>
</Sidebar.Root>
