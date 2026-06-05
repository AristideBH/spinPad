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
    serial.connected = false; // couper le mock serial en quittant la démo
    await loadConfig();
  }

  type BatteryScenario = 'present' | 'absent' | 'low';
  type ConnScenario = 'usb' | 'ble' | 'both';
  const BATT_SCENARIOS: { v: BatteryScenario; label: string }[] = [
    { v: 'present', label: '78 %' },
    { v: 'low', label: '12 %' },
    { v: 'absent', label: 'Absente' },
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

  // Mock serial : bascule serial.connected pour ajuster l'UI réservée
  // au transport WebSerial (mode training, sync heure, key monitor…)
  // sans device physique branché.
  function setSerial(connected: boolean) {
    serial.connected = connected;
    refreshDeviceStatus();
  }
</script>

{#if devMode.active}
  <Card.Root>
    <Card.Header class="mt-2 border-b b">
      <Card.Title>Démo</Card.Title>
    </Card.Header>

    <Card.Content class="flex flex-col gap-3 p-2">
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 text-xs text-muted-foreground">Batterie</span>
        <ButtonGroup.Root>
          {#each BATT_SCENARIOS as s}
            <Button variant={devMode.battery === s.v ? 'default' : 'outline'} size="sm" onclick={() => setBatt(s.v)}>
              {s.label}
            </Button>
          {/each}
        </ButtonGroup.Root>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 text-xs text-muted-foreground">Connexion</span>
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
            Connecté
          </Button>
          <Button variant={!serial.connected ? 'default' : 'outline'} size="sm" onclick={() => setSerial(false)}>
            Déconnecté
          </Button>
        </ButtonGroup.Root>
      </div>
    </Card.Content>

    <Card.Footer>
      <Button variant="outline" size="sm" onclick={handleDevMode}>Quitter le mode démo</Button>
    </Card.Footer>
  </Card.Root>
{/if}
