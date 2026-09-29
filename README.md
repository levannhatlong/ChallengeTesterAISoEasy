# Báo cáo Kiểm thử Phần mềm AI: Hệ thống Quản lý Biến động Toàn cầu (CMapCheck Global Pulse)

Kho lưu trữ này chứa tài liệu chiến lược kiểm thử, báo cáo lỗi và mã nguồn dự án quản lý biến động toàn cầu, tập trung vào việc đánh giá năng lực của tính năng Chatbot hỏi đáp tự do tích hợp cơ chế cào dữ liệu bài báo tự động.

---

## 1. Tổng quan dự án & Lý do lựa chọn
* **Mô tả dự án:** Hệ thống cào thông tin các bài báo quốc tế về biến động toàn cầu, lưu trữ và cung cấp tính năng chatbot hỏi đáp tự do để người dùng tra cứu thông tin sự kiện.
* **Lý do lựa chọn:** Đây là một bài toán thực tế về ứng dụng RAG (Retrieval-Augmented Generation) và xử lý ngôn ngữ tự nhiên, phản ánh đúng các thách thức trong kiểm thử AI hiện đại (xác suất phản hồi, hiện tượng ảo giác, giới hạn nguồn dữ liệu).
* **Phạm vi kiểm thử:** Tập trung vào module Chatbot hỏi đáp tự do và cơ chế tiếp nhận dữ liệu đầu vào từ các bài báo được cào về.

## 2. Kiến trúc & Giải pháp
* **Luồng dữ liệu:** Hệ thống thực hiện cào dữ liệu bài báo từ các nguồn tin quốc tế $\rightarrow$ Tiền xử lý văn bản $\rightarrow$ Lưu trữ cơ sở dữ liệu $\rightarrow$ Mô hình AI tiếp nhận câu hỏi người dùng, truy xuất dữ liệu liên quan và sinh câu trả lời.
* **Đặc thù kỹ thuật:** Sử dụng các mô hình AI có năng lực trung bình (không phải siêu mô hình thương mại), dẫn đến các giới hạn về khả năng suy luận phức tạp.

## 3. Quy trình sử dụng AI (AI Workflow)
* **Công cụ hỗ trợ:** Sử dụng các trợ lý AI (ChatGPT / Claude) trong suốt quá trình phân tích hệ thống, xác định rủi ro đặc thù của mô hình nhỏ và sinh danh sách các kịch bản kiểm thử.
* **Chi tiết quy trình:** Xem chi tiết tại tệp [AI_WORKLOG.md](./AI_WORKLOG.md).

## 4. Các giới hạn thực tế của dự án
* **Phạm vi dữ liệu hẹp:** Cơ sở dữ liệu bài báo còn giới hạn, dễ dẫn đến thiếu hụt thông tin khi người dùng hỏi các sự kiện ngách.
* **Năng lực mô hình:** Mô hình dễ gặp hiện tượng ảo giác (tự bịa thông tin) khi cố gắng trả lời các câu hỏi vượt quá tập dữ liệu được cung cấp hoặc khi gặp các cấu trúc câu hỏi mập mờ, phức tạp.

## 5. Tài liệu sản phẩm kiểm thử
Toàn bộ danh sách kiểm thử chi tiết (tối thiểu 15 test cases) và báo cáo lỗi (Bug Reports) được đính kèm tại thư mục tài liệu hoặc tệp PDF trong kho lưu trữ:
* **Chi tiết Test Cases:** Xem tại thư mục `docs/Test_Cases.pdf`
* **Báo cáo lỗi (Bug Reports):** Xem tại thư mục `docs/Bug_Reports.pdf`
