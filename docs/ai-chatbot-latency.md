# Đo độ trễ chatbot

Hai mẫu đầu tiên cho thấy tổng server 2694 và 3132 ms; Gemini chat chiếm 751 và
1244 ms. Lượt đầu có chênh lệch client/server 2358 ms, lượt sau 258 ms.
Chưa đủ mẫu để kết luận p50/p95 hoặc quy chênh lệch lượt đầu riêng cho cold start.
Bản đo chỉ ghi số mili giây, số token, trạng thái và nguồn `ai`/`fallback`;
không ghi tin nhắn, JWT, API key hay metadata người dùng.

## Bật bộ đo tạm thời

1. Deploy phiên bản mới của `chat-advisor` lên môi trường thử.
2. Trong Supabase Edge Function Secrets, đặt `DEBUG_TIMINGS=1`. Chỉ bật trong buổi đo;
   khi bật, mọi phản hồi của `chat-advisor` có thêm `timings` và Function ghi log
   `event: chat_timing`.
3. Chạy app ở chế độ development. Console sẽ ghi `[chat-timing]` gồm `clientMs`,
   `server` và `source` khi nhận được timings.
4. Sau buổi đo, xóa secret `DEBUG_TIMINGS` hoặc đặt lại `0`.

Các chặng server: `auth` (xác thực JWT), `usage` (quota), `enrolled` (khóa đã ghi danh),
`embed` (Gemini embedding, gồm retry nếu có), `match` (RPC vector),
`candidates` (metadata DB), `prompt` (dựng payload), `llm` (gọi và parse Gemini chat),
`total` (toàn handler). `prompt` nằm trong `llm`, nên không cộng hai số này với nhau.
`inputTokens`/`outputTokens` có thể vắng nếu model lỗi trước khi trả usage.
Sau bản tối ưu đầu tiên, `enrolled` và `embed` chạy song song sau khi quota được
chấp thuận. Vì vậy tổng server không bằng tổng các chặng; với hai mẫu trước đó,
thay đổi này dự kiến tiết kiệm tối đa khoảng 210–471 ms nếu các chặng khác giữ nguyên.

## Lấy mẫu và phân tích

- Dùng khoảng 8–10 câu đại diện trong [bộ câu thử](ai-chatbot-test-cases.md),
  mỗi câu 2 lần trên cùng thiết bị/mạng. Quota hiện là 30 lượt/user/ngày UTC;
  không vượt quota hoặc dùng tài khoản thử khác cho lượt bổ sung.
- So sánh lần đầu sau một thời gian không gọi Function với hai lần gọi liền sau.
  `clientMs - total` gồm mạng, gateway, cold start và overhead phía client;
  chỉ từ hiệu số này không thể khẳng định riêng cold start.
- Sao chép các dòng JSON `chat_timing` từ Edge Function Logs vào `timings.jsonl`,
  mỗi dòng một object, rồi chạy `node scripts/chat-timing-stats.mjs timings.jsonl`.
  Script in p50/p95 cho từng chặng và số lần fallback; không lưu file đo có nội dung chat.
- Nếu `llm` chiếm phần lớn, xem số token và thời gian Gemini. Nếu `embed` chậm,
  xem retry/quota của embedding. Nếu chặng DB chậm, xem vùng triển khai và truy vấn.
  Nếu chỉ `clientMs` cao, kiểm tra mạng, gateway và lần khởi tạo đầu tiên.

Để so sánh trước/sau tối ưu, dùng cùng bộ câu, cùng thiết bị/mạng và ghi cả p95.
