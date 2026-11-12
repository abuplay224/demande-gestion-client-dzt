import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("preserves internal paths, queries, and fragments", () => {
    expect(safeRedirectPath("/demandes?page=2#liste")).toBe("/demandes?page=2#liste");
  });

  it("falls back for external, protocol-relative, and backslash redirects", () => {
    expect(safeRedirectPath("https://evil.example/login")).toBe("/demandes");
    expect(safeRedirectPath("//evil.example/login")).toBe("/demandes");
    expect(safeRedirectPath("/\\evil.example/login")).toBe("/demandes");
  });

  it("falls back to avoid redirecting back to the login page or accepting invalid values", () => {
    expect(safeRedirectPath("/connexion?next=%2Fdemandes")).toBe("/demandes");
    expect(safeRedirectPath("demandes")).toBe("/demandes");
    expect(safeRedirectPath(null)).toBe("/demandes");
  });
});
