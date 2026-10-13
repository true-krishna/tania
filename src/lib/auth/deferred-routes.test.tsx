import * as React from "react";
import { describe, expect, it } from "vitest";
import EvaluationsLayout from "@/app/(app)/evaluations/layout";
import IdpLayout from "@/app/(app)/idp/layout";

// TAN-178: IDP & Evaluation dibuka kembali mengikuti baseline feature/design,
// sehingga layout modul menyajikan konten, bukan 404.
describe("re-opened module routes (TAN-178)", () => {
  it("renders the IDP layout instead of a 404", () => {
    const children = <main>konten</main>;
    const rendered = IdpLayout({ children });
    expect(rendered.props.children).toBe(children);
  });

  it("renders the Evaluations layout instead of a 404", () => {
    const children = <main>konten</main>;
    const rendered = EvaluationsLayout({ children });
    expect(rendered.props.children).toBe(children);
  });
});