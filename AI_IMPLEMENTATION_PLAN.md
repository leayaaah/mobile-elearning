# Kế hoạch giai đoạn 2: Tích hợp AI cho E-Learning App

**Ngày lập:** 03/11/2026  
**Phạm vi:** Bổ sung AI vào ứng dụng hiện tại, không viết lại các màn hình đã hoàn thành.  
**Stack:** Expo / React Native, TypeScript, Expo Router, Supabase Auth + PostgreSQL + RLS, pgvector, Edge Functions (khi cần).

## 0. Hiện trạng và nguyên tắc

Theo kế hoạch cũ, ứng dụng có đăng nhập, trang chủ, tìm kiếm, chi tiết khóa học, giỏ hàng, ghi danh miễn phí phục vụ test, màn học, tiến độ, hồ sơ và hồ sơ giảng viên. README mô tả trạng thái tại thời điểm tạo bộ khung; người phát triển cho biết hiện đã gần hoàn thành. **Phải kiểm tra repo thực tế trước khi sửa**, không xem các mục TODO cũ là trạng thái hiện tại.

- Giữ luồng đăng nhập, giỏ hàng, enrollment, lesson_progress, my_courses và UI hiện có.
- Không dùng service role key hay AI API key trong app Expo; secret chỉ nằm ở Edge Functions/backend.
- Không tắt RLS. Tracking do client gửi chỉ là tín hiệu tham khảo, không phải bằng chứng thanh toán hoặc hoàn thành bài học.
- Chạy `npx expo lint`, `npx tsc --noEmit`, kiểm thử Expo trên thiết bị và kiểm tra các trạng thái loading/error/empty.
- Ngày 03/11 và 05/11 trong kế hoạch cũ là mốc nộp: xác nhận lại deadline trước khi mở rộng phạm vi. Nếu vẫn phải nộp 05/11, chỉ nên làm MVP nhỏ và demo riêng, không hứa hoàn thành toàn bộ AI.

## 1. Mục tiêu và phạm vi ưu tiên

### MVP bắt buộc
1. **Tracking hành vi:** ghi `course_view`, `course_search` (ẩn danh hoặc đã đăng nhập theo thiết kế), `bookmark`, `add_to_cart`, `enroll`, `lesson_complete` theo đúng nguồn sự kiện.
2. **Embedding khóa học:** tạo và lưu embedding từ title, description, category (có thể thêm teacher/headline nếu hữu ích).
3. **Similar Courses:** đề xuất khóa học tương tự tại trang chi tiết bằng cosine similarity, loại trừ khóa hiện tại.
4. **Semantic Search:** chuyển truy vấn thành embedding, tìm khóa học theo ý nghĩa; có fallback tìm kiếm từ khóa.
5. **Personalized Recommendation:** xếp hạng theo vector sở thích tạo từ tương tác có trọng số, loại trừ khóa đã ghi danh; có fallback phổ biến/mới cho user chưa có lịch sử.

### Mở rộng sau MVP
- Chatbot RAG hỏi đáp bài học khi có transcript/tài liệu thật, kiểm tra quyền enrollment.
- Quiz AI và đánh giá năng lực khi có cấu trúc quiz/attempts.
- Lộ trình học cá nhân hóa và A/B testing khi đã đủ dữ liệu.

## 2. Kiến trúc đề xuất

```
Expo screens/components
  -> src/services/{tracking,search,recommendation}Service.ts
  -> Supabase Auth + RLS / Edge Functions
  -> PostgreSQL: courses, user_events, course_embeddings
  -> pgvector similarity RPC

Background/admin job -> embedding model -> course_embeddings
User query -> protected Edge Function -> embedding model -> similarity RPC
User events -> aggregate weighted course embeddings -> user preference -> rank
```

- **Embedding model:** chọn một mô hình duy nhất và cố định dimension (ví dụ 1536), lưu `model_name`, `content_hash`, `updated_at` để biết khi nào phải tái tạo.
- **Vector khóa học:** tạo offline/batch lần đầu; chỉ tạo lại khi nội dung thay đổi.
- **Vector user:** MVP tính theo yêu cầu từ các khóa user tương tác, có giới hạn số sự kiện; chỉ thêm cache/bảng `user_preferences` khi hiệu năng đòi hỏi.
- **Trọng số gợi ý ban đầu:** view=1, bookmark=3, cart=4, enroll=5, lesson_complete=6; có giới hạn lặp view, giảm trọng số theo thời gian, chuẩn hóa vector; hiệu chỉnh sau kiểm thử.
- **Chi phí:** cache embedding và giới hạn số lần gọi API; tránh gọi embedding mỗi lần render màn hình.

