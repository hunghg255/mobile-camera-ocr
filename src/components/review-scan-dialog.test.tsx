import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ReviewScanDialog } from "@/components/review-scan-dialog"

describe("ReviewScanDialog", () => {
  it("lets the user edit OCR text before submitting", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ReviewScanDialog
        open
        initialText="Nội dung OCR"
        languages={["vie", "eng"]}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    const textarea = screen.getByLabelText("Nội dung nhận diện")
    await user.clear(textarea)
    await user.type(textarea, "  Nội dung đã sửa  ")
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Lưu kết quả" }))
    expect(onSubmit).toHaveBeenCalledWith("Nội dung đã sửa")
  })

  it("does not allow empty content to be saved", async () => {
    const user = userEvent.setup()
    render(<ReviewScanDialog open initialText="Text" languages={["eng"]} onCancel={vi.fn()} onSubmit={vi.fn()} />)
    await user.clear(screen.getByLabelText("Nội dung nhận diện"))
    expect(screen.getByRole("button", { name: "Lưu kết quả" })).toBeDisabled()
    expect(screen.getByText("Nội dung không được để trống.")).toBeInTheDocument()
  })

  it("cancels without submitting", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onSubmit = vi.fn()
    render(<ReviewScanDialog open initialText="Text" languages={["vie"]} onCancel={onCancel} onSubmit={onSubmit} />)
    await user.click(screen.getByRole("button", { name: "Hủy" }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
