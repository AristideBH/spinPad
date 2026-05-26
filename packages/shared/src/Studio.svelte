<script lang="ts">
  import { PersistedState } from 'runed';
  import * as Tabs      from './components/ui/tabs/index.js';
  import DashboardTab   from './components/app/tabs/DashboardTab.svelte';
  import KeypadTab      from './components/app/tabs/KeypadTab.svelte';
  import SettingsTab    from './components/app/tabs/SettingsTab.svelte';
  import { APP_CONFIG } from './app.config.js';

  const activeTab = new PersistedState<string>('spinpad-active-tab', 'dashboard');
</script>

<svelte:head>
  <title>{APP_CONFIG.name} — Studio</title>
</svelte:head>

<Tabs.Root bind:value={activeTab.current} class="w-full">
  <Tabs.List class="mb-6">
    <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
    <Tabs.Trigger value="keypad">Keypad</Tabs.Trigger>
    <Tabs.Trigger value="parametres">Paramètres</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="dashboard">
    <DashboardTab />
  </Tabs.Content>

  <Tabs.Content value="keypad">
    <KeypadTab />
  </Tabs.Content>

  <Tabs.Content value="parametres">
    <SettingsTab />
  </Tabs.Content>
</Tabs.Root>
