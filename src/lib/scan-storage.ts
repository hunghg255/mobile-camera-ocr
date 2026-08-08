import { DEFAULT_OCR_LANGUAGES, isSupportedLanguage } from "@/lib/ocr-languages"
import type { ScanItem } from "@/types/scan"

export const SCANS_STORAGE_KEY = "lenstext:scans:v1"
export const LANGUAGES_STORAGE_KEY = "lenstext:languages:v1"

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage
  } catch {
    return null
  }
}

function isScanItem(value: unknown): value is ScanItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<ScanItem>
  return (
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    item.text.trim().length > 0 &&
    typeof item.createdAt === "string" &&
    !Number.isNaN(Date.parse(item.createdAt)) &&
    Array.isArray(item.languages) &&
    item.languages.every((language) => typeof language === "string")
  )
}

export function loadScanItems(): ScanItem[] {
  const storage = getStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(SCANS_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isScanItem) : []
  } catch {
    return []
  }
}

export function saveScanItems(items: ScanItem[]): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(SCANS_STORAGE_KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

export function loadSelectedLanguages(): string[] {
  const storage = getStorage()
  if (!storage) return [...DEFAULT_OCR_LANGUAGES]
  try {
    const parsed: unknown = JSON.parse(storage.getItem(LANGUAGES_STORAGE_KEY) || "null")
    if (!Array.isArray(parsed)) return [...DEFAULT_OCR_LANGUAGES]
    const valid = [...new Set(parsed.filter((code): code is string => typeof code === "string" && isSupportedLanguage(code)))]
    return valid.length ? valid : [...DEFAULT_OCR_LANGUAGES]
  } catch {
    return [...DEFAULT_OCR_LANGUAGES]
  }
}

export function saveSelectedLanguages(languages: string[]): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(LANGUAGES_STORAGE_KEY, JSON.stringify(languages))
    return true
  } catch {
    return false
  }
}
