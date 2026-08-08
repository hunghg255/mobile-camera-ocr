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
    await waitFor(() => expect(screen.getByText("Đặt chữ vào trong khung")).toBeInTheDocument())
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ video: expect.objectContaining({ facingMode: { ideal: "environment" } }) }))

    const video = screen.getByLabelText("Hình ảnh trực tiếp từ camera")
    Object.defineProperty(video, "videoWidth", { configurable: true, value: 1280 })
    Object.defineProperty(video, "videoHeight", { configurable: true, value: 720 })
    const canvas = ref.current?.capture()
    expect(canvas?.width).toBe(1280)
    expect(canvas?.height).toBe(720)
    expect(drawImage).toHaveBeenCalled()

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
