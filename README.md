# Báo cáo Kiểm thử Phần mềm: Hệ thống CMapCheck Global Pulse

Repository này chứa tài liệu kiểm thử, báo cáo lỗi và phân tích dự án **CMapCheck Global Pulse** phục vụ cho bài test vị trí Software Tester / QA. Tài liệu tập trung đánh giá chất lượng hệ thống, cách kiểm tra tính năng cào tin tức tự động, chatbot hỏi đáp thông minh và các chức năng xuất báo cáo.

---

## 1. Tổng quan dự án & Mục tiêu kiểm thử
* **Mô tả hệ thống:** Ứng dụng web theo dõi tin tức bao gồm bản đồ tương tác, tính năng cào bài báo tự động từ các nguồn báo chí chính thống, kết nối cơ sở dữ liệu PostgreSQL qua Docker và tích hợp AI để hỗ trợ hỏi đáp, tạo ảnh và tóm tắt.
* **Mục tiêu kiểm thử:** 
  * Kiểm tra xem tính năng cào dữ liệu có hoạt động chính xác không, bộ lọc tin tức có loại bỏ đúng các bài viết không quan trọng và thực hiện lọc chính xác hay không.
  * Đánh giá khả năng trả lời của chatbot (dựa trên dữ liệu tin tức được nạp vào) và kiểm tra hiện tượng chatbot tự bịa thông tin.
  * Kiểm tra các chức năng trên giao diện như bấm chọn quốc gia/thành phố trên bản đồ xem bài báo có hiển thị đúng không, chức năng tạo ảnh, tạo và tải xuống các file báo cáo (PDF, Excel, PowerPoint).
* **Phạm vi kiểm thử:**
  * **Module Bản đồ & Tương tác:** Kiểm thử thao tác click chọn quốc gia, thành phố trên bản đồ và kiểm tra danh sách bài báo hiển thị tương ứng.
  * **Module Cào tin tức (Scraper):** Kiểm thử luồng lấy tin tự động, bộ lọc từ khóa và cơ chế dọn dẹp dữ liệu cũ.
  * **Module Chatbot AI:** Kiểm thử khung chat hỏi đáp, cách hệ thống phản hồi dựa trên dữ liệu thực tế và hành vi khi gặp câu hỏi ngoài tầm kiểm soát.
  * **Module Tạo nội dung & Xuất báo cáo:** Kiểm thử tính năng tạo ảnh minh họa và kiểm tra file báo cáo tải về (PDF, Excel, PPTX) xem có đầy đủ nội dung và hiển thị đúng tiếng Việt không.

## 2. Các rủi ro thực tế ghi nhận
* **Tính bất định của AI:** Thời gian phản hồi và tài nguyên là hạn chế rất lớn, phạm vi kiến thức cũng quá hạn hẹp, ảnh hưởng nhiều tới trải nghiệm thực.
* **Phụ thuộc vào nguồn bên ngoài:** Luồng cào tin tức phụ thuộc vào trang báo gốc; nếu các trang này thay đổi cấu trúc hoặc gặp sự cố mạng, việc cào tin có thể bị gián đoạn.
* **Tốc độ phản hồi:** Một số thao tác nặng như gọi AI tạo nội dung hoặc render file báo cáo nặng có thể mất nhiều thời gian để hoàn thành, dễ làm người dùng tưởng hệ thống bị đơ.

## 3. Chiến lược kiểm thử & Phương pháp thực hiện
* **Kỹ thuật kiểm thử:** Kiểm thử dựa trên giao diện người dùng thực tế, kiểm tra các giá trị biên (như điểm số rủi ro từ 0 đến 100, bộ lọc ngày tháng) và kiểm tra các trường hợp ngoại lệ.
* **Quy trình báo lỗi:** Ghi nhận lỗi theo mức độ ảnh hưởng (Quan trọng, Trung bình, Nhẹ) kèm theo các bước tái hiện rõ ràng, hình ảnh hoặc log lỗi thực tế.
* **Công cụ hỗ trợ:** Sử dụng trình duyệt để thao tác trực tiếp trên giao diện, dùng DBeaver để kiểm tra bảng dữ liệu dưới database, kết hợp AI để gợi ý các tình huống kiểm thử.

## 4. Các giới hạn thực tế
* **Giới hạn thời gian dữ liệu:** Hệ thống chỉ lưu trữ và xử lý tin tức trong vòng 7 ngày gần nhất, không hỗ trợ tra cứu dữ liệu cũ hơn trong quá khứ, và phạm vi dữ liệu cào về vẫn là một vấn đề lớn.
* **Xử lý đồng thời:** Vì các tác vụ như xuất file hoặc gọi AI được xử lý trực tiếp, hệ thống có thể phản hồi chậm hơn nếu có nhiều người cùng thao tác một lúc. Bên cạnh đó tài nguyên của API free vẫn là một thách thức lớn.

## 5. Tài liệu đính kèm
* **Chi tiết Test Cases, Bug Reports:** Xem tại https://drive.google.com/drive/u/1/folders/1FgLtRL39DrlvXEIZ6-0N2ohrsoVKVP7l.
* **Nhật ký hoạt động AI:** Xem tại tệp [AI_WORKLOG.md](./AI_WORKLOG.md).
