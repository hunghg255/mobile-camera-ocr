import { useMemo, useState } from "react"
import { Check, ChevronDown, Languages, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OCR_LANGUAGES, getLanguageName } from "@/lib/ocr-languages"
import { cn } from "@/lib/utils"

interface LanguagePickerProps {
  value: string[]
  onChange: (languages: string[]) => void
  disabled?: boolean
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export function LanguagePicker({ value, onChange, disabled }: LanguagePickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const term = normalizeSearch(query.trim())
    if (!term) return OCR_LANGUAGES
    return OCR_LANGUAGES.filter((language) =>
      normalizeSearch(`${language.name} ${language.nativeName || ""} ${language.code}`).includes(term),
    )
  }, [query])

  const toggle = (code: string) => {
    if (value.includes(code)) {
      if (value.length === 1) return
      onChange(value.filter((item) => item !== code))
    } else {
      onChange([...value, code])
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
          <Languages className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Ngôn ngữ nhận diện</p>
          <p className="truncate text-sm font-semibold text-slate-900">
            {value.map(getLanguageName).join(" + ")}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-expanded={open}
          aria-label={open ? "Đóng bộ chọn ngôn ngữ" : "Chọn ngôn ngữ"}
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {value.map((code) => (
          <button
            key={code}
            type="button"
            disabled={disabled || value.length === 1}
            onClick={() => toggle(code)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full bg-violet-50 px-2.5 text-xs font-semibold text-violet-700 disabled:cursor-default"
            aria-label={`Bỏ chọn ${getLanguageName(code)}`}
          >
            {getLanguageName(code)}
            {value.length > 1 && <X className="size-3" />}
          </button>
        ))}
      </div>

      {value.length > 3 && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800" role="status">
          Chọn nhiều hơn 3 ngôn ngữ có thể làm OCR chậm trên điện thoại.
        </p>
      )}

      {open && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <span className="sr-only">Tìm ngôn ngữ</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên hoặc mã ngôn ngữ…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </label>
          <div className="mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-slate-100" role="listbox" aria-label="Danh sách ngôn ngữ" aria-multiselectable="true">
            {filtered.map((language) => {
              const selected = value.includes(language.code)
              return (
                <button
                  key={language.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggle(language.code)}
                  className="flex min-h-12 w-full items-center gap-3 border-b border-slate-100 px-3 text-left last:border-0 hover:bg-slate-50"
                >
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded border", selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white")}>
                    {selected && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{language.nativeName || language.name}</span>
                    {language.nativeName && <span className="block text-xs text-slate-500">{language.name}</span>}
                  </span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{language.code}</code>
                </button>
              )
            })}
            {!filtered.length && <p className="px-4 py-8 text-center text-sm text-slate-500">Không tìm thấy ngôn ngữ</p>}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">{OCR_LANGUAGES.length} language packs • tải khi bạn quét</p>
        </div>
      )}
    </div>
  )
}
