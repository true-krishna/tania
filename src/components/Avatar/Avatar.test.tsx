// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/Avatar";

describe("Avatar", () => {
  it("shows the photo with the name as its alt text when a URL is available", () => {
    render(<Avatar name="Yudi Krisnandi" src="https://example.test/photo.jpg" />);
    const img = screen.getByAltText("Yudi Krisnandi");
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "https://example.test/photo.jpg");
  });

  it("falls back to the name's initials when there is no photo", () => {
    render(<Avatar name="Yudi Krisnandi" />);
    expect(screen.queryByRole("img", { name: "Yudi Krisnandi" })).toHaveTextContent("YK");
  });

  it("takes at most two initials and handles a single-word name", () => {
    render(<Avatar name="Admin" />);
    expect(screen.getByRole("img", { name: "Admin" })).toHaveTextContent("A");
  });

  it("falls back to a placeholder for an empty name", () => {
    render(<Avatar name="   " />);
    expect(screen.getByRole("img")).toHaveTextContent("?");
  });
});
