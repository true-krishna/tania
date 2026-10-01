import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Bersihkan DOM antar test (RTL). Tanpa ini render test berikutnya menumpuk
// dan query mengembalikan banyak elemen. Komponen React memakai pragma
// `// @vitest-environment jsdom` (konvensi §10.2 / 6.2).
afterEach(() => cleanup());