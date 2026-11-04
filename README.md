# E-Learning App – bộ khung khởi đầu (Expo Router + TypeScript + Supabase)

> Giai đoạn 2 AI: xem [hướng dẫn MVP và kiểm thử](docs/ai-mvp.md). SQL AI hiện chỉ là
> [bản đề xuất để review](supabase/proposals/20261103_ai_mvp.sql), chưa áp dụng lên database.
> Chatbot tư vấn khóa học có [SQL proposal riêng](supabase/proposals/20261105_ai_chatbot.sql)
> và [bộ câu hỏi thử](docs/ai-chatbot-test-cases.md); triển khai sau AI MVP.

Gói này gồm **schema + dữ liệu mẫu Supabase** và **code nền** (đăng nhập, context, service, cache, Trang chủ và các màn hình Bước 6 đã triển khai).

## 1. Tạo project Expo và ghép code

```bash
npx create-expo-app@latest elearning --template default
cd elearning
```

- Xóa thư mục `app/` (hoặc `src/app/` nếu template của bạn đặt route trong `src/`) của template.
- Chép `app/`, `src/`, `.env.example` từ gói này vào thư mục gốc project.
  Nếu template dùng `src/app/` thì chuyển `app/` của gói vào `src/app/` và đổi các import `../src/...` cho đúng.
- Cài thư viện (dùng `expo install` để đúng phiên bản theo SDK):

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill expo-image
```

`expo-router`, `@expo/vector-icons`, `react-native-safe-area-context`, `expo-status-bar` đã có sẵn trong template mặc định.

## 2. Thiết lập Supabase

1. Tạo project trên supabase.com.
2. **SQL Editor** → chạy `supabase/schema.sql`, rồi chạy `supabase/seed.sql`.
3. **Authentication → Providers → Email**: tắt *Confirm email* khi đang phát triển (nếu không, đăng ký xong phải xác nhận email mới đăng nhập được).
4. **Project Settings → API**: copy *Project URL* và *anon public key*.
5. Đổi tên `.env.example` thành `.env` và điền hai giá trị trên.

## 3. Chạy

```bash
npx expo start -c
```

Mở bằng Expo Go. Đăng ký tài khoản → vào Trang chủ.

## Cấu trúc

```
app/                    # Expo Router (mỗi file = một màn hình)
  _layout.tsx           # Providers + Auth flow (chưa đăng nhập → (auth), đã đăng nhập → (tabs))
  (auth)/login, register
  (tabs)/index, search, my-courses, profile
  course/[id], learn/[id], teacher/[id], cart
src/
  lib/                  # supabase client, cache (AsyncStorage + TTL)
  services/             # gọi Supabase: courseService, userService, cartService
  context/              # Auth, Cart, Bookmark
  hooks/                # useAsync (loading/error/finally), useDebounce
  components/           # CourseCard, SectionHeader, ScreenState, ...
  theme/, types/, utils/
supabase/               # schema.sql, seed.sql
```

## Tiến độ màn hình

| Màn hình | Trạng thái | Hàm service cần dùng |
|---|---|---|
| Đăng nhập / Đăng ký | Xong | `useAuth()` |
| Trang chủ | Xong (có cache, kéo để làm mới) | – |
| Tìm kiếm + kết quả | TODO | `searchCourses`, `useDebounce` |
| Chi tiết khóa học | TODO | `getCourseById`, `getCurriculum`, `getReviews`, `getSimilarCourses`, `useCart().add` |
| Màn học | TODO | `getCurriculum`, `getResources`, `getQAPosts`, `markLessonDone` |
| Khóa học của tôi | Xong Bước 6 | `getMyCourses` |
| Hồ sơ giảng viên | Xong Bước 6 | `getTeacher`, `getTeacherCourses` |
| Hồ sơ người dùng | Xong Bước 6 | `getProfile`, `getSavedCourses`, `updateProfile`, `signOut` |
| Giỏ hàng | TODO | `useCart()` |
| Thanh toán giả lập (mở rộng) | Sẵn RPC | `useCart().checkout()` |

## Lưu ý

- Video bài học trong seed đang dùng một link mẫu chung; thay bằng video thật sau cùng. Màn học hiện mở liên kết video bằng trình duyệt/ứng dụng phù hợp trên thiết bị.
- `insert own enrollments` được giữ tạm trong schema để kiểm thử trước khi hoàn tất luồng checkout ở Bước 7; sau khi checkout chạy được, cần bỏ policy này và chỉ cho phép ghi danh qua `checkout_cart()`.
- `course_resources` và `qa_posts` chỉ đọc được bởi người đã ghi danh; `lesson_progress` chỉ được thêm khi bài thuộc khóa học đã ghi danh. `video_url` vẫn được đọc công khai qua policy `lessons` hiện tại.
- Policy tiến độ hiện không cho xóa bản ghi hoàn thành, nên màn học chỉ hỗ trợ đánh dấu hoàn thành một chiều.
- Code chưa được chạy thử trên thiết bị (đã kiểm tra cú pháp), nếu gặp lỗi build hãy gửi log để sửa.
