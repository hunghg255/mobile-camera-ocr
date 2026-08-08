import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Camera, CameraOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { calculateObjectCoverCrop } from "@/lib/camera-crop"

export interface CameraPreviewHandle {
  capture: () => HTMLCanvasElement | null
}

interface CameraPreviewProps {
  onReadyChange?: (ready: boolean) => void
}

type CameraStatus = "loading" | "ready" | "error"

function cameraErrorMessage(error: unknown) {
  if (!window.isSecureContext) return "Camera cần HTTPS để hoạt động trên điện thoại."
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Bạn chưa cấp quyền camera. Hãy cho phép trong cài đặt trình duyệt rồi thử lại."
    if (error.name === "NotFoundError") return "Không tìm thấy camera trên thiết bị này."
    if (error.name === "NotReadableError") return "Camera đang được ứng dụng khác sử dụng."
  }
  return "Không thể mở camera. Vui lòng kiểm tra quyền truy cập và thử lại."
}

export const CameraPreview = forwardRef<CameraPreviewHandle, CameraPreviewProps>(
  ({ onReadyChange }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const guideRef = useRef<HTMLDivElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [status, setStatus] = useState<CameraStatus>("loading")
    const [error, setError] = useState("")
    const [attempt, setAttempt] = useState(0)

    const stopStream = useCallback(() => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      onReadyChange?.(false)
    }, [onReadyChange])

    useEffect(() => {
      let cancelled = false

      async function startCamera() {
        stopStream()
        setStatus("loading")
        setError("")

        if (!navigator.mediaDevices?.getUserMedia) {
          setStatus("error")
          setError("Trình duyệt này không hỗ trợ truy cập camera.")
          return
        }

        try {
          let stream: MediaStream
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
            })
          } catch (primaryError) {
            if (primaryError instanceof DOMException && primaryError.name === "NotAllowedError") throw primaryError
            stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
          }

          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop())
            return
          }

          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            await videoRef.current.play()
          }
          setStatus("ready")
          onReadyChange?.(true)
        } catch (cameraError) {
          if (!cancelled) {
            stopStream()
            setStatus("error")
            setError(cameraErrorMessage(cameraError))
            onReadyChange?.(false)
          }
        }
      }

      void startCamera()
      return () => {
        cancelled = true
        stopStream()
      }
    }, [attempt, onReadyChange, stopStream])

    useImperativeHandle(ref, () => ({
      capture() {
        const video = videoRef.current
        const guide = guideRef.current
        if (!video || !guide || status !== "ready" || !video.videoWidth || !video.videoHeight) return null
        const crop = calculateObjectCoverCrop(
          video.videoWidth,
          video.videoHeight,
          video.getBoundingClientRect(),
          guide.getBoundingClientRect(),
        )
        const canvas = document.createElement("canvas")
        canvas.width = crop.width
        canvas.height = crop.height
        const context = canvas.getContext("2d")
        if (!context) return null
        context.drawImage(
          video,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          canvas.width,
          canvas.height,
        )
        return canvas
      },
    }), [status])

    return (
      <section aria-label="Camera" className="camera-shell">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
          aria-label="Hình ảnh trực tiếp từ camera"
        />

        {status === "ready" && (
          <>
            <div className="camera-vignette" aria-hidden="true" />
            <div ref={guideRef} className="scan-guide" aria-hidden="true">
              <span className="corner corner-tl" />
              <span className="corner corner-tr" />
              <span className="corner corner-bl" />
              <span className="corner corner-br" />
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              Chỉ quét chữ trong khung
            </div>
          </>
        )}

        {status === "loading" && (
          <div className="camera-state" role="status">
            <span className="camera-icon"><Camera className="size-6" /></span>
            <p className="font-semibold text-white">Đang mở camera…</p>
            <p className="text-xs text-slate-300">Vui lòng cấp quyền khi được hỏi</p>
          </div>
        )}

        {status === "error" && (
          <div className="camera-state px-6" role="alert">
            <span className="camera-icon bg-red-500/20 text-red-100"><CameraOff className="size-6" /></span>
            <p className="max-w-xs text-center text-sm leading-6 text-white">{error}</p>
            <Button type="button" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setAttempt((value) => value + 1)}>
              <RefreshCw /> Thử lại
            </Button>
          </div>
        )}
      </section>
    )
  },
)
CameraPreview.displayName = "CameraPreview"
