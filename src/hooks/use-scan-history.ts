import { useCallback, useState } from "react"
import { loadScanItems, saveScanItems } from "@/lib/scan-storage"
import type { ScanItem } from "@/types/scan"

export function useScanHistory() {
  const [items, setItems] = useState<ScanItem[]>(loadScanItems)
  const [persistenceError, setPersistenceError] = useState(false)

  const commit = useCallback((next: ScanItem[]) => {
    setItems(next)
    setPersistenceError(!saveScanItems(next))
  }, [])

  const addItem = useCallback((item: ScanItem) => {
    setItems((current) => {
      const next = [item, ...current]
      setPersistenceError(!saveScanItems(next))
      return next
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id)
      setPersistenceError(!saveScanItems(next))
      return next
    })
  }, [])

  const clearAll = useCallback(() => commit([]), [commit])

  return { items, addItem, removeItem, clearAll, persistenceError }
}
