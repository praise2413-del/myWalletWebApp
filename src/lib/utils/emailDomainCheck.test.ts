import { afterEach, describe, expect, it, vi } from "vitest";
import { domainAcceptsEmail, extractEmailDomain } from "@/lib/utils/emailDomainCheck";

describe("extractEmailDomain", () => {
  it("extracts the domain after the last @", () => {
    expect(extractEmailDomain("user@gmail.com")).toBe("gmail.com");
  });

  it("returns null for a missing or trailing @", () => {
    expect(extractEmailDomain("not-an-email")).toBeNull();
    expect(extractEmailDomain("user@")).toBeNull();
  });
});

describe("domainAcceptsEmail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when the domain has MX records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Status: 0, Answer: [{ data: "10 mx.example.com." }] }) }),
    );
    expect(await domainAcceptsEmail("gmail.com")).toBe(true);
  });

  it("returns false for a nonexistent domain (NXDOMAIN)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Status: 3 }) }));
    expect(await domainAcceptsEmail("thisdomaindoesnotexist12345.com")).toBe(false);
  });

  it("returns false when the domain resolves but has no MX records", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Status: 0, Answer: [] }) }));
    expect(await domainAcceptsEmail("no-mail-configured.example")).toBe(false);
  });

  it("returns false for an RFC 7505 null MX record (e.g. example.com)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Status: 0, Answer: [{ data: "0 ." }] }) }));
    expect(await domainAcceptsEmail("example.com")).toBe(false);
  });

  it("returns null (inconclusive) on a network failure, never throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await domainAcceptsEmail("gmail.com")).toBeNull();
  });

  it("returns null when the HTTP response itself is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await domainAcceptsEmail("gmail.com")).toBeNull();
  });
});
