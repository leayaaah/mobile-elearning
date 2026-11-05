# Hướng dẫn cài đặt và chạy E-Learning App

Tài liệu này hướng dẫn chạy source hiện tại trên môi trường phát triển bằng Expo Go. Dự án dùng Expo Router, React Native, TypeScript và Supabase.

## 1. Yêu cầu

- Node.js và npm.
- Git để lấy source.
- Điện thoại Android/iOS đã cài Expo Go, hoặc có thể chạy ứng dụng trên web.
- Một dự án Supabase và thông tin Project URL, anon/public key.
- Máy tính và điện thoại nên dùng cùng mạng Wi-Fi khi mở ứng dụng bằng Expo Go.

Phiên bản thư viện khai báo nằm trong `package.json`; `package-lock.json` khóa các phiên bản cài đặt cụ thể. Khi cài dependencies, dùng `npm ci` để cài theo lockfile.

## 2. Lấy source và cài dependencies

Mở Terminal/PowerShell tại thư mục dự án:

```bash
git clone <URL_REPOSITORY>
cd mobile-elearning
npm ci
```

Nếu source đã có trên máy, bỏ qua `git clone` và `cd` đến thư mục chứa `package.json`.

## 3. Cấu hình Supabase

1. Tạo hoặc chọn dự án Supabase dùng cho phát triển/thử nghiệm.
2. Trong **Project Settings → API**, lấy Project URL và anon/public key.
3. Tạo file `.env` ở thư mục gốc, cùng cấp với `package.json`, với nội dung:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

4. Không đặt `service_role` key hoặc `GEMINI_API_KEY` vào file `.env` của ứng dụng Expo. Các secret phía server chỉ được cấu hình trong Supabase Edge Function Secrets.

### Khởi tạo database mới

Nếu đây là database trống, mở **SQL Editor** và chạy `supabase/schema.sql`, sau đó chạy `supabase/seed.sql` để thêm dữ liệu mẫu. Schema bootstrap hiện đã gộp các bảng/RPC của AI MVP, consent và quota chatbot. Nó không tự deploy Edge Functions hoặc tạo embedding.

Không chạy lại `schema.sql` trên database đã có dữ liệu. Nếu cần cập nhật database cũ, đối chiếu trạng thái thực tế, backup và dùng quy trình migration/proposal phù hợp trong `supabase/proposals/`; không chạy chồng toàn bộ proposal.

Các chức năng AI phụ thuộc Edge Functions, embeddings và secrets đã được cấu hình/deploy. Nếu chưa triển khai backend AI, không kỳ vọng chatbot tư vấn hoặc semantic search hoạt động đầy đủ; ứng dụng có một số nhánh fallback về tìm kiếm/gợi ý thông thường.

Không chạy các SQL trong `supabase/pending/` theo hướng dẫn chung này. Migration video yêu cầu đổi đồng bộ cách app đọc video; migration bỏ tự ghi danh chỉ chạy sau khi luồng checkout đã được kiểm chứng. Đối chiếu `docs/security-notes.md` và tài liệu AI trước khi thay đổi database.

## 4. Chạy ứng dụng

Từ thư mục gốc dự án:

```bash
npx expo start
```

- **Expo Go:** quét QR code hiển thị trong terminal/trình duyệt Expo bằng ứng dụng Expo Go trên điện thoại.
- **Android emulator:** chạy `npm run android` nếu đã cài và khởi động emulator tương thích.
- **iOS simulator:** chạy `npm run ios` trên macOS đã cài môi trường iOS phù hợp.
- **Web:** chạy `npm run web`.

Nếu Metro giữ cache cũ sau khi đổi cấu hình, dừng server rồi chạy `npx expo start -c` để xóa cache bundler.

## 5. Bắt đầu sử dụng

1. Mở ứng dụng và đăng ký tài khoản thử nghiệm hoặc đăng nhập.
2. Sau khi đăng nhập lần đầu, hoàn tất lựa chọn đồng ý theo dõi nếu backend consent đã được cấu hình.
3. Khám phá khóa học, tìm kiếm, mở chi tiết và dùng các chức năng học tập theo dữ liệu đã được tạo trong Supabase.
4. Để kiểm thử màn học, cần có ghi danh vào khóa học. Schema hiện có policy tự ghi danh miễn phí dùng cho thử nghiệm; checkout là luồng giả lập, chưa phải thanh toán thật.

## 6. Lệnh kiểm tra mã nguồn

```bash
npx expo lint
npx tsc --noEmit
```

Các lệnh này kiểm tra lint và TypeScript, không thay thế việc chạy thử các luồng trên thiết bị.

## 7. Cấu trúc thư mục chính

```text
src/app/             Màn hình và route Expo Router
src/components/      Thành phần giao diện dùng lại
src/context/         Trạng thái dùng chung của ứng dụng
src/hooks/           Hook dùng chung
src/services/        Nghiệp vụ và truy cập Supabase/Edge Functions
src/lib/             Supabase client và cache cục bộ
src/types/           Kiểu dữ liệu TypeScript
supabase/schema.sql  Schema database nền
supabase/seed.sql    Dữ liệu mẫu
supabase/functions/  Supabase Edge Functions
supabase/proposals/  SQL proposal cần review trước khi áp dụng
supabase/pending/    Migration đang chờ điều kiện triển khai
```

## 8. Sự cố thường gặp

- **Báo thiếu `EXPO_PUBLIC_SUPABASE_URL` hoặc anon key:** kiểm tra tên file `.env`, tên biến và khởi động lại Expo sau khi sửa.
- **Không kết nối được Supabase:** xác nhận URL/key thuộc đúng project, project đang hoạt động và thiết bị có Internet.
- **Expo Go không mở được ứng dụng:** đảm bảo điện thoại và máy chạy Expo cùng mạng; thử chế độ tunnel nếu mạng nội bộ chặn kết nối LAN.
- **Đăng nhập được nhưng lỗi ở bước đồng ý quyền riêng tư:** kiểm tra database đã được khởi tạo theo schema gộp hiện tại hay chưa; database cũ có thể cần migration consent phù hợp.
- **Chatbot/AI không phản hồi:** kiểm tra proposal/database, Edge Function, secrets và embeddings đã được cấu hình/deploy chưa.

