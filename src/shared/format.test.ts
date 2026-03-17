import { describe, expect, it } from "vitest";

import { clamp, relativeTime } from "./format";

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to minimum when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to maximum when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it('returns "just now" for times less than a minute ago', () => {
    const date = new Date("2026-01-01T11:59:30Z");
    expect(relativeTime(date, now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const date = new Date("2026-01-01T11:55:00Z");
    expect(relativeTime(date, now)).toBe("5 minutes ago");
  });

  it("returns singular minute", () => {
    const date = new Date("2026-01-01T11:59:00Z");
    expect(relativeTime(date, now)).toBe("1 minute ago");
  });

  it("returns hours ago", () => {
    const date = new Date("2026-01-01T09:00:00Z");
    expect(relativeTime(date, now)).toBe("3 hours ago");
  });

  it("returns singular hour", () => {
    const date = new Date("2026-01-01T11:00:00Z");
    expect(relativeTime(date, now)).toBe("1 hour ago");
  });

  it("returns days ago", () => {
    const date = new Date("2025-12-30T12:00:00Z");
    expect(relativeTime(date, now)).toBe("2 days ago");
  });

  it("returns singular day", () => {
    const date = new Date("2025-12-31T12:00:00Z");
    expect(relativeTime(date, now)).toBe("1 day ago");
  });
});
