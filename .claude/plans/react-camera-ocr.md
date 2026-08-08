# Implementation Plan: React Mobile Web Camera OCR

## Overview

Xây dựng một ứng dụng mobile web client-only cho phép người dùng mở camera sau của điện thoại, bấm nút để chụp khung hình hiện tại và nhận dạng chữ trong ảnh. Mỗi kết quả OCR hợp lệ được thêm vào đầu danh sách, đồng bộ vào `localStorage`, hiển thị bên dưới nút quét, có thể xóa riêng từng mục hoặc xóa toàn bộ lịch sử. Ứng dụng dùng React + TypeScript, Tailwind CSS, shadcn/ui, ưu tiên trải nghiệm iOS Safari và Android Chrome, và không cần backend.

## Phạm vi và giả định

- Khởi tạo dự án mới vì workspace hiện đang trống.
- Dùng Vite với React và TypeScript.
- Thiết kế mobile-first cho viewport điện thoại; desktop chỉ cần hoạt động như phương án tương thích phụ.
- OCR chạy hoàn toàn trong trình duyệt bằng `tesseract.js`, cho phép chọn từ catalog language pack được Tesseract hỗ trợ. Mặc định là Vietnamese + English (`vie+eng`); chỉ tải các model đang chọn để phù hợp bộ nhớ và băng thông mobile.
- Người dùng có thể tìm kiếm/chọn một hoặc nhiều ngôn ngữ OCR; lựa chọn gần nhất được lưu trong `localStorage`. UI cảnh báo khi chọn quá nhiều model vì tốc độ tải và nhận dạng sẽ giảm.
- Camera dùng `navigator.mediaDevices.getUserMedia`, ưu tiên `facingMode: environment` và fallback sang camera khả dụng; video dùng `playsInline` để không tự mở fullscreen trên iOS.
- Mobile web phải được phục vụ qua HTTPS để xin quyền camera trên thiết bị thật; `localhost` chỉ phù hợp khi chạy trực tiếp trên cùng thiết bị.
- Mỗi lần bấm **Scan text**, ứng dụng chụp đúng một frame từ video, thực hiện OCR, chuẩn hóa khoảng trắng, rồi chỉ lưu khi kết quả không rỗng.
- Dữ liệu chỉ lưu trên trình duyệt hiện tại; không đồng bộ tài khoản hay thiết bị khác.

## Architecture Decisions

- **Client-only:** Camera, OCR và lưu trữ đều chạy trong browser để giữ phạm vi nhỏ, không tải ảnh lên server và dễ triển khai static hosting.
- **Tách theo trách nhiệm:** Camera preview/permission, OCR orchestration và persisted scan history được tách thành component/hook/service nhỏ để dễ kiểm thử.
- **Một nguồn dữ liệu cho lịch sử:** React state là nguồn hiển thị trong phiên; mọi mutation được ghi ngay vào một storage adapter có schema rõ ràng.
- **Schema dữ liệu:** Mỗi item có dạng `{ id: string, text: string, createdAt: string, languages: string[] }`; `id` dùng `crypto.randomUUID()` với fallback nếu cần. Cấu hình ngôn ngữ hiện tại được lưu bằng storage key riêng có version.
- **Xử lý tuần tự:** Trong lúc OCR đang chạy, nút scan bị disable để tránh nhiều worker/job chạy chồng và push kết quả sai thứ tự.
- **Language packs tải theo nhu cầu:** Không bundle hoặc preload tất cả model. Worker chỉ tải tổ hợp được chọn, được tái sử dụng khi lựa chọn không đổi và được khởi tạo lại an toàn khi đổi ngôn ngữ.
- **shadcn/ui có chọn lọc:** Chỉ thêm các primitive cần thiết như Button, Card và Alert để tránh sinh mã không dùng tới.
- **Mobile-first UI:** Bố cục một cột, camera chiếm phần rộng chính, nút scan dễ chạm bằng ngón cái, touch target tối thiểu khoảng 44×44 px và tôn trọng safe-area trên thiết bị có tai thỏ/home indicator.
- **History dễ đọc và thao tác:** Kết quả dùng card có text là nội dung chính, metadata thời gian/ngôn ngữ ở cấp độ phụ, action Copy/Delete có nhãn rõ ràng. Text dài được thu gọn nhưng luôn có nút xem thêm; không dùng swipe làm cách duy nhất để xóa.
- **Khả năng truy cập:** Có trạng thái loading rõ ràng, thông báo lỗi bằng text, nhãn nút đầy đủ, focus visible và hỗ trợ cả touch lẫn bàn phím.

