# Quy định khi code
## 1. Công nghệ và cấu trúc
- Dự án là ứng dụng Expo/React Native dùng TypeScript, Expo Router và Supabase.
- Màn hình và route đặt trong `src/app/`. Mỗi file route là một màn hình; `_layout.tsx` dùng để khai báo layout, provider và navigator.
- Component dùng chung đặt trong `src/components/`.
- Logic gọi dữ liệu đặt trong `src/services/`.
- State dùng chung đặt trong `src/context/`; hook dùng chung đặt trong `src/hooks/`.
- Hàm tiện ích, kiểu dữ liệu, theme và thư viện nền đặt lần lượt trong `src/utils/`, `src/types/`, `src/theme/` và `src/lib/`.
- Không tạo hoặc chỉnh sửa thủ công thư mục `ios/` và `android/`; cấu hình native phải đặt trong `app.json` hoặc config plugin.
## 2. Quy tắc viết code
- Bật và duy trì TypeScript strict; không dùng `any` hoặc ép kiểu để che lỗi nếu có thể dùng type guard, type cụ thể hoặc helper hiện có.
- Ưu tiên component nhỏ, tái sử dụng được và tương thích cả Android, iOS lẫn web.
- Giữ giao diện mobile-first, hỗ trợ safe area và tránh các thao tác gây giảm hiệu năng trên màn hình danh sách.
- Dùng `Link`, `router` và `useLocalSearchParams` từ `expo-router` cho điều hướng.
- Tách việc gọi Supabase khỏi UI thông qua service; không đặt truy vấn dữ liệu trực tiếp trong component nếu service tương ứng đã tồn tại.
- Với thao tác bất đồng bộ, duy trì đầy đủ trạng thái đang tải, lỗi và không có dữ liệu. Không nuốt lỗi hoặc trả về dữ liệu giả như thể thao tác thành công.
- Tái sử dụng các component trạng thái hiện có như `ScreenState`, cùng các context và helper tương ứng trước khi tạo logic mới.
- Chuỗi hiển thị cho người dùng phải được viết bằng tiếng Việt nhất quán với giao diện hiện tại.
- Không ghi khóa bí mật, thông tin đăng nhập hoặc giá trị trong `.env` vào source code, log, commit hay pull request.
## 3. Expo và dependency
- Kiểm tra phiên bản `expo` trong `package.json` trước khi dùng API Expo/React Native mới.
- Đọc tài liệu đúng phiên bản Expo trước khi thay đổi API liên quan đến Expo, EAS hoặc React Native.
- Dùng `npx expo install <package>` để cài package tương thích SDK; không tự sửa version dependency bằng npm/yarn nếu package có native code.
- Sau khi thêm thư viện native, dùng development build phù hợp; Expo Go chỉ hỗ trợ các native module đã được tích hợp sẵn.
- Không thêm dependency mới nếu có module Expo hoặc helper hiện có đáp ứng được yêu cầu.
## 4. Supabase và dữ liệu
- Mọi thay đổi schema phải cập nhật có chủ đích trong `supabase/schema.sql`; dữ liệu mẫu cập nhật trong `supabase/seed.sql`.
- Tôn trọng Row Level Security (RLS). Policy phải giới hạn dữ liệu theo `auth.uid()` khi dữ liệu thuộc về người dùng.
- Không đưa service role key vào ứng dụng; client chỉ được dùng URL và anon public key qua biến môi trường.
- Khi thêm trường hoặc bảng, cập nhật đồng bộ type, service, trạng thái UI và dữ liệu seed nếu cần.
- Với dữ liệu có cache, giữ đúng cơ chế cache/TTL hiện có và bảo đảm thao tác làm mới có thể lấy dữ liệu mới.
## 5. Kiểm tra trước khi hoàn tất
Chạy các kiểm tra phù hợp trước khi gửi thay đổi:
```bash
npx expo lint
npx tsc --noEmit
```
Sau thay đổi ảnh hưởng đến giao diện hoặc luồng dữ liệu, chạy ứng dụng bằng:
```bash
npx expo start -c
```
Kiểm tra tối thiểu các trạng thái: đang tải, lỗi, không có dữ liệu, dữ liệu thành công, đăng nhập/đăng xuất và điều hướng giữa các màn hình liên quan.
## 6. Quy tắc Git và review
- Commit nhỏ, tập trung vào một mục đích; không đưa file sinh tự động, `.env`, secret hoặc thư mục native được generate vào commit.
- Trước khi mở pull request, kiểm tra diff, loại bỏ log tạm và mô tả rõ thay đổi, cách kiểm thử cùng các ảnh hưởng tới schema hoặc cấu hình.
- Không sửa các phần không liên quan trong cùng một pull request.
- Nếu còn TODO hoặc giới hạn đã biết, ghi rõ trong pull request thay vì âm thầm bỏ qua.
