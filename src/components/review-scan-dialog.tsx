import { useId, useState, type FormEvent } from "react"
import { Check, Languages, PencilLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getLanguageName } from "@/lib/ocr-languages"

interface ReviewScanDialogProps {
  open: boolean
  initialText: string
  languages: string[]
  onCancel: () => void
  onSubmit: (text: string) => void
}

export function ReviewScanDialog({ open, initialText, languages, onCancel, onSubmit }: ReviewScanDialogProps) {
  const [draft, setDraft] = useState(initialText)
  const textareaId = useId()
  const cleanText = draft.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (cleanText) onSubmit(cleanText)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent onOpenAutoFocus={(event) => {
        event.preventDefault()
        document.getElementById(textareaId)?.focus()
      }}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="mb-2 grid size-10 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <PencilLine className="size-5" />
            </div>
            <DialogTitle>Kiểm tra kết quả</DialogTitle>
            <DialogDescription>Chỉnh lại nội dung OCR nếu cần. Văn bản chỉ được lưu sau khi bạn xác nhận.</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor={textareaId} className="text-sm font-bold text-slate-800">Nội dung nhận diện</label>
              <span className="text-xs tabular-nums text-slate-400">{draft.length.toLocaleString("vi-VN")} ký tự</span>
            </div>
            <textarea
              id={textareaId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={10}
              spellCheck
              dir="auto"
              className="min-h-52 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-base leading-6 text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              aria-describedby={`${textareaId}-hint`}
            />
            <div id={`${textareaId}-hint`} className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
              <Languages className="mt-0.5 size-3.5 shrink-0" />
              <span>Đã nhận diện bằng {languages.map(getLanguageName).join(" + ")}</span>
            </div>
            {!cleanText && <p className="mt-2 text-xs font-semibold text-red-600" role="alert">Nội dung không được để trống.</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
            <Button type="submit" disabled={!cleanText}><Check /> Lưu kết quả</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
