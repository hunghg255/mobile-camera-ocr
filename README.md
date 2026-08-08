# LensText — Mobile Camera OCR

Ứng dụng mobile web dùng camera để nhận diện văn bản đa ngôn ngữ ngay trong trình duyệt. Kết quả được lưu trên thiết bị bằng `localStorage`.

Sau khi OCR hoàn tất, ứng dụng mở dialog để người dùng kiểm tra và chỉnh sửa nội dung. Chỉ khi bấm **Lưu kết quả**, nội dung mới được thêm vào danh sách và `localStorage`; đóng hoặc hủy dialog sẽ bỏ kết quả tạm.

OCR chỉ nhận vùng nằm bên trong khung trắng trên camera. Phép crop có tính đến `object-cover`, nên vùng gửi tới OCR khớp với khung hiển thị dù camera và màn hình có tỉ lệ khác nhau.

## Công nghệ

- Vite, React và TypeScript
- Tailwind CSS và shadcn/ui
- Tesseract.js (OCR chạy trong Web Worker)
- Vitest và React Testing Library

## Chạy local

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:5173`. Trình duyệt có thể dùng camera trên `localhost`.

## Kiểm tra

```bash
pnpm test:run
pnpm lint
pnpm build
```

## Kiểm tra trên điện thoại

Camera web yêu cầu secure context. Một địa chỉ LAN dạng `http://192.168.x.x:5173` thường không được cấp quyền camera; hãy dùng HTTPS tunnel hoặc deploy bản preview qua HTTPS, sau đó kiểm tra trên iOS Safari và Android Chrome.

Lần đầu chọn một language pack, Tesseract.js cần mạng để tải model. Các lần sau trình duyệt có thể dùng cache.
