// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSession, useSessionRole } from "./session-store";
import { clearSession, setSession, type Session } from "./token-store";

const SESSION: Session = {
  accessToken: "token-admin",
  accessTokenExpiresAt: "2026-10-02T00:00:00Z",
  refreshToken: "refresh-admin",
  refreshTokenExpiresAt: "2099-10-09T00:00:00Z",
  accessRole: "ADMIN",
  roleName: "ADMIN",
  fullName: "Ada Lovelace",
  email: "ada@tania.id",
};

beforeEach(() => {
  clearSession();
});

describe("session store", () => {
  it("re-renders consumers when the session role changes", () => {
    const { result } = renderHook(() => useSessionRole());
    expect(result.current).toBeNull();

    act(() => setSession(SESSION));
    expect(result.current).toBe("ADMIN");

    act(() =>
      setSession({
        ...SESSION,
        accessRole: "CHAPTER",
        roleName: "PM_CHAPTER",
      }),
    );
    expect(result.current).toBe("CHAPTER");

    act(() => clearSession());
    expect(result.current).toBeNull();
  });

  it("exposes the custom role name alongside the template role", () => {
    const { result } = renderHook(() => useSession());
    act(() =>
      setSession({
        ...SESSION,
        accessRole: "CHAPTER",
        roleName: "PM_CHAPTER",
      }),
    );

    expect(result.current?.accessRole).toBe("CHAPTER");
    expect(result.current?.roleName).toBe("PM_CHAPTER");
  });
});