## 3. Database và bảo mật

### 3.1 Migration (không chạy lại schema gốc trên DB đang có dữ liệu)
- Bật extension `vector` nếu project hỗ trợ.
- `user_events(id, user_id, course_id, event_type, metadata, created_at)`; index `(user_id, created_at desc)` và `(course_id, event_type)`; định nghĩa enum/check cho event_type và chính sách retention.
- `course_embeddings(course_id primary key, embedding vector(D), model_name, content_hash, updated_at)`; không để client tự ghi vector.
- Tùy quy mô: `user_preferences(user_id primary key, embedding vector(D), event_count, updated_at)`.
- RPC `match_courses(query_embedding, match_count, exclude_course_ids)` trả `course_id`, `similarity`, chỉ trả metadata công khai; validate `match_count` và kích thước đầu vào.
- Index vector HNSW khi dữ liệu đủ lớn; với dữ liệu seed nhỏ có thể bắt đầu bằng exact search và đo hiệu năng trước.

### 3.2 RLS / quyền
- `user_events`: user chỉ đọc/ghi sự kiện của chính mình, không tự ghi event nhạy cảm như `enroll`/`lesson_complete` để dùng làm nguồn tin cậy; những event này nên phát sinh từ thao tác backend/database đã xác nhận.
- `course_embeddings`: không cho client INSERT/UPDATE/DELETE; chỉ truy cập qua RPC/Edge Function theo nhu cầu.
- `user_preferences`: chỉ chủ sở hữu được đọc, hệ thống mới được cập nhật.
- Edge Functions xác thực JWT, giới hạn tần suất và xác minh quyền học viên khi truy xuất nội dung bài học.
- **Enrollment:** giữ chính sách ghi danh miễn phí chỉ trong môi trường phát triển; không dùng sự kiện tracking để cấp quyền học. Khi thanh toán thật, chỉ backend có xác minh thanh toán được tạo enrollment; kiểm tra cả `checkout_cart()` giả lập hiện có.

## 4. Các bước triển khai theo phụ thuộc

### Bước A. Kiểm kê và chốt baseline (0.5 ngày)
- [ ] Kiểm tra repo thực tế: các màn đã hoàn thành, tên service, schema, seed, Expo SDK, session/auth.
- [ ] Tạo nhánh `feature/ai-recommendation` và backup database.
- [ ] Chốt embedding provider, dimension, ngân sách API và quyền truy cập.
- **Xong khi:** app hiện tại chạy ổn; không thay đổi hành vi cũ.

### Bước B. Tracking (0.5–1 ngày)
- [ ] Migration `user_events`, index, RLS và event validation.
- [ ] `src/services/trackingService.ts`: `trackEvent` typed, không chặn UI nếu tracking lỗi.
- [ ] Gắn `course_view` tại chi tiết; các event còn lại tại service/action tương ứng, tránh ghi trùng khi re-render.
- [ ] Thêm throttle/dedupe view; không lưu PII vào `metadata`.
- **Xong khi:** hai user có dữ liệu tách biệt; không ghi trùng do render; event nhạy cảm không bị giả mạo để cấp quyền.

### Bước C. Course embedding (1 ngày)
- [ ] Migration `course_embeddings`, quyền truy cập, RPC tìm vector.
- [ ] Viết Edge Function/admin script tạo embedding theo batch, không nhúng API key vào Expo.
- [ ] Tạo embedding cho seed data; tái tạo khi `content_hash` thay đổi.
- [ ] Kiểm tra dimension, null/empty description, API retry và chi phí.
- **Xong khi:** mỗi khóa học hợp lệ có đúng một embedding và tìm được Top-K gần nghĩa.

### Bước D. Similar Courses (0.5 ngày)
- [ ] `src/services/recommendationService.ts`: `getSimilarCourses(courseId, limit)`.
- [ ] Gắn vào màn `course/[id]`, tận dụng `CourseCard` và trạng thái UI hiện có.
- [ ] Loại khóa đang xem, xử lý dữ liệu ít hơn K, fallback theo category.
- **Xong khi:** khóa học tương tự hiển thị hợp lý, không phá màn chi tiết cũ.

