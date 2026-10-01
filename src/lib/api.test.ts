import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createUser, getProfileById, listProfiles } from "./api";
import type { ProfileView } from "./talents";

const BASE = "http://api.example.com";

const RANI: ProfileView = {
  userId: 1,
  name: "Rani Kusuma",
  email: "rani.kusuma@tania.id",
  employeeId: "TAN-0001",
  role: "Engineering Manager",
  grade: "Senior",
  squad: "Core",
  location: "Jakarta HQ",
  status: "Active",
  managerId: null,
  managerName: null,
  createdAt: "2026-09-10 07:00:00",
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listProfiles", () => {
  it("calls /profiles without a query when empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ query: "", count: 1, profiles: [RANI] })
    );
    vi.stubGlobal("fetch", fetchMock);

    const profiles = await listProfiles(BASE, "");

    expect(fetchMock).toHaveBeenCalledWith("http://api.example.com/profiles");
    expect(profiles).toEqual([RANI]);
  });

  it("encodes the query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ query: "Rani K", count: 1, profiles: [RANI] })
    );
    vi.stubGlobal("fetch", fetchMock);

    await listProfiles(BASE, "Rani K");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.com/profiles?q=Rani%20K"
    );
  });
});

describe("getProfileById", () => {
  it("returns the profile on 200", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ profile: RANI }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getProfileById(BASE, 1)).resolves.toEqual(RANI);
    expect(fetchMock).toHaveBeenCalledWith("http://api.example.com/profiles/1");
  });

  it("returns null on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "not found" }, 404))
    );

    await expect(getProfileById(BASE, 4242)).resolves.toBeNull();
  });
});

describe("createUser", () => {
  it("POSTs the payload and returns the created profile", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { profile: { ...RANI, userId: 9, employeeId: "TAN-0009" } },
        201
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const profile = await createUser(BASE, { name: "Rani", email: "r@tania.id" });

    expect(fetchMock).toHaveBeenCalledWith("http://api.example.com/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Rani", email: "r@tania.id" }),
    });
    expect(profile.employeeId).toBe("TAN-0009");
  });

  it("throws ApiError with the server message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: "a user with this email already exists" }, 409)
        )
    );

    await expect(
      createUser(BASE, { name: "Rani", email: "dup@tania.id" })
    ).rejects.toThrowError(ApiError);
    await expect(
      createUser(BASE, { name: "Rani", email: "dup@tania.id" })
    ).rejects.toThrowError(/already exists/);
  });
});
