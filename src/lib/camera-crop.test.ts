import { describe, expect, it } from "vitest"
import { calculateObjectCoverCrop } from "@/lib/camera-crop"

describe("calculateObjectCoverCrop", () => {
  it("maps a visible guide to a wider source cropped by object-cover", () => {
    const crop = calculateObjectCoverCrop(
      1920,
      1080,
      { left: 0, top: 0, width: 400, height: 300 },
      { left: 48, top: 54, width: 304, height: 168 },
    )

    expect(crop).toEqual({ x: 413, y: 194, width: 1094, height: 605 })
  })

  it("maps a visible guide to a taller source cropped by object-cover", () => {
    const crop = calculateObjectCoverCrop(
      1080,
      1920,
      { left: 10, top: 20, width: 360, height: 480 },
      { left: 53.2, top: 106.4, width: 273.6, height: 268.8 },
    )

    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThan(0)
    expect(crop.width).toBeLessThan(1080)
    expect(crop.height).toBeLessThan(1920)
  })

  it("falls back to the guide proportions when layout measurements are unavailable", () => {
    expect(calculateObjectCoverCrop(1000, 800, { left: 0, top: 0, width: 0, height: 0 }, { left: 0, top: 0, width: 0, height: 0 }))
      .toEqual({ x: 120, y: 144, width: 760, height: 448 })
  })
})
