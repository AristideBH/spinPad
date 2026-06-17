import { describe, it, expect, vi, afterEach } from "vitest";
import { getConfig, setConfig, factoryReset, setActiveProfile, getDeviceStatus, ping } from "$shared/transport/http.js";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("http transport — happy paths", () => {
  it("getConfig fetches /api/config and returns the parsed json", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ foo: "bar" }));
    vi.stubGlobal("fetch", fetchMock);
    const cfg = await getConfig();
    expect(fetchMock).toHaveBeenCalledWith("/api/config");
    expect(cfg).toEqual({ foo: "bar" });
  });

  it("setConfig posts the config as json", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    // @ts-expect-error minimal stub
    const res = await setConfig({ a: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/config",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ a: 1 }) }),
    );
    expect(res).toEqual({ ok: true });
  });

  it("factoryReset posts to /api/factory_reset", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await factoryReset();
    expect(fetchMock).toHaveBeenCalledWith("/api/factory_reset", { method: "POST" });
  });

  it("setActiveProfile posts the index", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await setActiveProfile(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/active_profile",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ idx: 2 }) }),
    );
  });

  it("getDeviceStatus fetches /api/status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ uptime_s: 5 }));
    vi.stubGlobal("fetch", fetchMock);
    const status = await getDeviceStatus();
    expect(fetchMock).toHaveBeenCalledWith("/api/status");
    expect(status).toEqual({ uptime_s: 5 });
  });
});

describe("http transport — error paths", () => {
  it("getConfig throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null, false, 500)));
    await expect(getConfig()).rejects.toThrow(/500/);
  });

  it("setConfig throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null, false, 400)));
    // @ts-expect-error minimal stub
    await expect(setConfig({})).rejects.toThrow(/400/);
  });
});

describe("ping", () => {
  it("returns true when the HEAD request succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null, true)));
    await expect(ping()).resolves.toBe(true);
  });

  it("returns false when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null, false, 404)));
    await expect(ping()).resolves.toBe(false);
  });

  it("returns false when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(ping()).resolves.toBe(false);
  });
});