### Bước E. Semantic Search (1 ngày)
- [ ] Protected Edge Function nhận query, chuẩn hóa và giới hạn độ dài.
- [ ] Tạo query embedding, gọi RPC similarity, trả kết quả có phân trang/giới hạn.
- [ ] Kết hợp lexical search nếu cần (hybrid), fallback khi AI API lỗi.
- [ ] Tái sử dụng `useDebounce`, `searchCourses`, FlatList và các trạng thái UI hiện tại.
- **Xong khi:** câu hỏi không trùng từ khóa vẫn tìm được khóa phù hợp; không gọi API mỗi ký tự.

### Bước F. Personalized Recommendation (1–1.5 ngày)
- [ ] Tổng hợp hành vi có trọng số theo course, giới hạn spam và recency.
- [ ] Lấy embedding khóa liên quan, tạo vector sở thích chuẩn hóa.
- [ ] Tính similarity, kết hợp điểm popularity/quality nếu cần, lọc khóa đã ghi danh.
- [ ] Gắn khu vực “Dành cho bạn” ở Trang chủ/Tìm kiếm; cold-start dùng danh mục hoặc khóa phổ biến.
- [ ] Có cơ chế làm mới khi bookmark/enroll/hoàn thành bài học.
- **Xong khi:** hai user có lịch sử khác nhau nhận danh sách khác nhau; user mới vẫn có kết quả.

### Bước G. Kiểm thử, đo lường, tài liệu (1 ngày)
- [ ] Kiểm tra RLS với 2 tài khoản, user đăng xuất, sai JWT, event giả, API timeout.
- [ ] Kiểm tra ranking bằng 5–10 câu truy vấn và 3 persona học viên; lưu expected Top-K.
- [ ] Đo latency p50/p95, số API calls, chi phí embedding, cache hit, tỷ lệ kết quả trống.
- [ ] Chạy lint/typecheck và smoke test Android/iOS/web nếu môi trường hỗ trợ.
- [ ] Cập nhật `supabase/schema.sql`/migration, README, tài liệu kiến trúc và video demo.
- **Xong khi:** app cũ vẫn chạy, luồng AI có fallback và có số liệu demo.

**Ước lượng tổng:** khoảng 5.5–6.5 ngày làm việc cho MVP, chưa tính sửa lỗi phát sinh hoặc thay đổi scope.

## 5. Cấu trúc file dự kiến

```
src/services/trackingService.ts
src/services/recommendationService.ts
src/services/semanticSearchService.ts
src/types/ai.ts
src/hooks/useRecommendations.ts          # chỉ khi thực sự cần
src/components/SimilarCourses.tsx        # tái dùng CourseCard
supabase/migrations/*_ai_tracking.sql
supabase/migrations/*_course_embeddings.sql
supabase/functions/embed-courses/         # admin/background
supabase/functions/semantic-search/       # user request
supabase/functions/recommend-courses/     # nếu xử lý server-side
```

Tất cả tên file là **đề xuất**, cần đối chiếu cấu trúc repo trước khi tạo. Giữ TypeScript strict, tách data access khỏi UI, không thêm dependency nếu không cần.

## 6. Thứ tự ưu tiên khi thiếu thời gian

1. **MVP rút gọn:** Course embedding + Similar Courses; tracking ghi dữ liệu cơ bản.
2. **Bản trình diễn AI:** thêm Semantic Search và 5–10 truy vấn kiểm thử.
3. **Bản cá nhân hóa:** Personalized Recommendation theo tracking.
4. **Sau đó:** Chatbot RAG, Quiz AI.

## 7. Tiêu chí nghiệm thu cuối

- [ ] Không thay đổi chức năng ghi danh, giỏ hàng, tiến độ, đăng nhập hiện có.
- [ ] RLS không cho user đọc dữ liệu tracking của người khác.
- [ ] API key không nằm trong bundle Expo.
- [ ] Vector đúng model/dimension và cập nhật được khi khóa học đổi nội dung.
- [ ] Similar Courses và Semantic Search có kết quả, loading/error/empty/fallback.
- [ ] Recommendation cá nhân hóa có cold-start, loại khóa đã ghi danh.
- [ ] Có số liệu latency, số request và ví dụ so sánh trước/sau.
- [ ] README, migration và hướng dẫn demo được cập nhật.
