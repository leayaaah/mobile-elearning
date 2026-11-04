# AI MVP: bản chuẩn bị cho mốc 05/11/2026

## Chatbot tư vấn khóa học (bản rút gọn)

Nhánh `feature/ai-chatbot` thêm màn `/chat` từ Trang chủ. Hội thoại chỉ giữ trong
state khi màn còn mở; không có bảng lưu lịch sử. Mỗi tin tối đa 500 ký tự,
history gửi 6 lượt gần nhất, quota 30 lượt/người dùng/ngày UTC.

Áp dụng [`20261105_ai_chatbot.sql`](../supabase/proposals/20261105_ai_chatbot.sql)
**sau** proposal AI MVP trên bản sao database đã backup. SQL tạo `ai_chat_usage`
với RLS và RPC `increment_chat_usage`. Không chạy lại schema gốc trên DB có dữ liệu.
Đặt `GEMINI_API_KEY` trong Supabase secrets, sau đó deploy `chat-advisor` với
JWT verification bật. Model chat hiện là `gemini-3.5-flash-lite`; embedding giữ
`gemini-embedding-2`. Chạy batch `embed-courses` trước khi thử chat.

Function xác thực JWT, gọi RPC bằng JWT của user, loại khóa đã ghi danh,
lọc ID LLM trả về trong ứng viên và lấy metadata từ DB. Khi chat model lỗi,
trả 3 ứng viên semantic dưới dạng fallback. Khi embedding lỗi, trả lỗi rõ ràng.
Chưa có streaming, tracking nguồn chatbot, bộ đo thật hay kiểm thử trên thiết bị.
Bộ câu thử: [`ai-chatbot-test-cases.md`](ai-chatbot-test-cases.md).

Các thay đổi trong repo **chưa được triển khai lên Supabase**. Migration nằm ở
[`supabase/proposals/20261103_ai_mvp.sql`](../supabase/proposals/20261103_ai_mvp.sql), không nằm
trong thư mục migration tự chạy. Kiểm tra schema thực tế và sao lưu dữ liệu trước khi áp dụng.
Không chạy lại `supabase/schema.sql` trên database đã có dữ liệu.

## Quyết định kỹ thuật

- Dùng `gemini-embedding-2` với 768 chiều cho khóa học và truy vấn. Google khuyên dùng 768,
  1536 hoặc 3072 chiều và tự chuẩn hóa vector rút gọn ở Embedding 2.
- Embedding đầu vào khóa học: tiêu đề, mô tả, danh mục. Query dùng tiền tố
  `task: search result | query:`; khóa học dùng `title: ... | text: ...`, theo tài liệu Gemini.
- Không đưa `GEMINI_API_KEY` hoặc service role key vào `.env` của Expo. Chỉ đặt secret
  trong Supabase Edge Functions. Không thêm thư viện native.
- 29 khóa học trong seed có phần mô tả lặp lại, nên demo cần đánh giá chất lượng thực tế;
  nên viết mô tả riêng cho từng khóa trong đợt cải thiện nội dung sau MVP.
- Với 29 khóa, truy vấn cosine quét trực tiếp. Chỉ thêm HNSW sau khi đo trên tập lớn hơn.

