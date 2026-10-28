// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MenuAccessGuard,
  MenuAccessProvider,
  useMenuEntryAccess,
  useModuleAccess,
} from "./access";
import { DEFAULT_MENU_ACCESS, type MenuAccessConfig } from "./menuAccess";
import type { Module } from "./matrix";

function Probe({ module }: { module: Module }) {
  const access = useModuleAccess(module);
  return <span>{`${access.canRead ? "read" : "deny"}:${access.canManage ? "manage" : "view"}`}</span>;
}

function EntryProbe({ entry }: { entry: string }) {
  const access = useMenuEntryAccess(entry);
  return <span>{`${access.visible ? "visible" : "hidden"}:${access.canManage ? "manage" : "view"}`}</span>;
}

const CHAPTER_ON_MASTER_DATA: MenuAccessConfig = {
  CHAPTER: {
    ...DEFAULT_MENU_ACCESS.CHAPTER,
    "master-data/units": { visible: true, accessLevel: "READ" },
    "master-data/chapters": { visible: true, accessLevel: "READ" },
    "master-data/job-roles": { visible: true, accessLevel: "READ" },
    "master-data/projects": { visible: true, accessLevel: "READ" },
  },
};

describe("effective menu access", () => {
  it("reads the module level from the caller's grid when it is available", () => {
    render(
      <MenuAccessProvider config={CHAPTER_ON_MASTER_DATA} roleName="CHAPTER">
        <Probe module="masterData" />
      </MenuAccessProvider>,
    );

    expect(screen.getByText("read:view")).toBeInTheDocument();
  });

  it("falls back to the built-in matrix without a grid", () => {
    render(<Probe module="masterData" />);
    expect(screen.getByText("deny:view")).toBeInTheDocument();
  });

  it("gates a route by the effective grid, not the static matrix", () => {
    render(
      <MenuAccessProvider config={CHAPTER_ON_MASTER_DATA} roleName="CHAPTER">
        <MenuAccessGuard module="masterData">
          <span>halaman master data</span>
        </MenuAccessGuard>
      </MenuAccessProvider>,
    );

    expect(screen.getByText("halaman master data")).toBeInTheDocument();
  });

  it("reads a single entry for tabs and sections", () => {
    render(
      <MenuAccessProvider config={CHAPTER_ON_MASTER_DATA} roleName="CHAPTER">
        <EntryProbe entry="master-data/units" />
      </MenuAccessProvider>,
    );

    expect(screen.getByText("visible:view")).toBeInTheDocument();
  });
});
