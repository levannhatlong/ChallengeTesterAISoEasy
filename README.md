# Báo cáo Kiểm thử Phần mềm AI: Hệ thống CMapCheck Global Pulse

Repository này chứa mục tiêu kiểm thử, báo cáo lỗi và mã nguồn dự án **CMapCheck Global Pulse**, tập trung vào việc đánh giá năng lực của tính năng Chatbot hỏi đáp thông minh kết hợp cơ chế RAG (Retrieval-Augmented Generation) dựa trên dữ liệu cào tự động từ các nguồn báo chí chính thống.

---

## 1. Tổng quan dự án & Lý do lựa chọn
* **Mô tả dự án:** Ứng dụng web toàn diện theo dõi tin tức biến động toàn cầu, tích hợp tự động cào tin tức từ RSS feeds của các báo lớn (VnExpress, Tuổi Trẻ, Thanh Niên, Nhân Dân) bám theo 13 quốc gia trọng điểm khi khởi động dự án. Cung cấp tính năng Chatbot (sử dụng Google Gemini AI `gemini-2.5-flash`) kết hợp RAG để người dùng tra cứu thông tin sự kiện, bên cạnh các tính năng nâng cao như tạo ảnh, tóm tắt quốc gia và xuất báo cáo đa định dạng (PDF, Excel, PowerPoint).
* **Lý do lựa chọn:** Đây là một bài toán thực tế điển hình về ứng dụng RAG và xử lý ngôn ngữ tự nhiên, phản ánh đúng các thách thức trong kiểm thử AI hiện đại (xác suất phản hồi, hiện tượng ảo thông tin, quản lý bối cảnh dữ liệu ngắn hạn 7 ngày).
* **Phạm vi kiểm thử:** Tập trung vào chức năng Chatbot hỏi đáp, cơ chế tiếp nhận và lọc dữ liệu từ scraper, các API AI phụ trợ và tính năng xuất báo cáo.

## 2. Kiến trúc & Giải pháp
* **Luồng dữ liệu & Lưu trữ:** Hệ thống sử dụng Flask backend kết hợp PostgreSQL 15 chạy trong Docker container. Tiến trình `scraper.py` tự động cào tin tức từ RSS feeds, lọc phân chia theo từ khóa của 13 quốc gia, đồng thời có cơ chế tự động dọn dẹp tin cũ quá 7 ngày và loại bỏ tin trùng lặp.
* **Đặc thù kỹ thuật & Chatbot (RAG):** Chatbot sử dụng mô hình Google Gemini (`gemini-2.5-flash`) với cơ chế RAG (lấy dữ liệu tin tức 7 ngày qua từ database làm bối cảnh). Phạm vi hỏi đáp khá rộng, không bị gò bó hoàn toàn trong các biến động toàn cầu và câu trả lời không bắt buộc phải phụ thuộc cứng nhắc vào dữ liệu cào về. Tuy nhiên, hệ thống vẫn tồn tại giới hạn về phạm vi kiến thức tổng quát và tốc độ phản hồi không quá nhanh.

## 3. Quy trình sử dụng AI (AI Workflow)
* **Công cụ hỗ trợ:** Sử dụng các trợ lý AI (ChatGPT / Gemini) trong suốt quá trình phân tích hệ thống, xác định rủi ro đặc thù của mô hình RAG và sinh danh sách kịch bản kiểm thử, test cases cụ thể cùng các bug reports.
* **Chi tiết quy trình:** Xem chi tiết tại tệp [AI_WORKLOG.md](./AI_WORKLOG.md).

## 4. Các giới hạn thực tế của dự án
* **Đặc thù bộ lọc dữ liệu:** Hệ thống tập trung chọn lọc các bài báo mang tính nghiêm trọng hoặc đặc biệt quan trọng và loại bỏ tin rác/trùng lặp, dẫn đến việc cơ sở dữ liệu sẽ thiếu hụt thông tin khi người dùng tra cứu về các sự kiện nhỏ, ngách hoặc đời thường. Nguồn dữ liệu cũng bị giới hạn trong phạm vi 13 quốc gia và chu kỳ lưu trữ 7 ngày gần nhất.
* **Năng lực mô hình & Tốc độ:** Do sử dụng API Gemini với cơ chế hỏi đáp mở và không bắt buộc bám sát 100% dữ liệu cào, mô hình có xu hướng gặp hiện tượng ảo thông tin (tự bịa thông tin) khi đối mặt với các câu hỏi phức tạp vượt quá tầm kiểm soát. Thêm vào đó, tốc độ phản hồi của hệ thống không quá nhanh, ảnh hưởng phần nào đến trải nghiệm người dùng thời gian thực.

## 5. Tài liệu sản phẩm kiểm thử
Toàn bộ danh sách kiểm thử chi tiết và báo cáo lỗi được đính kèm trong link:
* **Chi tiết Test Cases:** Xem tại tệp/thư mục `docs/Test_Cases.pdf`
* **Chi tiết Bug Reports:** Xem tại tệp/thư mục `docs/Bug_Reports.pdf`
