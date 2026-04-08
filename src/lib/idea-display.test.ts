import { describe, expect, it } from "vitest";
import { blurbFromDescription, stripRedundantTitleFromBody } from "./idea-display";

describe("stripRedundantTitleFromBody", () => {
  it("removes first line matching title", () => {
    expect(stripRedundantTitleFromBody("My App\n\nReal body here.", "My App")).toBe("Real body here.");
  });

  it("removes markdown-style duplicate heading", () => {
    expect(stripRedundantTitleFromBody("# My App\n\nBody", "My App")).toBe("Body");
  });

  it("leaves unrelated first line", () => {
    expect(stripRedundantTitleFromBody("Summary\n\nBody", "My App")).toBe("Summary\n\nBody");
  });
});

describe("blurbFromDescription", () => {
  it("dedupes title and truncates", () => {
    const long = "My Idea\n\n" + "word ".repeat(100);
    const b = blurbFromDescription(long, "My Idea", 80);
    expect(b).not.toContain("My Idea\n");
    expect(b.endsWith("…")).toBe(true);
  });
});