## Dependency Graph

```text
Project scaffold + UI foundation
    |
    +--> Scan item type + localStorage adapter
    |        |
    |        +--> persisted history hook
    |                    |
    +--> camera capture component
    |        |
    |        +--> OCR service
    |                    |
    |                    +--> scan workflow UI
    |                                |
    +--------------------------------+--> delete item / clear all
                                             |
                                             +--> tests + final QA
```

## Task List

### Phase 1: Foundation

## Task 1: Scaffold React, Tailwind CSS và shadcn/ui

**Description:** Khởi tạo Vite React TypeScript trong workspace hiện tại, cài Tailwind CSS và cấu hình shadcn/ui với alias/import convention phù hợp. Tạo app shell mobile-first, cấu hình viewport phù hợp và nền tảng responsive tối thiểu để xác nhận toàn bộ toolchain hoạt động.

**Acceptance criteria:**

- [ ] Dev server hiển thị được React app không có lỗi console nghiêm trọng.
- [ ] Tailwind utility classes và ít nhất một shadcn/ui Button render đúng.
- [ ] Viewport mobile, TypeScript, lint script, build script và test runner có cấu hình dùng được.

**Verification:**

- [ ] Build succeeds: `pnpm build`
- [ ] Lint passes: `pnpm lint`
- [ ] Tests run: `pnpm test:run`
- [ ] Manual check: mở app ở viewport 360 px và 390 px, xác nhận không tràn ngang và Button có kích thước chạm phù hợp.

**Dependencies:** None

**Files likely touched:**

- `package.json`
- `vite.config.ts`
- `src/index.css`
- `src/App.tsx`
- `src/components/ui/button.tsx`

**Estimated scope:** Medium: 5 files chính, cộng các file cấu hình được CLI sinh tự động

## Task 2: Định nghĩa scan history và localStorage adapter

**Description:** Tạo type cho item OCR và lớp hàm thuần để đọc, validate, ghi, thêm, xóa một item và xóa toàn bộ dữ liệu trong `localStorage`. Lưu cả language code đã dùng cho từng kết quả và lựa chọn ngôn ngữ hiện tại. Dữ liệu hỏng hoặc schema cũ phải fallback an toàn thay vì làm app crash.

**Acceptance criteria:**

- [ ] Storage adapter đọc/ghi đúng mảng item theo một key có version.
- [ ] JSON lỗi, dữ liệu không phải mảng hoặc item sai schema được xử lý an toàn.
- [ ] Add/remove/clear và read/write lựa chọn ngôn ngữ tạo ra kết quả xác định, không mutate input ngoài ý muốn.

**Verification:**

- [ ] Unit tests pass cho load/save/add/remove/clear và corrupted storage: `pnpm test:run src/lib/scan-storage.test.ts`
- [ ] Type check/build succeeds: `pnpm build`
- [ ] Manual check: dữ liệu mẫu tồn tại sau khi reload trang.

**Dependencies:** Task 1

**Files likely touched:**

- `src/types/scan.ts`
- `src/lib/scan-storage.ts`
- `src/lib/scan-storage.test.ts`

**Estimated scope:** Medium: 3 files

### Checkpoint: Foundation

