import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  LANGUAGES_STORAGE_KEY,
  SCANS_STORAGE_KEY,
  loadScanItems,
  loadSelectedLanguages,
  saveScanItems,
  saveSelectedLanguages,
} from "@/lib/scan-storage"
import type { ScanItem } from "@/types/scan"

const item: ScanItem = {
  id: "scan-1",
  text: "Xin chào world",
  createdAt: "2026-08-08T10:00:00.000Z",
  languages: ["vie", "eng"],
}

describe("scan storage", () => {
  beforeEach(() => localStorage.clear())

  it("saves and restores scan items", () => {
    expect(saveScanItems([item])).toBe(true)
    expect(loadScanItems()).toEqual([item])
  })

  it("returns an empty list for corrupted or invalid data", () => {
    localStorage.setItem(SCANS_STORAGE_KEY, "not-json")
    expect(loadScanItems()).toEqual([])

    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify([{ id: "missing-fields" }]))
    expect(loadScanItems()).toEqual([])
  })

  it("uses vie and eng by default and filters unsupported saved codes", () => {
    expect(loadSelectedLanguages()).toEqual(["vie", "eng"])
    localStorage.setItem(LANGUAGES_STORAGE_KEY, JSON.stringify(["fra", "unknown", "fra"]))
    expect(loadSelectedLanguages()).toEqual(["fra"])
  })

  it("reports storage write failures", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError")
    })
    expect(saveSelectedLanguages(["eng"])).toBe(false)
    expect(saveScanItems([item])).toBe(false)
    spy.mockRestore()
  })
})
