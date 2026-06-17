import { describe, it, expect, afterEach } from "vitest";
import { activeTransport, activeStatusTransport, transportMode } from "$shared/store/transport.js";
import * as mockTransport from "$shared/transport/mock.js";
import * as serialTransport from "$shared/store/serial.svelte.js";
import { devMode } from "$shared/store/devMode.svelte.js";

afterEach(() => {
  devMode.active = false;
});

describe("transport seam", () => {
  it("routes to the mock transport when devMode is active", () => {
    devMode.active = true;
    expect(activeTransport()).toBe(mockTransport);
    expect(activeStatusTransport()).toBe(mockTransport);
    expect(transportMode()).toBe("mock");
  });

  it("routes to serial (the non-HTTP build default) when devMode is inactive", () => {
    devMode.active = false;
    expect(activeTransport()).toBe(serialTransport);
    expect(activeStatusTransport()).toBe(serialTransport);
    expect(transportMode()).toBe("serial");
  });
});
