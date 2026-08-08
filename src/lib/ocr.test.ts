import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createWorker: vi.fn(),
  recognize: vi.fn(),
  terminate: vi.fn(),
}))

vi.mock("tesseract.js", () => ({
  createWorker: mocks.createWorker,
}))

import { recognizeCanvas, terminateOcrWorker } from "@/lib/ocr"

describe("OCR service", () => {
  afterEach(async () => {
    await terminateOcrWorker()
    vi.clearAllMocks()
  })

  it("normalizes text and reuses a worker for the same languages", async () => {
    mocks.recognize.mockResolvedValue({ data: { text: "  Xin   chào  \n\n\n  world  " } })
    mocks.createWorker.mockResolvedValue({ recognize: mocks.recognize, terminate: mocks.terminate })
    const canvas = document.createElement("canvas")

    await expect(recognizeCanvas(canvas, ["vie", "eng"])).resolves.toBe("Xin chào\n\nworld")
    await recognizeCanvas(canvas, ["vie", "eng"])

    expect(mocks.createWorker).toHaveBeenCalledTimes(1)
    expect(mocks.recognize).toHaveBeenCalledTimes(2)
  })

  it("replaces the worker when languages change", async () => {
    mocks.recognize.mockResolvedValue({ data: { text: "Hello" } })
    mocks.createWorker.mockResolvedValue({ recognize: mocks.recognize, terminate: mocks.terminate })
    const canvas = document.createElement("canvas")

    await recognizeCanvas(canvas, ["eng"])
    await recognizeCanvas(canvas, ["fra"])

    expect(mocks.createWorker).toHaveBeenCalledTimes(2)
    expect(mocks.terminate).toHaveBeenCalledTimes(1)
  })

  it("rejects an empty language selection", async () => {
    await expect(recognizeCanvas(document.createElement("canvas"), [])).rejects.toThrow("ít nhất một ngôn ngữ")
  })
})