Tài liệu: [Gemini embeddings](https://ai.google.dev/gemini-api/docs/embeddings),
[Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing),
[Supabase Edge Functions auth](https://supabase.com/docs/guides/functions/auth).
Giá Gemini Embedding 2 text trên paid tier là USD 0.20 / 1 triệu input tokens
(kiểm tra lại trước khi dùng billing thật). Không gọi Gemini khi render mỗi card.

## Cách kích hoạt sau khi review

1. Review SQL proposal trên bản sao database, đặc biệt extension `vector`, tên bảng,
   quyền RLS và `checkout_cart()`. Chạy proposal một lần trên môi trường thử.
2. Cấu hình `GEMINI_API_KEY` dưới dạng Supabase secret; `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` và `SUPABASE_SECRET_KEYS` do runtime cung cấp.
   Không đưa các key này vào bundle Expo hoặc Git.
3. Deploy `embed-courses` và `semantic-search`. `supabase/config.toml` tắt platform
   JWT check **chỉ** cho `embed-courses`; handler yêu cầu `apikey` là secret key
   `default` (`sb_secret_...`) hoặc legacy `service_role` của chính project.
   `semantic-search` giữ JWT check và xác minh user lần nữa trong handler.
4. Gọi `embed-courses` bằng admin job với HTTP `POST`, header `apikey` chứa secret
   key, body `{"afterId":0,"limit":10}`. Lặp với `nextAfterId` đến khi null.
   Mỗi lần chạy bỏ qua khóa có cùng `content_hash`; khóa thay đổi sẽ được tạo lại.
   Chỉ chạy lại batch khi nội dung khóa học được cập nhật hoặc theo lịch admin.
5. Kiểm tra `select count(*) from public.course_embeddings` khớp số khóa hợp lệ,
   `model_name` đều là `gemini-embedding-2`, và mỗi vector có 768 chiều.
   Sau đó mới thử app bằng hai tài khoản khác nhau.

## Nguồn sự kiện và giới hạn

| Event | Nguồn |
| --- | --- |
| `course_view` | App ghi sau khi tải chi tiết thành công; chống trùng 30 phút trong phiên app. Chỉ là tín hiệu yếu. |
| `course_search` | Edge Function ghi sau khi xác thực JWT, tối đa 10 lần/phút. Không lưu câu truy vấn. |
| `bookmark`, `add_to_cart`, `enroll`, `lesson_complete` | Trigger database sau INSERT thành công vào bảng nghiệp vụ. |

Client không được ghi các sự kiện nghiệp vụ để cấp quyền học. Chính sách enrollment
miễn phí và `checkout_cart()` cũ vẫn giữ nguyên cho môi trường test. `user_events`
không được dùng làm bằng chứng thanh toán hay hoàn thành bài học. Dữ liệu sự kiện
đề xuất giữ 180 ngày; lệnh xóa theo lịch chưa được tạo để tránh xóa dữ liệu khi chưa duyệt.

## Fallback và giới hạn kết quả

- Similar Courses: dùng vector; nếu chưa có embedding/RPC hoặc API lỗi, dùng cùng danh mục.
- Semantic Search: dùng Edge Function khi đăng nhập, cache ID trong app 5 phút,
  theo từng tài khoản và câu truy vấn; lấy tối đa 60 kết quả rồi phân trang 10 mục tại client. Khi function lỗi,
  không có vector, hoặc chưa đăng nhập, dùng tìm theo tiêu đề hiện có.
- Dành cho bạn: lấy trung bình vector của tối đa 100 sự kiện trong 180 ngày,
  trọng số view 1, bookmark 3, cart 4, enroll 5, lesson complete 6;
  view cùng khóa chỉ tính một lượt, trọng số giảm theo tháng. Loại khóa đã ghi danh.
  User mới được gợi ý theo độ phổ biến, rating và ngày tạo; khi RPC lỗi,
  app dùng danh sách cũ và loại khóa đã ghi danh.
- Việc quay lại tab Trang chủ hoặc kéo làm mới sẽ tính lại gợi ý sau các thao tác.

## Kiểm thử cần chạy sau khi áp dụng SQL

### Quyền và hành vi

1. User A và B: A không đọc được event của B; anon không đọc/ghi event.
2. User A thử INSERT `enroll` hoặc `lesson_complete` vào `user_events`: phải bị từ chối.
3. Bookmark/cart/enroll/lesson progress thành công: đúng một event trên INSERT thật;
   lỗi thao tác hoặc upsert trùng không tạo event mới.
4. JWT sai/hết hạn và gọi Edge Function không có JWT: bị từ chối.
5. Thử timeout Gemini, quota, mất mạng, thiếu embedding: UI vẫn hiện fallback.
6. Kiểm tra enrollment, giỏ hàng và tiến độ vẫn hoạt động như trước.

### Bộ truy vấn demo trên seed (mục tiêu liên quan, chưa phải kết quả đo)

| Câu truy vấn | Khóa kỳ vọng xuất hiện gần đầu |
| --- | --- |
| `học lập trình Python từ đầu` | 3 Python Introduction |
| `thiết kế trải nghiệm người dùng` | 1 UX Foundation, 5 UX Research |
| `xây dựng giao diện ứng dụng điện thoại` | 14 Mobile UI Design, 17 Mobile App Design |
| `tạo trang web đẹp` | 4 Website Design, 11 Web Design |
| `học cơ sở dữ liệu` | 21 SQL for Beginners |
| `chỉnh sửa ảnh bằng Photoshop` | 25 Photoshop Basics |
| `quảng bá sản phẩm trên mạng` | 23 Digital Marketing 101 |
| `giao tiếp bằng tiếng Anh` | 28 English Communication |

Persona để đối chiếu Top-K: (A) lưu khóa 1, 5 và xem 14;
(B) lưu 3, thêm 20 vào giỏ và học 21;
(C) tài khoản mới không có event.
Đăng ký khóa trong persona phải bị loại khỏi gợi ý. Ghi lại thứ tự Top-5 thực tế,
so với mục tiêu liên quan ở trên; không coi bảng trên là kết quả đã xác nhận.

### Số đo cần điền trong buổi demo

Chạy mỗi truy vấn ít nhất 5 lần ở hai trạng thái cache nóng/lạnh. Thu p50/p95 latency
trên thiết bị, `durationMs` do Edge Function trả, số request Gemini từ log, số kết quả
trống, tỷ lệ cache hit và số token/cost từ dashboard Google. Ghi cùng chỉ số cho
tìm kiếm từ khóa cũ để so sánh. Hiện chưa có số liệu từ Supabase/Gemini thật.
