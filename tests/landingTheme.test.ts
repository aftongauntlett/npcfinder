import { describe, it, expect } from "vitest";
import { hexToRgb, withOpacity } from "../src/data/landingTheme";

describe("hexToRgb", () => {
  it("should convert full-length hex colors with hash", () => {
    const result = hexToRgb("#FFB088");
    expect(result).toEqual({ r: 255, g: 176, b: 136 });
  });

  it("should convert full-length hex colors without hash", () => {
    const result = hexToRgb("FFB088");
    expect(result).toEqual({ r: 255, g: 176, b: 136 });
  });

  it("should convert shorthand hex colors with hash", () => {
    const result = hexToRgb("#FFF");
    expect(result).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("should convert shorthand hex colors without hash", () => {
    const result = hexToRgb("FFF");
    expect(result).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("should convert shorthand hex colors correctly", () => {
    const result = hexToRgb("#F0A");
    expect(result).toEqual({ r: 255, g: 0, b: 170 });
  });

  it("should handle lowercase hex colors", () => {
    const result = hexToRgb("#abc");
    expect(result).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("should return null for invalid hex colors", () => {
    expect(hexToRgb("invalid")).toBeNull();
    expect(hexToRgb("#GGG")).toBeNull();
    expect(hexToRgb("#12")).toBeNull();
    expect(hexToRgb("#12345")).toBeNull();
  });
});

describe("withOpacity", () => {
  it("should generate rgba string from full hex color", () => {
    const result = withOpacity("#FFB088", 0.5);
    expect(result).toBe("rgba(255, 176, 136, 0.5)");
  });

  it("should generate rgba string from shorthand hex color", () => {
    const result = withOpacity("#FFF", 0.8);
    expect(result).toBe("rgba(255, 255, 255, 0.8)");
  });

  it("should return original hex for invalid colors", () => {
    const result = withOpacity("invalid", 0.5);
    expect(result).toBe("invalid");
  });
});
