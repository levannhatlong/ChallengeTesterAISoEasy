# Báo cáo Kiểm thử Phần mềm AI: Hệ thống Quản lý Biến động Toàn cầu (CMapCheck Global Pulse)

Ở đây chứa mục tiêu kiểm thử, báo cáo lỗi và mã nguồn dự án quản lý biến động toàn cầu, tập trung vào việc đánh giá năng lực của tính năng Chatbot hỏi đáp tích hợp cơ chế cào dữ liệu bài báo tự động.

---

## 1. Tổng quan dự án & Lý do lựa chọn
* **Mô tả dự án:** Hệ thống cào thông tin các bài báo về các nội dung biến động toàn cầu và cho phép link tới bài báo chính thống, dữ liệu sẽ được cập nhật theo mỗi lần Run project. Cung cấp tính năng Chatbot hỏi đáp để người dùng tra cứu thông tin sự kiện.
* **Lý do lựa chọn:** Đây là một bài toán thực tế về ứng dụng RAG (Retrieval-Augmented Generation) và xử lý ngôn ngữ tự nhiên, phản ánh đúng các thách thức trong kiểm thử AI hiện đại (xác suất phản hồi, phạm vi phản hồi, ảo thông tin,...).
* **Phạm vi kiểm thử:** Tập trung vào chức năng Chatbot hỏi đáp và cơ chế tiếp nhận, lọc và hiển thị dữ liệu đầu vào từ các bài báo được cào về.

## 2. Kiến trúc & Giải pháp
* **Luồng dữ liệu:** Hệ thống thực hiện cào bài báo từ các nguồn chính thống, có bộ lọc phân chia theo ngày và chỉ tập trung chọn lọc các thông tin mang tính nghiêm trọng hoặc đặc biệt quan tâm (loại bỏ các bài báo lẻ tẻ, thông thường) $\rightarrow$ Tiền xử lý văn bản $\rightarrow$ Lưu trữ cơ sở dữ liệu.
* **Đặc thù kỹ thuật & Chatbot:** Chatbot sử dụng API của Google làm nền tảng cốt lõi với phạm vi hỏi đáp khá rộng (không bị gò bó hoàn toàn trong các biến động toàn cầu) và các câu trả lời không bắt buộc phải phụ thuộc hoàn toàn vào dữ liệu bài báo đã cào. Tuy nhiên, hệ thống vẫn tồn tại điểm hạn chế là trí tuệ và phạm vi kiến thức còn hơi hẹp, cùng với tốc độ phản hồi không quá nhanh.

## 3. Quy trình sử dụng AI (AI Workflow)
* **Công cụ hỗ trợ:** Sử dụng các trợ lý AI (ChatGPT / Gemini) trong suốt quá trình phân tích hệ thống, xác định rủi ro đặc thù của mô hình nhỏ và sinh danh sách các kịch bản kiểm thử. Đồng thời tận dụng các trợ lý AI để viết các test case và bug reports cụ thể.
* **Chi tiết quy trình:** Xem chi tiết tại tệp [AI_WORKLOG.md](./AI_WORKLOG.md).

## 4. Các giới hạn thực tế của dự án
* **Đặc thù bộ lọc dữ liệu:** Do hệ thống chỉ tập trung chọn lọc các bài báo mang tính nghiêm trọng hoặc đặc biệt quan tâm và loại bỏ các tin tức lẻ tẻ, cơ sở dữ liệu sẽ thiếu hụt thông tin chi tiết khi người dùng tra cứu về các sự kiện nhỏ, ngách hoặc mang tính đời thường. Bên cạnh đó, hệ thống hiện tại vẫn còn hạn chế về nguồn dữ liệu, phạm vi dữ liệu bị thu hẹp tỏng một phạm vi địa lý nhất định.
* **Năng lực mô hình & Tốc độ:** Vì sử dụng API của Google, giới hạn cả về phạm vi dữ liệu, tài nguyên và không bắt buộc phải bám sát dữ liệu bài báo đã cào, mặc dù có thể hỏi đáp tự do nhưng mô hình có xu hướng ảo thông tin (tự bịa thông tin) khi đối mặt với các câu hỏi phức tạp vượt quá tầm kiểm soát. Thêm vào đó, tốc độ phản hồi của hệ thống không quá nhanh, dễ ảnh hưởng đến trải nghiệm hỏi đáp thời gian thực của người dùng.

## 5. Tài liệu sản phẩm kiểm thử
Toàn bộ danh sách kiểm thử chi tiết và báo cáo lỗi được đính kèm tại thư mục tài liệu hoặc tệp PDF trong link:
* **Chi tiết Test Cases:** Xem tại thư mục `docs/Test_Cases.pdf`
* **Chi tiết Bug Reports:** Xem tại thư mục `docs/Bug_Reports.pdf`
