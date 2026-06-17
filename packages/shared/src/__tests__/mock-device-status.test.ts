import { describe, it, expect, beforeEach } from "vitest";
import {
  makeMockDeviceStatus,
  tickMockDischarge,
  tickMockCharge,
  resetMockDischarge,
} from "$shared/mock/device-status.js";

describe("makeMockDeviceStatus", () => {
  it("defaults to a present, USB-connected, charging battery at 85%", () => {
    const status = makeMockDeviceStatus();
    expect(status.battery).toEqual({
      present: true,
      percent: 85,
      voltage_mv: Math.round(3300 + (85 / 100) * 900),
      source: "auto",
      charging: true,
    });
    expect(status.connection.usb).toBe(true);
    expect(status.connection.ble).toBe(false);
  });

  it("reports an absent battery", () => {
    const status = makeMockDeviceStatus({ battery: "absent" });
    expect(status.battery).toEqual({ present: false });
  });

  it("uses 12% as the default percent for a low battery", () => {
    const status = makeMockDeviceStatus({ battery: "low" });
    expect(status.battery).toMatchObject({ present: true, percent: 12 });
  });

  it("marks charging false when not USB/both connected", () => {
    const status = makeMockDeviceStatus({ connection: "ble" });
    expect(status.battery).toMatchObject({ charging: false });
    expect(status.connection).toMatchObject({ usb: false, ble: true });
  });

  it("marks both usb and ble when connection is both", () => {
    const status = makeMockDeviceStatus({ connection: "both" });
    expect(status.connection).toMatchObject({ usb: true, ble: true });
  });

  it("threads through the active profile passed by the caller", () => {
    const status = makeMockDeviceStatus({ activeProfile: 2 });
    expect(status.active_profile).toBe(2);
  });

  it("defaults active_profile to 0 when not provided", () => {
    const status = makeMockDeviceStatus();
    expect(status.active_profile).toBe(0);
  });

  it("derives stats from the given profile count", () => {
    const status = makeMockDeviceStatus({ profileCount: 2 });
    expect(status.stats.per_profile_keypresses.length).toBe(2);
  });

  it("clamps profile count to at least 1", () => {
    const status = makeMockDeviceStatus({ profileCount: 0 });
    expect(status.stats.per_profile_keypresses.length).toBe(1);
  });
});

describe("mock battery discharge/charge simulation", () => {
  beforeEach(() => {
    resetMockDischarge(85);
  });

  it("resets to the given percent", () => {
    resetMockDischarge(50);
    expect(tickMockDischarge()).toBe(50);
  });

  it("decreases by 1 every 50 reads", () => {
    resetMockDischarge(85);
    for (let i = 0; i < 49; i++) tickMockDischarge();
    expect(tickMockDischarge()).toBe(84);
  });

  it("does not go below 0", () => {
    resetMockDischarge(0);
    for (let i = 0; i < 100; i++) tickMockDischarge();
    expect(tickMockDischarge()).toBe(0);
  });

  it("increases by 1 every 50 reads when charging", () => {
    resetMockDischarge(85);
    for (let i = 0; i < 49; i++) tickMockCharge();
    expect(tickMockCharge()).toBe(86);
  });

  it("does not go above 100 while charging", () => {
    resetMockDischarge(100);
    for (let i = 0; i < 100; i++) tickMockCharge();
    expect(tickMockCharge()).toBe(100);
  });
});
