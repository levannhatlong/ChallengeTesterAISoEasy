# Nhật ký Hoạt động AI (AI Worklog)

Tài liệu này ghi chép lại toàn bộ quá trình sử dụng các công cụ trí tuệ nhân tạo (LLM) để hỗ trợ phân tích, xây dựng chiến lược kiểm thử và sinh danh sách kịch bản test cho dự án Quản lý biến động toàn cầu.

## 1. Công cụ AI đã sử dụng
* **ChatGPT / Claude:** Dùng để phân tích rủi ro hệ thống RAG, sinh danh sách test cases tập trung vào hiện tượng ảo giác (hallucination) và xử lý dữ liệu ngoài phạm vi.

## 2. Cách thức AI hỗ trợ
* **Giai đoạn phân tích:** Yêu cầu AI đưa ra các thách thức đặc thù khi kiểm thử chatbot hỏi đáp dựa trên dữ liệu bài báo cào về.
* **Giai đoạn sinh kịch bản:** Cung cấp bối cảnh dự án để AI liệt kê các trường hợp kiểm thử biên (edge cases), kiểm thử đầu vào và các trường hợp ngoại lệ.

## 3. Các kết quả đầu ra chưa chính xác của AI và cách khắc phục
* **Vấn đề:** Ban đầu, các test case do AI sinh ra mang tính chung chung, áp dụng cho phần mềm truyền thống (như kiểm tra form đăng nhập, kiểm tra tốc độ phản hồi thông thường) mà thiếu đi các đặc thù của kiểm thử AI.
* **Cách khắc phục:** Viết lại prompt chi tiết hơn, giới hạn rõ ràng rằng hệ thống sử dụng mô hình nhỏ và dữ liệu cào hạn chế, từ đó yêu cầu AI tập trung sâu vào các tiêu chí: kiểm thử độ chính xác trích xuất thông tin, kiểm thử hành vi khi thiếu dữ liệu và kiểm thử giới hạn ngữ nghĩa.

## 4. Kế hoạch cải thiện trong 7 ngày tới
* Mở rộng thêm tập dữ liệu bài báo giả lập để kiểm tra khả năng chịu tải của mô hình.
* Tự động hóa một số kịch bản kiểm thử hỏi đáp lặp lại bằng script Python để tiết kiệm thời gian thực thi.