- [ ] App build và lint sạch.
- [ ] Test runner hoạt động ổn định.
- [ ] Storage contract đã được kiểm thử trước khi nối UI.
- [ ] Review cấu trúc dự án trước khi triển khai camera/OCR.

### Phase 2: Core Camera và OCR Flow

## Task 3: Tạo camera preview và capture frame

**Description:** Tạo component quản lý quyền camera, stream lifecycle và video preview tối ưu cho điện thoại. Component ưu tiên camera sau nhưng fallback an toàn, dùng video inline trên iOS, cung cấp hàm capture frame theo kích thước gốc sang canvas/image source cho OCR, xử lý thay đổi orientation và dừng toàn bộ media tracks khi unmount.

**Acceptance criteria:**

- [ ] Khi được cấp quyền, camera preview inline hiển thị đúng, ưu tiên camera sau và fallback nếu constraint không được hỗ trợ.
- [ ] Có UI riêng cho loading, không hỗ trợ camera và quyền bị từ chối.
- [ ] Capture trả về frame đúng kích thước/hướng của video sau khi xoay màn hình; media tracks được cleanup khi component unmount.

**Verification:**

- [ ] Component tests mock `getUserMedia`, capture và cleanup: `pnpm test:run src/components/camera-preview.test.tsx`
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check trên iOS Safari và Android Chrome: cấp quyền, xác nhận camera sau, xoay màn hình, capture đúng hướng, reload/unmount không giữ camera hoạt động.

**Dependencies:** Task 1

**Files likely touched:**

- `src/components/camera-preview.tsx`
- `src/components/camera-preview.test.tsx`
- `src/types/media.d.ts`

**Estimated scope:** Medium: 3 files

## Task 4: Tạo OCR đa ngôn ngữ và bộ chọn language pack

**Description:** Bọc `tesseract.js` trong một service có API nhỏ, nhận frame cùng danh sách language code và trả về text đã trim/chuẩn hóa. Thêm catalog cùng bộ chọn ngôn ngữ có tìm kiếm, mặc định `vie+eng`, lưu lựa chọn gần nhất và chỉ lazy-load model được chọn. Quản lý worker lifecycle/progress và chuyển lỗi tải language pack hoặc OCR thành trạng thái UI dễ hiểu.

**Acceptance criteria:**

- [ ] Catalog cho phép tìm/chọn các language pack được hỗ trợ, mặc định `vie+eng`, khôi phục lựa chọn sau reload và không preload toàn bộ model.
- [ ] OCR service nhận image source cùng một/nhiều language code; worker được tái sử dụng khi phù hợp và khởi tạo lại/terminate an toàn khi tổ hợp ngôn ngữ thay đổi.
- [ ] Progress tải model được hiển thị; language pack lỗi, OCR lỗi và kết quả rỗng đều được xử lý có kiểm soát.

**Verification:**

- [ ] Unit/component tests cho language selection, worker reuse/switch, success, empty result và model error: `pnpm test:run src/lib/ocr.test.ts src/components/language-picker.test.tsx`
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: lần lượt scan ảnh tiếng Việt, tiếng Anh và một ngôn ngữ khác; xác nhận model chỉ tải khi được chọn và UI không bị treo.

**Dependencies:** Task 1, Task 3

**Files likely touched:**

- `src/lib/ocr.ts`
- `src/lib/ocr.test.ts`
- `src/lib/ocr-languages.ts`
- `src/components/language-picker.tsx`
- `src/components/language-picker.test.tsx`
- `package.json`

**Estimated scope:** Medium: 5 file logic/test chính, cộng cấu hình dependency trong `package.json`

## Task 5: Nối hành động Scan text với camera, OCR và lịch sử

