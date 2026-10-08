import { afterEach, describe, expect, it, vi } from "vitest";

async function loadConfig() {
  vi.resetModules();
  return import("./config");
}

describe("API config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("serves requests from the fixture server in development when no API address is set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    expect((await loadConfig()).USE_FIXTURES).toBe(true);
  });

  it("never serves requests from the fixture server in a production build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    expect((await loadConfig()).USE_FIXTURES).toBe(false);
  });

  it("calls the real API when an API address is set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");

    const config = await loadConfig();
    expect(config.USE_FIXTURES).toBe(false);
    expect(config.API_BASE_URL).toBe("https://api.example.test");
  });
});
