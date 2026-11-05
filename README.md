# E-Learning App

Ứng dụng học trực tuyến viết bằng Expo, React Native và TypeScript. Supabase cung cấp xác thực, PostgreSQL và các chức năng backend. Giao diện hỗ trợ khám phá khóa học, tìm kiếm, trợ lý tư vấn, giỏ hàng, ghi danh, học bài và theo dõi tiến độ.

## Tính năng

- Đăng ký, đăng nhập, hồ sơ và cài đặt giao diện.
- Trang chủ, danh mục, tìm kiếm từ khóa và tìm kiếm ngữ nghĩa khi backend AI được triển khai.
- Chi tiết khóa học, chương/bài học, đánh giá, bookmark và khóa học tương tự.
- Giỏ hàng, ghi danh thử nghiệm, màn học, hỏi đáp và tiến độ.
- Trợ lý AI tư vấn khóa học khi Edge Function, secrets và embeddings đã được cấu hình.
- Cache dữ liệu trang chủ bằng AsyncStorage; tìm kiếm có debounce và phân trang.

## Công nghệ chính

- Expo SDK 58, React Native 0.88, React 19, TypeScript 6.
- Expo Router 58.
- Supabase JS 2, Supabase Auth, PostgreSQL, RLS, RPC và Edge Functions.
- AsyncStorage và Expo Image.

Phiên bản package chính xác được khóa trong `package-lock.json`.

## Yêu cầu

- Node.js và npm.
- Điện thoại có Expo Go, hoặc Android emulator/macOS iOS simulator nếu muốn chạy trên giả lập.
- Dự án Supabase để chạy ứng dụng với dữ liệu backend.
- Git.

## Cài đặt và chạy

### 1. Lấy source

```bash
git clone <URL_REPOSITORY>
cd mobile-elearning
npm ci
```

Nếu source đã có sẵn, mở terminal tại thư mục gốc dự án.

### 2. Cấu hình biến môi trường

Tạo file `.env` cạnh `package.json`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

Lấy hai giá trị này trong Supabase **Project Settings → API**. Không đưa `service_role` key hoặc Gemini API key vào app Expo hay Git. `.env` đã được gitignore.

### 3. Khởi tạo Supabase database mới

Chỉ áp dụng hướng dẫn này cho **database trống mới tạo**:

1. Mở Supabase **SQL Editor**.
2. Chạy `supabase/schema.sql` một lần. File này gồm schema nghiệp vụ, RLS, checkout giả lập, AI MVP, consent và quota chatbot.
3. Chạy `supabase/seed.sql` để nạp dữ liệu mẫu khóa học, giảng viên và bài học.
4. Nếu dùng đăng ký email trong môi trường demo, cấu hình Email provider theo chính sách xác nhận email của nhóm.

Không chạy lại `schema.sql` trên database đã có dữ liệu. Với database đang tồn tại, cần đối chiếu schema thực tế, backup và dùng kế hoạch migration riêng; không chạy chồng các proposal lên nhau theo README này.

### 4. Chạy ứng dụng

```bash
npx expo start
```

- Expo Go: quét QR code bằng điện thoại; nếu không kết nối được LAN, thử `npx expo start --tunnel`.
- Android emulator: `npm run android`.
- iOS simulator: `npm run ios` trên macOS.
- Web: `npm run web`.

Sau khi thay đổi cấu hình mà Metro vẫn giữ cache cũ, chạy `npx expo start -c`.

### 5. Kiểm tra source

```bash
npx expo lint
npx tsc --noEmit
```

## Cấu hình chức năng AI

`schema.sql` thiết lập các bảng, RLS và RPC cho AI, nhưng **không tự deploy Supabase Edge Functions, không tạo embedding và không cấu hình Gemini secret**. Để bật semantic search, gợi ý AI và chatbot cần:

1. Đọc `docs/ai-mvp.md` và xác nhận môi trường Supabase phù hợp.
2. Cấu hình Gemini key trong Supabase Function Secrets, không trong `.env` của app.
3. Deploy các functions phù hợp trong `supabase/functions/` theo hướng dẫn Supabase.
4. Tạo embeddings cho khóa học trước khi kiểm thử semantic search/chatbot.
5. Chạy các ca trong `docs/ai-chatbot-test-cases.md`; đo độ trễ theo `docs/ai-chatbot-latency.md` nếu cần báo cáo số liệu.

Quota chatbot (`ai_chat_usage` và `increment_chat_usage`) đã nằm trong schema gộp. Không chạy riêng `supabase/proposals/20261105_ai_chatbot.sql` lên database vừa khởi tạo bằng schema này vì proposal đó tạo lại các đối tượng quota.

## Cấu trúc dự án

```text
src/app/              Route và màn hình Expo Router
src/components/       Thành phần giao diện dùng lại
src/context/          Auth, cart, bookmark, consent, theme, chat session
src/hooks/            Hook dùng chung
src/services/         Truy cập Supabase và nghiệp vụ
src/lib/              Supabase client, cache
src/types/            Kiểu dữ liệu TypeScript
supabase/schema.sql   Schema bootstrap cho database mới
supabase/seed.sql     Dữ liệu demo
supabase/functions/   Edge Functions
supabase/proposals/   Proposal SQL lịch sử/thay đổi cần review
supabase/pending/     Thay đổi đang chờ điều kiện triển khai
docs/                 Hướng dẫn, ghi chú bảo mật và kiểm thử AI
```

## Giới hạn và lưu ý triển khai

- Thanh toán hiện là giả lập qua RPC `checkout_cart()`; chưa kết nối cổng thanh toán thật.
- Schema giữ policy tự ghi danh miễn phí để phục vụ kiểm thử. Chỉ gỡ policy trong `supabase/pending/20261029000000_remove_self_enroll.sql` sau khi checkout được xác minh và nhóm quyết định đóng tính năng ghi danh miễn phí.
- Seed dùng URL video mẫu. `lessons.video_url` đang được app đọc và policy đọc lessons là công khai; không thêm video trả phí/có bản quyền trước khi chuyển sang thiết kế video được bảo vệ. Không chạy `supabase/pending/20261029000001_lesson_videos.sql` trước khi cập nhật client đồng bộ.
- Điều khoản và chính sách quyền riêng tư trong app là nội dung chờ phê duyệt, không phải văn bản pháp lý hoàn chỉnh.
- AI chỉ hoạt động khi database, Edge Functions, secrets và embeddings của môi trường đã được cấu hình. Mã nguồn/proposal không tự chứng minh dịch vụ đã được deploy.
- Các SQL trong `supabase/proposals/` và `supabase/pending/` là thay đổi riêng cho database đã tồn tại hoặc đang chờ triển khai; review và backup trước khi áp dụng.

## Tài liệu liên quan

- [Hướng dẫn chạy source](docs/HUONG_DAN_CHAY_SOURCE.md)
- [AI MVP và quy trình triển khai/kiểm thử](docs/ai-mvp.md)
- [Ca kiểm thử chatbot](docs/ai-chatbot-test-cases.md)
- [Hướng dẫn đo độ trễ chatbot](docs/ai-chatbot-latency.md)
- [Ghi chú bảo mật video](docs/security-notes.md)
- [Quy trình phát triển](quy-trinh.md)
