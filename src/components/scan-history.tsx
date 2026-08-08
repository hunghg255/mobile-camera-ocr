import { useState } from "react"
import { Check, ChevronDown, Copy, FileText, Languages, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { getLanguageName } from "@/lib/ocr-languages"
import { cn } from "@/lib/utils"
import type { ScanItem } from "@/types/scan"

interface ScanHistoryProps {
  items: ScanItem[]
  onRemove: (id: string) => void
  onClear: () => void
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

export function ScanHistory({ items, onRemove, onClear }: ScanHistoryProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [copyState, setCopyState] = useState<{ id: string; ok: boolean } | null>(null)

  const copyText = async (item: ScanItem) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable")
      await navigator.clipboard.writeText(item.text)
      setCopyState({ id: item.id, ok: true })
    } catch {
      setCopyState({ id: item.id, ok: false })
    }
    window.setTimeout(() => setCopyState((current) => current?.id === item.id ? null : current), 2200)
  }

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section aria-labelledby="history-heading" className="space-y-3">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 id="history-heading" className="text-lg font-bold tracking-tight text-slate-950">Kết quả đã quét</h2>
            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-bold text-slate-600" aria-label={`${items.length} kết quả`}>{items.length}</span>
          </div>
          {items.length > 0 && <p className="mt-0.5 text-xs text-slate-500">Mới nhất hiển thị trước</p>}
        </div>

        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 /> Xóa tất cả
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa {items.length} kết quả?</AlertDialogTitle>
                <AlertDialogDescription>Toàn bộ nội dung đã quét sẽ bị xóa khỏi thiết bị này và không thể hoàn tác.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Giữ lại</AlertDialogCancel>
                <AlertDialogAction onClick={onClear}>Xóa tất cả</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-500"><FileText className="size-6" /></span>
          <h3 className="mt-3 font-bold text-slate-800">Chưa có kết quả</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-slate-500">Đưa camera vào vùng có chữ rồi bấm “Quét văn bản”. Kết quả sẽ được lưu ngay tại đây.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => {
            const isExpanded = expanded.has(item.id)
            const isLong = item.text.length > 280 || item.text.split("\n").length > 5
            const copied = copyState?.id === item.id
            return (
              <li key={item.id}>
                <Card className={cn("overflow-hidden", index === 0 && "border-violet-200 shadow-violet-100/60")}>
                  <CardContent className="p-4">
                    {index === 0 && <span className="mb-2 inline-flex rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">Mới nhất</span>}
                    <p className={cn("select-text whitespace-pre-wrap break-words text-[15px] leading-6 text-slate-800", isLong && !isExpanded && "line-clamp-5")} dir="auto">
                      {item.text}
                    </p>

                    {isLong && (
                      <button type="button" onClick={() => toggleExpanded(item.id)} className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-violet-700" aria-expanded={isExpanded}>
                        {isExpanded ? "Thu gọn" : "Xem thêm"}
                        <ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <time dateTime={item.createdAt}>{dateFormatter.format(new Date(item.createdAt))}</time>
                      <span aria-hidden="true">•</span>
                      <span className="inline-flex min-w-0 items-center gap-1"><Languages className="size-3.5" /> {item.languages.map(getLanguageName).join(" + ")}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button type="button" variant="secondary" onClick={() => void copyText(item)} aria-label={`Sao chép kết quả ${index + 1}`}>
                        {copied && copyState.ok ? <Check /> : <Copy />}
                        {copied ? (copyState.ok ? "Đã sao chép" : "Hãy chọn text") : "Sao chép"}
                      </Button>
                      <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onRemove(item.id)} aria-label={`Xóa kết quả ${index + 1}`}>
                        <Trash2 /> Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ol>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {copyState && (copyState.ok ? "Đã sao chép văn bản" : "Không thể sao chép tự động. Hãy chọn văn bản để sao chép thủ công.")}
      </div>
    </section>
  )
}
