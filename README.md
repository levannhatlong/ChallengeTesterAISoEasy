# Báo cáo Kiểm thử Phần mềm: Hệ thống CMapCheck Global Pulse

Repository này chứa tài liệu kiểm thử, báo cáo lỗi và phân tích kỹ thuật dự án **CMapCheck Global Pulse** phục vụ cho bài test vị trí Software Tester / QA. Tài liệu tập trung đánh giá chất lượng hệ thống, chiến lược kiểm thử luồng dữ liệu tự động (Data Pipeline), cơ chế RAG (Retrieval-Augmented Generation) và tính năng xuất báo cáo đa định dạng.

---

## 1. Tổng quan dự án & Mục tiêu kiểm thử
* **Mô tả hệ thống dưới góc độ QA:** Ứng dụng web giám sát tích hợp bản đồ GIS (**Leaflet.js**), luồng cào dữ liệu tự động từ RSS feeds (`scraper.py`), kết nối PostgreSQL qua Docker và tích hợp tầng AI (**Google Gemini AI**). Hệ thống có độ phức tạp cao với kiến trúc đa tầng (Multi-tier), kết hợp giữa dữ liệu cấu trúc (SQL) và dữ liệu phi cấu trúc (LLM).
* **Mục tiêu kiểm thử:** 
  * Đánh giá tính chính xác và độ ổn định của luồng cào dữ liệu, cơ chế lọc tin (deduplication, auto-cleanup sau 7 ngày).
  * Kiểm thử tính toàn vẹn và hành vi của mô hình AI khi áp dụng RAG (truy xuất context bài báo để chatbot trả lời).
  * Kiểm tra khả năng xử lý ngoại lệ của các API RESTful, tính năng tạo ảnh và xuất báo cáo (PDF, Excel, PPTX).
* **Phạm vi kiểm thử (Test Scope):**
  * **Module Scraper & Data Pipeline:** Kiểm thử cơ chế cào đa luồng (`ThreadPoolExecutor`), bộ lọc từ khóa (`TRIVIAL_KEYWORDS` vs `HIGH_IMPACT_KEYWORDS`), và xử lý dữ liệu trùng lặp.
  * **Module RAG & AI Chatbot (`/api/chat`):** Kiểm thử khả năng nạp context, hiện tượng ảo giác (hallucination) khi thiếu dữ liệu, và cơ chế fallback khi mất kết nối API.
  * **Module GIS & RESTful APIs:** Kiểm thử các endpoint trả dữ liệu điểm rủi ro (`/api/risk-scores`), dữ liệu bản đồ và cache.
  * **Module Report Export & Content Generation:** Kiểm thử tính toàn vẹn của file xuất (`.pdf`, `.xlsx`, `.pptx`) và API sinh ảnh (`Pollinations.ai`).

## 2. Phân tích Rủi ro & Kiến trúc từ góc nhìn QA
* **Đặc thù dữ liệu & Rủi ro tích hợp:**
  * *Non-deterministic Behavior (Tính bất định của AI):* Phản hồi từ Gemini AI không cố định, dễ dẫn đến lệch định dạng JSON cấu trúc điểm số rủi ro hoặc sinh thông tin sai lệch (hallucination) khi quốc gia được hỏi không có bài báo nào trong 7 ngày gần nhất.
  * *Dependency Risk (Phụ thuộc bên thứ ba):* Luồng cào dữ liệu phụ thuộc hoàn toàn vào cấu trúc RSS của các báo lớn; thay đổi HTML/RSS hoặc chặn bot (Cloudflare) sẽ làm gián đoạn pipeline.
  * *Performance & Latency:* Các tác vụ đồng bộ (gọi LLM kết hợp render ReportLab PDF hoặc gọi API sinh ảnh) gây độ trễ lớn (3–8 giây), tiềm ẩn nguy cơ timeout hoặc chạm trần Rate Limit (HTTP 429) của API miễn phí.

## 3. Chiến lược kiểm thử & Phương pháp thực hiện
* **Kỹ thuật thiết kế Test Case:** Áp dụng phương pháp phân vùng tương đương (Equivalence Partitioning) và giá trị biên (Boundary Value Analysis) cho các bộ lọc ngày, bộ lọc từ khóa và phân tích điểm số rủi ro từ 0 đến 100.
* **Quy trình Quản lý lỗi (Bug Lifecycle):** Phân loại lỗi theo mức độ nghiêm trọng (Blocker, Critical, Major, Minor) với các tiêu chí rõ ràng về hành vi tái hiện, log lỗi từ Docker container và phản hồi HTTP Status Code.
* **Công cụ hỗ trợ:** Sử dụng giao diện web trực quan, kiểm thử thủ công trực tiếp trên trình duyệt, kết hợp với các thao tác cơ bản trên DBeaver để kiểm tra dữ liệu dưới database và sự hỗ trợ của AI để gợi ý kịch bản test.

## 4. Các giới hạn thực tế ghi nhận qua quá trình Test
* **Giới hạn về dữ liệu:** Cơ chế tự động dọn rác giới hạn dữ liệu trong vòng 7 ngày, không hỗ trợ kiểm thử truy xuất dữ liệu lịch sử dài hạn (theo tháng/quý).
* **Giới hạn về xử lý đồng bộ:** Chưa áp dụng hàng đợi (Queue) cho các tác vụ nặng như xuất file báo cáo hoặc gọi AI, dẫn đến hiện tượng nghẽn khi có nhiều request đồng thời.

## 5. Tài liệu đính kèm
* **Chi tiết Ma trận Test Cases:** Xem tại tệp [Test_Cases_Matrix.md](./docs/test_cases/Test_Cases_Matrix.md) (hoặc tệp PDF đính kèm qua Google Drive).
* **Chi tiết Báo cáo lỗi (Bug Reports):** Xem tại tệp [Bug_Report_Log.md](./docs/bug_reports/Bug_Report_Log.md) (hoặc tệp PDF đính kèm qua Google Drive).
* **Nhật ký hoạt động AI:** Xem tại tệp [AI_WORKLOG.md](./AI_WORKLOG.md).