**Description:** Tạo luồng end-to-end cho nút scan: capture frame, chạy OCR với các language pack đang chọn, tạo item có metadata ngôn ngữ, push vào state và ghi vào `localStorage`. Hiển thị loading/progress, lỗi và thông báo khi ảnh không có text; chặn tap lặp khi job đang chạy và giữ trạng thái dễ quan sát trên màn hình nhỏ.

**Acceptance criteria:**

- [ ] Mỗi click hợp lệ thêm đúng một item mới cùng language codes đã dùng vào đầu danh sách và persist ngay.
- [ ] Nút scan có touch target phù hợp và bị disable khi camera chưa sẵn sàng hoặc OCR đang chạy.
- [ ] Kết quả rỗng/lỗi không làm thay đổi danh sách và có feedback dễ hiểu cho người dùng.

**Verification:**

- [ ] Integration tests cho multilingual success, persisted selection, empty, error và double-click: `pnpm test:run src/App.test.tsx`
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check trên điện thoại thật: scan chữ, thử tap liên tục, reload trang và xác nhận chỉ item hợp lệ vẫn còn.

**Dependencies:** Tasks 2, 3, 4

**Files likely touched:**

- `src/App.tsx`
- `src/hooks/use-scan-history.ts`
- `src/App.test.tsx`
- `src/components/camera-preview.tsx`

**Estimated scope:** Medium: 4 files

### Checkpoint: Core Flow

- [ ] Camera permission và preview hoạt động trên browser hỗ trợ.
- [ ] Một click tạo tối đa một OCR item.
- [ ] Scan thành công được persist và khôi phục sau reload.
- [ ] Bộ chọn hỗ trợ catalog language pack, mặc định `vie+eng` và khôi phục lựa chọn sau reload.
- [ ] Empty/error states không làm hỏng lịch sử.
- [ ] Review luồng end-to-end với người dùng trước phần hoàn thiện.

### Phase 3: History Controls và Polish

## Task 6: Hiển thị lịch sử và hỗ trợ xóa dữ liệu

**Description:** Hoàn thiện danh sách kết quả bên dưới nút scan theo hướng mobile-first. Header hiển thị tiêu đề và tổng số kết quả; mỗi item là card có text selectable, giữ xuống dòng, metadata thời gian/language chips và các nút Copy/Delete luôn nhìn thấy. Text dài có trạng thái thu gọn cùng nút Xem thêm/Thu gọn. Empty state hướng dẫn người dùng quét lần đầu; Clear all được đặt tách khỏi action thường, chỉ enabled khi có dữ liệu và yêu cầu xác nhận.

**Acceptance criteria:**

- [ ] Danh sách hiển thị mới nhất trước, có tổng số item, empty state hữu ích; card phân cấp rõ text/thời gian/ngôn ngữ và text dài có Xem thêm/Thu gọn mà không làm mất nội dung.
- [ ] Copy có feedback thành công/thất bại; Delete từng item luôn nhìn thấy, có touch target phù hợp và cập nhật đồng thời UI/`localStorage` mà không ảnh hưởng item khác.
- [ ] Clear all có visual destructive riêng và bước xác nhận nêu rõ số item sẽ xóa; cancel giữ nguyên dữ liệu, confirm xóa toàn bộ state/storage.

**Verification:**

- [ ] Component/integration tests cho empty state, item count, text expand/collapse, copy feedback, delete one, cancel và confirm clear all: `pnpm test:run src/components/scan-history.test.tsx`
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check ở viewport 320/360/390 px: đọc và select text dài, copy, mở rộng/thu gọn, xóa item giữa danh sách, reload, rồi clear all và reload lần nữa.

**Dependencies:** Tasks 2, 5

**Files likely touched:**

- `src/components/scan-history.tsx`
- `src/components/scan-history.test.tsx`
- `src/hooks/use-scan-history.ts`
- `src/components/ui/alert-dialog.tsx`

**Estimated scope:** Medium: 4 files

## Task 7: Responsive, accessibility và final QA

