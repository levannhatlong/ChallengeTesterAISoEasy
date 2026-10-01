# AI_WORKLOG.md

Tài liệu này ghi chép lại toàn bộ quá trình sử dụng các công cụ trí tuệ nhân tạo (Antigravity, Gemini và ChatGPT) để hỗ trợ phân tích, xây dựng chiến lược kiểm thử, gợi ý và đánh giá danh sách kịch bản kiểm thử (Test Cases) cho dự án **CMapCheck Global Pulse**.

## 1. Công cụ AI đã sử dụng
* **Antigravity (Mô hình khởi đầu):** Dùng để mô tả hệ thống cách chuẩn xác nhất dựa trên Project.
* **Google Gemini (Mô hình chính):** Dùng để đánh giá mô tả hệ thống, gợi ý chi tiết 15 tình huống kiểm thử (Test Cases) bám sát các tính năng thực tế của hệ thống như bản đồ, chatbot, tạo ảnh và xuất báo cáo.
* **ChatGPT (Mô hình đánh giá):** Dùng để rà soát, góp ý và đánh giá chất lượng của các tình huống kiểm thử do Gemini gợi ý nhằm đảm bảo độ chính xác và phù hợp.

## 2. Cách thức AI hỗ trợ trong quá trình kiểm thử
* **Giai đoạn phân tích hệ thống:** Sử dụng Antigravity để mô tả hệ thống dựa trên form yêu cầu của Gemini, đẩy mô tả qua Gemini để định hướng các bước kiểm thử bám sát vào giao diện và các tính năng chính của trang web.
* **Giai đoạn sinh kịch bản (Gemini chủ đạo):** Yêu cầu Gemini trực tiếp xây dựng danh sách 15 Test Cases tập trung vào các thao tác thực tế của người dùng:
  * Các thao tác giao diện và thao tác trên bản đồ (click chọn quốc gia hoặc thành phố để kiểm tra danh sách bài báo hiển thị tương ứng).
  * Chức năng chat hỏi đáp và kiểm thử phản hồi của AI.
  * Chức năng tạo ảnh minh họa.
  * Chức năng tạo và tải xuống các loại báo cáo (PDF, Excel, PowerPoint).
* **Giai đoạn đánh giá và tinh chỉnh (ChatGPT chủ đạo):** Đẩy nội dung Test Cases đã được Gemini tạo qua ChatGPT để đánh giá và tinh chỉnh cho phù hợp.
* **Giai đoạn cuối (Gemini chủ đạo):** Cuối cùng, đẩy nội dung Test Cases đã tinh chỉnh về lại Gemini để đánh giá lần cuối và tiến hành test thực tế trên hệ thống.

## 3. Các kết quả đầu ra chưa chính xác của AI và cách khắc phục
* **Vấn đề ban đầu:** Ở các lần gợi ý đầu tiên, AI thường đưa ra các thuật ngữ hoặc tình huống kiểm thử quá phức tạp, mang tính kỹ thuật cao, chưa sát với các thao tác trực quan của người dùng trên giao diện web.
* **Cách khắc phục:** 
  * Yêu cầu Gemini điều chỉnh lại ngôn từ gần gũi, dễ hiểu hơn, đúng với góc nhìn của một Manual Tester hay một Tester Intern/Fresher.
  * Tập trung sâu vào các tính năng tương tác thực tế trên giao diện như chọn điểm trên bản đồ, xem tin tức theo khu vực, hỏi chatbot và tải file báo cáo.

## 4. Kế hoạch cải thiện 
* Thực hiện kiểm thử thủ công các kịch bản đã được Gemini gợi ý và ChatGPT đánh giá trực tiếp trên ứng dụng.
* Ghi nhận lại kết quả thực tế vào Test Cases và tổng hợp, trình bày các lỗi phát sinh vào Bug Reports.
