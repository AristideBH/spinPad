import { describe, it, expect, beforeEach } from "vitest";
import { getConfig, setConfig, factoryReset, setActiveProfile, getDeviceStatus } from "$shared/transport/mock.js";
import { MOCK_CONFIG } from "$shared/mock/keyboard-config.js";
import { devMode } from "$shared/store/devMode.svelte.js";

describe("mock config transport", () => {
  it("getConfig returns a clone of MOCK_CONFIG", async () => {
    const cfg = await getConfig();
    expect(cfg).toEqual(MOCK_CONFIG);
    expect(cfg).not.toBe(MOCK_CONFIG);
  });

  it("setConfig is a no-op that resolves ok", async () => {
    // @ts-expect-error minimal stub, the mock ignores its argument
    await expect(setConfig({})).resolves.toEqual({ status: "ok" });
  });

  it("factoryReset is a no-op that resolves ok", async () => {
    await expect(factoryReset()).resolves.toEqual({ status: "ok", msg: "factory_reset" });
  });

  it("setActiveProfile is a no-op that resolves ok", async () => {
    await expect(setActiveProfile(1)).resolves.toEqual({ status: "ok" });
  });
});

describe("mock device status transport", () => {
  beforeEach(() => {
    devMode.battery = "present";
    devMode.connection = "usb";
  });

  it("threads activeProfile/profileCount through to the status", async () => {
    const status = await getDeviceStatus({ activeProfile: () => 3, profileCount: () => 2 });
    expect(status.active_profile).toBe(3);
    expect(status.stats.per_profile_keypresses.length).toBe(2);
  });

  it("reports an absent battery when devMode.battery is absent", async () => {
    devMode.battery = "absent";
    const status = await getDeviceStatus();
    expect(status.battery).toEqual({ present: false });
  });

  it("pins percent to 12 when devMode.battery is low", async () => {
    devMode.battery = "low";
    const status = await getDeviceStatus();
    expect(status.battery).toMatchObject({ percent: 12 });
  });

  it("reflects usb/ble connection scenario in the status", async () => {
    devMode.connection = "ble";
    const status = await getDeviceStatus();
    expect(status.connection).toMatchObject({ usb: false, ble: true });
  });

  it("reads activeProfile lazily, reflecting changes made during the simulated delay", async () => {
    let current = 0;
    const promise = getDeviceStatus({ activeProfile: () => current, profileCount: () => 4 });
    current = 2; // mutated after the call, before the mock's artificial delay resolves
    const status = await promise;
    expect(status.active_profile).toBe(2);
  });
});
