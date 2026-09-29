# Sử dụng hình ảnh Python chính thức
FROM python:3.10-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Cài đặt các thư viện cần thiết cho cào dữ liệu và database
RUN pip install requests beautifulsoup4 pandas sqlalchemy psycopg2-binary

# Copy toàn bộ code vào container
COPY . .

# Chạy script cào dữ liệu
CMD ["python", "scraper.py"]