**Description:** Tinh chỉnh bố cục mobile-first một cột, camera có tỉ lệ ổn định, nút chính nằm trong vùng thao tác thuận tiện, khoảng cách/card typography của danh sách đọc tốt trên màn hình nhỏ và các trạng thái có semantics phù hợp. Xử lý safe-area, xoay màn hình, bàn phím/zoom trình duyệt và thực hiện kiểm thử tổng thể trên thiết bị thật.

**Acceptance criteria:**

- [ ] Layout không tràn ngang ở viewport từ 320 px, không bị che bởi safe-area và vẫn có chiều rộng đọc hợp lý trên desktop.
- [ ] Các nút gồm Copy/Delete/Xem thêm có accessible name, focus visible, touch target tối thiểu khoảng 44×44 px; trạng thái loading/error/copy feedback được công bố phù hợp.
- [ ] Toàn bộ flow camera → scan → persist → delete/clear hoạt động qua reload.

**Verification:**

- [ ] Full test suite passes: `pnpm test:run`
- [ ] Lint passes: `pnpm lint`
- [ ] Production build succeeds: `pnpm build`
- [ ] Manual check qua HTTPS trên iOS Safari và Android Chrome, gồm portrait/landscape; Chrome desktop chỉ là compatibility check phụ.

**Dependencies:** Task 6

**Files likely touched:**

- `src/App.tsx`
- `src/index.css`
- `src/components/camera-preview.tsx`
- `src/components/scan-history.tsx`

**Estimated scope:** Medium: 4 files

### Checkpoint: Complete

- [ ] Tất cả test, lint và production build đều pass.
- [ ] Mọi acceptance criteria của 7 task được đáp ứng.
- [ ] Camera stream được cleanup, không có OCR job trùng lặp.
- [ ] Lịch sử chính xác sau add, delete, clear và reload.
- [ ] History cards dễ đọc, text dài thao tác được và Copy/Delete/Clear all không gây nhầm lẫn trên mobile.
- [ ] UI mobile-first, safe-area/orientation đúng và các lỗi phổ biến có hướng dẫn rõ ràng.
- [ ] Sẵn sàng review và triển khai.

## Test Strategy

