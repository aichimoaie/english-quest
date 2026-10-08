import { afterEach, describe, expect, it, vi } from "vitest";

async function loadNextConfig() {
  vi.resetModules();
  return (await import("./next.config")).default;
}

describe("next.config deploy guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails a deploy build when the API address is empty", async () => {
    vi.stubEnv("REQUIRE_API_BASE_URL", "true");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    await expect(loadNextConfig()).rejects.toThrow("NEXT_PUBLIC_API_BASE_URL");
  });

  it("lets a deploy build through when the API address is set", async () => {
    vi.stubEnv("REQUIRE_API_BASE_URL", "true");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");

    expect((await loadNextConfig()).output).toBe("export");
  });

  it("lets a bare local build through without the API address", async () => {
    vi.stubEnv("REQUIRE_API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    expect((await loadNextConfig()).output).toBe("export");
  });
});
