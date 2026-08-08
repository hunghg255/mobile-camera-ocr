import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ScanHistory } from "@/components/scan-history"
import type { ScanItem } from "@/types/scan"

const items: ScanItem[] = [
  {
    id: "new",
    text: "Kết quả mới nhất",
    createdAt: "2026-08-08T10:00:00.000Z",
    languages: ["vie", "eng"],
  },
  {
    id: "long",
    text: "Một đoạn văn bản rất dài. ".repeat(20),
    createdAt: "2026-08-08T09:00:00.000Z",
    languages: ["vie"],
  },
]

describe("ScanHistory", () => {
  it("shows a helpful empty state", () => {
    render(<ScanHistory items={[]} onRemove={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByText("Chưa có kết quả")).toBeInTheDocument()
    expect(screen.getByLabelText("0 kết quả")).toBeInTheDocument()
  })

  it("shows count, metadata and expands long text", async () => {
    const user = userEvent.setup()
    render(<ScanHistory items={items} onRemove={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByLabelText("2 kết quả")).toBeInTheDocument()
    expect(screen.getByText("Mới nhất")).toBeInTheDocument()
    expect(screen.getByText("Tiếng Việt + English")).toBeInTheDocument()

    const expand = screen.getByRole("button", { name: "Xem thêm" })
    expect(expand).toHaveAttribute("aria-expanded", "false")
    await user.click(expand)
    expect(screen.getByRole("button", { name: "Thu gọn" })).toHaveAttribute("aria-expanded", "true")
  })

  it("copies and removes individual items", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<ScanHistory items={items} onRemove={onRemove} onClear={vi.fn()} />)

    await user.click(screen.getByLabelText("Sao chép kết quả 1"))
    expect(screen.getByText("Đã sao chép")).toBeInTheDocument()

    await user.click(screen.getByLabelText("Xóa kết quả 1"))
    expect(onRemove).toHaveBeenCalledWith("new")
  })

  it("requires confirmation before clearing all items", async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<ScanHistory items={items} onRemove={vi.fn()} onClear={onClear} />)

    await user.click(screen.getByRole("button", { name: "Xóa tất cả" }))
    expect(screen.getByText("Xóa 2 kết quả?")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Giữ lại" }))
    expect(onClear).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Xóa tất cả" }))
    await user.click(screen.getByRole("button", { name: "Xóa tất cả" }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
