import { useCallback, useRef, useState } from "react"
import { Camera, CheckCircle2, LoaderCircle, ScanText, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react"
import { CameraPreview, type CameraPreviewHandle } from "@/components/camera-preview"
import { LanguagePicker } from "@/components/language-picker"
import { ScanHistory } from "@/components/scan-history"
import { Button } from "@/components/ui/button"
import { useScanHistory } from "@/hooks/use-scan-history"
import { recognizeCanvas } from "@/lib/ocr"
import { loadSelectedLanguages, saveSelectedLanguages } from "@/lib/scan-storage"
import type { ScanItem } from "@/types/scan"

type ScanStatus = "idle" | "scanning" | "success" | "empty" | "error"

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function progressLabel(status: string) {
  const labels: Record<string, string> = {
    "loading tesseract core": "Đang tải bộ máy OCR",
    "initializing tesseract": "Đang khởi tạo OCR",
    "loading language traineddata": "Đang tải gói ngôn ngữ",
    "initializing api": "Đang chuẩn bị nhận diện",
    "recognizing text": "Đang đọc văn bản",
  }
  return labels[status] || "Đang xử lý ảnh"
}

function App() {
  const cameraRef = useRef<CameraPreviewHandle>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(loadSelectedLanguages)
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [progress, setProgress] = useState(0)
  const { items, addItem, removeItem, clearAll, persistenceError } = useScanHistory()

  const handleCameraReady = useCallback((ready: boolean) => setCameraReady(ready), [])

  const handleLanguagesChange = (languages: string[]) => {
    setSelectedLanguages(languages)
    saveSelectedLanguages(languages)
    setScanStatus("idle")
  }

  const handleScan = async () => {
    if (scanStatus === "scanning") return
    const frame = cameraRef.current?.capture()
    if (!frame) {
      setScanStatus("error")
      setStatusMessage("Camera chưa sẵn sàng. Hãy đợi một chút rồi thử lại.")
      return
    }

    setScanStatus("scanning")
    setStatusMessage("Đang chuẩn bị nhận diện…")
    setProgress(0)

    try {
      const text = await recognizeCanvas(frame, selectedLanguages, (update) => {
        setProgress(Math.max(0, Math.min(1, update.progress || 0)))
        setStatusMessage(progressLabel(update.status))
      })

      if (!text) {
        setScanStatus("empty")
        setStatusMessage("Không tìm thấy chữ. Hãy giữ camera gần hơn và đảm bảo đủ sáng.")
        return
      }

      const item: ScanItem = {
        id: createId(),
        text,
        createdAt: new Date().toISOString(),
        languages: [...selectedLanguages],
      }
      addItem(item)
      setProgress(1)
      setScanStatus("success")
      setStatusMessage("Đã nhận diện và lưu kết quả.")
      window.setTimeout(() => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120)
    } catch (error) {
      console.error("OCR failed", error)
      setScanStatus("error")
      setStatusMessage(
        navigator.onLine
          ? "Không thể nhận diện ảnh. Hãy thử lại hoặc chọn ít ngôn ngữ hơn."
          : "Cần kết nối mạng để tải gói ngôn ngữ lần đầu.",
      )
    }
  }

  const isScanning = scanStatus === "scanning"

  return (
    <div className="min-h-svh pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mx-auto flex max-w-xl items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <ScanText className="size-5" />
          </span>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">LensText</p>
            <p className="-mt-0.5 text-[11px] font-medium text-slate-500">Camera OCR</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
          <ShieldCheck className="size-3.5" /> Xử lý tại máy
        </span>
      </header>

      <main className="mx-auto max-w-xl space-y-5 px-4 sm:px-6">
        <section aria-labelledby="scan-heading" className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 id="scan-heading" className="text-2xl font-black tracking-tight text-slate-950">Quét văn bản</h1>
              <Sparkles className="size-5 text-violet-500" aria-hidden="true" />
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">Đưa nội dung vào khung, giữ máy ổn định rồi bấm quét.</p>
          </div>

          <CameraPreview ref={cameraRef} onReadyChange={handleCameraReady} />
          <LanguagePicker value={selectedLanguages} onChange={handleLanguagesChange} disabled={isScanning} />

          <Button
            type="button"
            size="lg"
            className="relative h-14 w-full overflow-hidden rounded-2xl text-base shadow-lg shadow-violet-200"
            onClick={() => void handleScan()}
            disabled={!cameraReady || isScanning}
          >
            {isScanning ? <LoaderCircle className="animate-spin" /> : <Camera />}
            {isScanning ? "Đang nhận diện…" : "Quét văn bản"}
            {isScanning && <span className="absolute inset-x-0 bottom-0 h-1 bg-white/25"><span className="block h-full bg-white transition-[width]" style={{ width: `${Math.max(5, progress * 100)}%` }} /></span>}
          </Button>

          {scanStatus !== "idle" && (
            <div
              className={`status-message status-${scanStatus}`}
              role={scanStatus === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {scanStatus === "scanning" && <LoaderCircle className="size-4 animate-spin" />}
              {scanStatus === "success" && <CheckCircle2 className="size-4" />}
              {(scanStatus === "error" || scanStatus === "empty") && <TriangleAlert className="size-4" />}
              <span>{statusMessage}</span>
              {isScanning && <span className="ml-auto tabular-nums">{Math.round(progress * 100)}%</span>}
            </div>
          )}

          {persistenceError && (
            <p className="status-message status-empty" role="alert">
              <TriangleAlert className="size-4" /> Kết quả đang hiển thị nhưng trình duyệt không cho phép lưu lâu dài.
            </p>
          )}
        </section>

        <div ref={historyRef} className="scroll-mt-4 border-t border-slate-200/80 pt-5">
          <ScanHistory items={items} onRemove={removeItem} onClear={clearAll} />
        </div>
      </main>

      <footer className="mx-auto mt-8 max-w-xl px-4 text-center text-xs leading-5 text-slate-400 sm:px-6">
        Ảnh không được tải lên máy chủ. Language pack chỉ được tải khi cần.
      </footer>
    </div>
  )
}

export default App
