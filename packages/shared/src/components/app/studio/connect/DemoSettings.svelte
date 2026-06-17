<script lang="ts">
  import { loadConfig, factoryReset } from '$shared/store/config.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { refreshDeviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import * as Card from '$shared/components/ui/card/index.js';
  import { FlaskConical } from '@lucide/svelte';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';

  async function handleDevMode() {
    devMode.active = false;
    serial.connected = false; // cut the mock serial when leaving the demo
    await loadConfig();
  }

  type BatteryScenario = 'present' | 'absent' | 'low';
  type ConnScenario = 'usb' | 'ble' | 'both';
  const BATT_SCENARIOS: { v: BatteryScenario; label: string }[] = [
    { v: 'present', label: '78 %' },
    { v: 'low', label: '12 %' },
    { v: 'absent', label: 'Absent' },
  ];
  const CONN_SCENARIOS: { v: ConnScenario; label: string }[] = [
    { v: 'usb', label: 'USB' },
    { v: 'ble', label: 'BLE' },
    { v: 'both', label: 'USB + BLE' },
  ];

  function setBatt(v: BatteryScenario) {
    devMode.battery = v;
    refreshDeviceStatus();
  }
  function setConn(v: ConnScenario) {
    devMode.connection = v;
    refreshDeviceStatus();
  }

  // Mock serial: toggles serial.connected to adjust the UI reserved
  // for the WebSerial transport (training mode, time sync, key monitor…)
  // without a physical device plugged in.
  function setSerial(connected: boolean) {
    serial.connected = connected;
    refreshDeviceStatus();
  }
</script>

{#if devMode.active}
  <Card.Root>
    <Card.Header class="mt-2 border-b b">
      <Card.Title>Demo</Card.Title>
    </Card.Header>

    <Card.Content class="flex flex-col gap-3 p-2">
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 text-xs text-muted-foreground">Battery</span>
        <ButtonGroup.Root>
          {#each BATT_SCENARIOS as s}
            <Button variant={devMode.battery === s.v ? 'default' : 'outline'} size="sm" onclick={() => setBatt(s.v)}>
              {s.label}
            </Button>
          {/each}
        </ButtonGroup.Root>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 text-xs text-muted-foreground">Connection</span>
        <ButtonGroup.Root>
          {#each CONN_SCENARIOS as s}
            <Button variant={devMode.connection === s.v ? 'default' : 'outline'} size="sm" onclick={() => setConn(s.v)}>
              {s.label}
            </Button>
          {/each}
        </ButtonGroup.Root>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 text-xs text-muted-foreground">Serial</span>
        <ButtonGroup.Root>
          <Button variant={serial.connected ? 'default' : 'outline'} size="sm" onclick={() => setSerial(true)}>
            Connected
          </Button>
          <Button variant={!serial.connected ? 'default' : 'outline'} size="sm" onclick={() => setSerial(false)}>
            Disconnected
          </Button>
        </ButtonGroup.Root>
      </div>
    </Card.Content>

    <Card.Footer>
      <Button variant="outline" size="sm" onclick={handleDevMode}>Exit demo mode</Button>
    </Card.Footer>
  </Card.Root>
{/if}