- **Unit:** storage adapter, schema validation, language catalog/selection, text normalization và OCR wrapper với dependency được mock.
- **Component:** camera states/cleanup, scan history rendering và delete controls bằng React Testing Library.
- **Integration:** chọn một/nhiều language pack, click Scan text từ frame mock đến OCR result, metadata, state và `localStorage`.
- **History UI:** kiểm tra thứ bậc nội dung, empty state, item count, nội dung dài, clipboard success/failure và destructive action bằng component tests lẫn mobile viewport thực.
- **Manual mobile browser:** camera permission thực, camera sau, portrait/landscape, scan ít nhất tiếng Việt/Anh/một ngôn ngữ khác, đổi language pack, chữ rõ/chữ mờ, tap lặp, reload persistence, denied permission và offline/model-load failure trên iOS Safari/Android Chrome.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Camera API chỉ hoạt động trong secure context | High | Chạy qua `localhost` khi dev và HTTPS khi deploy; hiển thị hướng dẫn rõ khi API không khả dụng. |
| Khác biệt camera lifecycle giữa iOS Safari và Android Chrome | High | Dùng `playsInline`, cleanup idempotent, constraint có fallback và kiểm thử trên thiết bị thật qua HTTPS. |
| Frame bị sai hướng hoặc méo sau khi xoay điện thoại | Medium | Capture theo `videoWidth`/`videoHeight`, giữ tỉ lệ preview và test cả portrait/landscape. |
| Người dùng từ chối hoặc thiết bị không có camera | High | Có error/empty state và nút thử lại; app không crash. |
| OCR model tải lần đầu chậm và bundle/runtime nặng | High | Không tải tất cả model; lazy-load language pack được chọn, mặc định chỉ `vie+eng`, hiển thị dung lượng/progress khi có dữ liệu và tái sử dụng worker. |
| Chọn quá nhiều ngôn ngữ làm OCR chậm hoặc hết bộ nhớ mobile | High | Cho phép catalog rộng nhưng khuyến nghị tối đa 2–3 ngôn ngữ mỗi lần, hiển thị cảnh báo và không tự preload toàn bộ catalog. |
| OCR sai khi ánh sáng kém, chữ nhỏ hoặc camera rung | Medium | Camera preview lớn, hướng dẫn giữ ảnh rõ; không lưu kết quả rỗng. Có thể thêm crop/preprocessing ở phase sau. |
| `localStorage` bị lỗi JSON, quota hoặc bị chặn | Medium | Validate khi đọc, catch read/write errors và thông báo không persist được mà vẫn giữ UI an toàn. |
| Mobile Safari có thể xóa/giới hạn storage trong chế độ riêng tư hoặc theo chính sách hệ thống | Medium | Không coi persistence là tuyệt đối; bắt lỗi ghi và thông báo dữ liệu có thể chỉ tồn tại trong phiên. |
| StrictMode gây lifecycle chạy lại trong development | Medium | Cleanup stream/worker idempotent và test mount/unmount. |
| Chất lượng OCR khác nhau theo chữ viết và language pack | Medium | Mặc định `vie+eng`, lưu language metadata, hướng dẫn chọn đúng ngôn ngữ và test mẫu đại diện thay vì giả định mọi language pack có chất lượng ngang nhau. |
| Kết quả OCR dài làm danh sách khó đọc hoặc đẩy action khỏi màn hình | Medium | Card dùng typography/spacing rõ, text thu gọn có kiểm soát, action đặt cố định trong footer card và test từ viewport 320 px. |
| Clipboard API không khả dụng hoặc bị chặn | Low | Bắt lỗi khi Copy, giữ text selectable để người dùng copy thủ công và hiển thị feedback rõ ràng. |

## Confirmed Product Decisions

- Công nghệ đã chốt: **Vite + React + TypeScript + Tailwind CSS + shadcn/ui**, quản lý dependency và scripts bằng pnpm.
- Đã chốt hỗ trợ catalog language pack rộng và mặc định **tiếng Việt + tiếng Anh** (`vie+eng`); các model chỉ được tải theo lựa chọn để bảo vệ hiệu năng mobile.
- Clear all có hộp thoại xác nhận để tránh mất dữ liệu ngoài ý muốn.
- Chỉ lưu text, thời gian và language codes; không lưu ảnh để tránh nhanh đầy `localStorage`.
- History dùng card mobile-first với Copy/Delete hiển thị rõ, text dài có Xem thêm/Thu gọn và không phụ thuộc vào swipe gesture.
- Sau OCR phải mở dialog review với textarea cho phép chỉnh sửa; chỉ submit nội dung không rỗng mới tạo item và lưu `localStorage`, còn cancel/đóng dialog sẽ bỏ kết quả tạm.

## Parallelization Opportunities

- Sau Task 1, Task 2 (storage) và Task 3 (camera) có thể thực hiện song song vì contract độc lập.
- Test cho history UI có thể chuẩn bị sau khi Task 2 chốt schema, nhưng implementation Task 6 nên chờ Task 5.
- Task 4 cần contract capture từ Task 3; Task 5 và các task sau phải đi tuần tự vì cùng chỉnh flow/state chính.

## Plan Verification Checklist

- [x] Mỗi task có acceptance criteria cụ thể.
- [x] Mỗi task có verification command và manual check.
- [x] Dependencies được chỉ ra và sắp theo thứ tự.
- [x] Không task nào dự kiến chạm quá 5 file chính.
- [x] Có checkpoint sau foundation, core flow và final polish.
- [x] Human đã review và approve plan; yêu cầu đa ngôn ngữ đã được cập nhật trước implementation.
