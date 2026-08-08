import { createRef } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CameraPreview, type CameraPreviewHandle } from "@/components/camera-preview"

describe("CameraPreview", () => {
  afterEach(() => vi.restoreAllMocks())

  it("requests the rear camera, captures a frame and stops tracks", async () => {
    const stop = vi.fn()
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } })
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue()
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
    const ref = createRef<CameraPreviewHandle>()

    const { unmount } = render(<CameraPreview ref={ref} />)
    await waitFor(() => expect(screen.getByText("Chỉ quét chữ trong khung")).toBeInTheDocument())
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ video: expect.objectContaining({ facingMode: { ideal: "environment" } }) }))

    const video = screen.getByLabelText("Hình ảnh trực tiếp từ camera")
    const guide = document.querySelector(".scan-guide") as HTMLDivElement
    Object.defineProperty(video, "videoWidth", { configurable: true, value: 1280 })
    Object.defineProperty(video, "videoHeight", { configurable: true, value: 720 })
    vi.spyOn(video, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 400, height: 300 } as DOMRect)
    vi.spyOn(guide, "getBoundingClientRect").mockReturnValue({ left: 48, top: 54, width: 304, height: 168 } as DOMRect)
    const canvas = ref.current?.capture()
    expect(canvas?.width).toBe(730)
    expect(canvas?.height).toBe(403)
    expect(drawImage).toHaveBeenCalledWith(video, 275, 130, 730, 403, 0, 0, 730, 403)

    unmount()
    expect(stop).toHaveBeenCalled()
  })

  it("explains when camera permission is denied", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError"))
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } })
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: true })

    render(<CameraPreview />)
    expect(await screen.findByText(/chưa cấp quyền camera/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeInTheDocument()
  })
})
