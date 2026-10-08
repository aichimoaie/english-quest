import { afterEach, describe, expect, it, vi } from "vitest";
import { TOTAL_DAYS } from "@/lib/course";

async function loadApi() {
  vi.resetModules();
  return (await import("./client")).api;
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("API client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("answers from the fixture server in development when no API address is set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const days = await (await loadApi()).listDays();

    expect(days).toHaveLength(TOTAL_DAYS);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never answers from the fixture server in a production build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const fetchSpy = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchSpy);

    await (await loadApi()).listDays();

    expect(fetchSpy).toHaveBeenCalledWith("/api/v1/days", expect.anything());
  });

  it("calls the API address when one is set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const fetchSpy = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchSpy);

    await (await loadApi()).listDays();

    expect(fetchSpy).toHaveBeenCalledWith("https://api.example.test/api/v1/days", expect.anything());
  });
});
