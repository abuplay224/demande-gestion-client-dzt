import { describe, expect, it } from "vitest";
import { buttonVariants } from "@/components/ui/button";

describe("variantes de bouton", () => {
  it("utilise la couleur primaire par défaut", () => {
    expect(buttonVariants()).toContain("bg-doztra-primary");
  });

  it("fournit une variante destructive réutilisable", () => {
    const classes = buttonVariants({ variant: "destructive" });

    expect(classes).toContain("bg-destructive");
    expect(classes).toContain("text-white");
    expect(classes).toContain("hover:bg-destructive/90");
  });
});
