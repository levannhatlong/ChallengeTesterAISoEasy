# AI_WORKLOG.md

Tài liệu này ghi chép lại toàn bộ quá trình sử dụng các công cụ trí tuệ nhân tạo để hỗ trợ phân tích, xây dựng chiến lược kiểm thử và sinh danh sách kịch bản test cho dự án Quản lý biến động toàn cầu.

## 1. Công cụ AI đã sử dụng
* **ChatGPT / Gemini:** Dùng để phân tích rủi ro hệ thống, sinh danh sách test cases tập trung vào hiện tượng ảo thông tin, kiểm thử phạm vi hỏi đáp rộng và xử lý tốc độ phản hồi.

## 2. Cách thức AI hỗ trợ
* **Giai đoạn phân tích:** Yêu cầu AI đưa ra các thách thức đặc thù khi kiểm thử chatbot sử dụng API của Google với cơ chế cào lọc bài báo chuyên sâu (chỉ chọn lọc tin nghiêm trọng hoặc đặc biệt quan trọng) nhưng lại có phạm vi hỏi đáp rộng, không bị gò bó hoàn toàn vào dữ liệu đã cào.
* **Giai đoạn sinh kịch bản:** Cung cấp bối cảnh dự án để AI liệt kê các trường hợp kiểm thử biên, kiểm thử hành vi phản hồi khi kiến thức tổng quát của mô hình còn hẹp và tốc độ phản hồi chậm.

## 3. Các kết quả đầu ra chưa chính xác của AI và cách khắc phục
* **Vấn đề:** Ban đầu, các test case do AI sinh ra mang tính chung chung, áp dụng cho phần mềm truyền thống hoặc giả định chatbot phải phụ thuộc 100% vào dữ liệu bài báo cào về, dẫn đến việc bỏ sót các tình huống kiểm thử liên quan đến phạm vi kiến thức rộng của API Google và giới hạn về tốc độ xử lý.
* **Cách khắc phục:** Viết lại prompt chi tiết hơn, làm rõ cơ chế lọc tin tức nghiêm trọng, tính chất hỏi đáp mở của chatbot kết hợp API Google, cùng các điểm yếu về kiến thức hẹp và độ trễ thời gian phản hồi. Từ đó, yêu cầu AI tập trung sâu vào các tiêu chí: kiểm thử độ chính xác khi hỏi đáp ngoài phạm vi biến động, kiểm thử hiện tượng ảo giác, và đánh giá tác động của tốc độ phản hồi đến trải nghiệm người dùng.

## 4. Kế hoạch cải thiện 
* Bổ sung các kịch bản kiểm thử tự động hóa để đo lường chính xác độ trễ của phản hồi từ API Google.
* Mở rộng phạm vi dữ liệu bài báo đã lọc để kiểm tra khả năng xử lý của hệ thống trước các thông tin mang tính nghiêm trọng cao.
