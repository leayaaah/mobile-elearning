Đây là quy trình code còn lại, xếp theo thứ tự phụ thuộc: màn nào cần dữ liệu từ màn trước thì làm sau. Mốc cuối là 03/11 (nộp nội bộ) và 05/11 (nộp bài).

Bước 1. Chạy được bộ khung (28–29/10)

Tạo project Expo, chép app/ và src/ từ gói zip, cài thư viện bằng npx expo install.
Tạo project Supabase, chạy schema.sql rồi seed.sql, tắt “Confirm email”.
Điền .env, chạy npx expo start -c.
Xong khi: đăng ký, đăng nhập, thấy Trang chủ có dữ liệu, kéo để làm mới được. Lỗi build thì gửi log cho mình sửa.

Bước 2. Tìm kiếm (29/10)

Ô tìm kiếm có useDebounce, gọi searchCourses.
Hot topics, danh sách danh mục, gợi ý “Dành cho bạn” khi chưa gõ.
Kết quả bằng FlatList với phân trang onEndReached, hiện “N kết quả”.
Nhận categoryId từ Trang chủ, đủ 3 trạng thái: đang tải, lỗi, không có kết quả.

Bước 3. Chi tiết khóa học (30/10)

Header + 3 tab (Tổng quan, Bài học, Đánh giá).
Tab Bài học: danh sách chương thu gọn/mở rộng. Tab Đánh giá: lọc theo số sao.
Nút bookmark, thanh dưới cùng với giá và nút “Thêm vào giỏ”.
Thêm tạm nút “Ghi danh miễn phí” (enroll) để test các màn phía sau trước khi có thanh toán.

Bước 4. Giỏ hàng (30–31/10)

Danh sách khóa trong giỏ, xóa từng khóa, tổng tiền, icon giỏ ở Trang chủ có badge số lượng (đã làm sẵn).
Chặn thêm trùng và thêm khóa đã ghi danh.

Bước 5. Màn hình học (31/10–01/11)

Tab Bài học: chọn bài, đánh dấu hoàn thành (markLessonDone), cập nhật tiến độ.
Tab Hỏi đáp: xem và đăng câu hỏi. Tab Dự án: chỉ xem.
Video thay link mẫu sau cùng (bạn nói sẽ tự làm).

Bước 6. Khóa học của tôi, Hồ sơ, Giảng viên (01–02/11)

Khóa học của tôi: 3 tab Tất cả / Đang học / Hoàn thành, thanh tiến độ, từ my_courses.
Hồ sơ: 3 số thống kê, danh sách đã lưu, sửa họ tên, đăng xuất.
Hồ sơ giảng viên: thông tin và các khóa.

Bước 7. Mở rộng, làm nếu kịp (02/11)

Thanh toán giả lập: màn Checkout gọi useCart().checkout() (backend đã có sẵn).
Bộ lọc nâng cao (giá, số sao).

Bước 8. Hoàn thiện và đóng băng (02–03/11)

Việt hóa các chuỗi còn sót, kiểm tra trạng thái trống và lỗi ở mọi màn.
Tự chạy qua toàn bộ luồng: đăng ký → tìm → thêm giỏ → ghi danh → học → xem tiến độ. Ghi lại lỗi đã gặp cho Chương 7.
Đo vài số cho phần “nội dung đặc biệt”: thời gian tải Trang chủ có và không có cache.
Sau 03/11 chỉ sửa lỗi, không thêm tính năng.

Bước 9. Bàn giao (03–04/11)

Đẩy mã lên GitHub, README đủ bước chạy.
Chụp ảnh màn hình ghép (3–4 ảnh/hình) và gửi cho Thịnh, Sen để làm báo cáo và slide.
Quay video demo 1–3 phút.
Chốt Expo Go hay build APK (EAS) và chuẩn bị nếu chọn APK.

Lưu ý:

Bước 3–5 là đường găng. Nếu trễ, bỏ Bước 7 trước, rồi giản lược tab Dự án và Q&A.
Thịnh và Sen cần ảnh màn hình và cấu trúc thư mục từ bạn vào khoảng 02–03/11 để kịp viết Chương 3–4 và slide.