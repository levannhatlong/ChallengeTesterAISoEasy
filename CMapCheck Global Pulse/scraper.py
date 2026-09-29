import time
import urllib.request
import urllib.parse
import json
import re
import logging
from datetime import datetime, timezone, timedelta

import feedparser
import pandas as pd
from sqlalchemy import create_engine, text

log = logging.getLogger(__name__)

DB_URL = 'postgresql://admin:password123@localhost:5432/world_data_db'

# ── DANH SÁCH QUỐC GIA ────────────────────────────────────────────────────────
TARGET_COUNTRIES = [
    {"name_vi": "Việt Nam",    "name_en": "Vietnam",     "code3": "VNM", "code2": "VN", "flag": "🇻🇳",
     "keywords": ["Việt Nam", "Hà Nội", "TP.HCM", "Hồ Chí Minh", "Vietnam", "Hanoi", "quần đảo Hoàng Sa", "quần đảo Trường Sa", "huyện đảo Hoàng Sa", "huyện đảo Trường Sa", "Biển Đông"]},
    {"name_vi": "Thái Lan",    "name_en": "Thailand",    "code3": "THA", "code2": "TH", "flag": "🇹🇭",
     "keywords": ["Thái Lan", "Bangkok", "Thailand", "Thai"]},
    {"name_vi": "Indonesia",   "name_en": "Indonesia",   "code3": "IDN", "code2": "ID", "flag": "🇮🇩",
     "keywords": ["Indonesia", "Jakarta", "Indonesian"]},
    {"name_vi": "Malaysia",    "name_en": "Malaysia",    "code3": "MYS", "code2": "MY", "flag": "🇲🇾",
     "keywords": ["Malaysia", "Kuala Lumpur", "Malaysian"]},
    {"name_vi": "Philippines", "name_en": "Philippines", "code3": "PHL", "code2": "PH", "flag": "🇵🇭",
     "keywords": ["Philippines", "Manila", "Filipino", "Philippin"]},
    {"name_vi": "Singapore",   "name_en": "Singapore",   "code3": "SGP", "code2": "SG", "flag": "🇸🇬",
     "keywords": ["Singapore"]},
    {"name_vi": "Lào",         "name_en": "Laos",        "code3": "LAO", "code2": "LA", "flag": "🇱🇦",
     "keywords": ["Lào", "Vientiane", "Laos"]},
    {"name_vi": "Campuchia",   "name_en": "Cambodia",    "code3": "KHM", "code2": "KH", "flag": "🇰🇭",
     "keywords": ["Campuchia", "Phnom Penh", "Cambodia", "Khmer"]},
    {"name_vi": "Myanmar",     "name_en": "Myanmar",     "code3": "MMR", "code2": "MM", "flag": "🇲🇲",
     "keywords": ["Myanmar", "Miến Điện", "Yangon", "Burma"]},
    {"name_vi": "Brunei",      "name_en": "Brunei",      "code3": "BRN", "code2": "BN", "flag": "🇧🇳",
     "keywords": ["Brunei"]},
    {"name_vi": "Nga",         "name_en": "Russia",      "code3": "RUS", "code2": "RU", "flag": "🇷🇺",
     "keywords": ["Nga", "Moscow", "Putin", "Russia", "Russian"]},
    {"name_vi": "Ukraine",     "name_en": "Ukraine",     "code3": "UKR", "code2": "UA", "flag": "🇺🇦",
     "keywords": ["Ukraine", "Kyiv", "Zelensky", "Ukraina"]},
    {"name_vi": "Trung Quốc",  "name_en": "China",       "code3": "CHN", "code2": "CN", "flag": "🇨🇳",
     "keywords": ["Trung Quốc", "Bắc Kinh", "China", "Chinese", "Tập Cận Bình"]},
]

# ── RSS FEEDS — Báo chính thống Việt Nam ─────────────────────────────────────
RSS_FEEDS = [
    # VnExpress
    {"url": "https://vnexpress.net/rss/the-gioi.rss",   "source": "VnExpress"},
    {"url": "https://vnexpress.net/rss/thoi-su.rss",    "source": "VnExpress"},
    # Tuổi Trẻ
    {"url": "https://tuoitre.vn/rss/the-gioi.rss",      "source": "Tuổi Trẻ"},
    {"url": "https://tuoitre.vn/rss/thoi-su.rss",       "source": "Tuổi Trẻ"},
    {"url": "https://tuoitre.vn/rss/dong-nam-a.rss",    "source": "Tuổi Trẻ"},
    # Thanh Niên
    {"url": "https://thanhnien.vn/rss/the-gioi.rss",    "source": "Thanh Niên"},
    {"url": "https://thanhnien.vn/rss/thoi-su.rss",     "source": "Thanh Niên"},
    # Nhân Dân
    {"url": "https://nhandan.vn/rss/the-gioi.rss",      "source": "Nhân Dân"},
    {"url": "https://nhandan.vn/rss/thoi-su.rss",       "source": "Nhân Dân"},
]


# ── HELPERS ───────────────────────────────────────────────────────────────────
def _fetch_json(url, timeout=15):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "GlobalPulse/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        log.warning(f"fetch_json failed {url}: {e}")
        return None


def _clean_html(text: str) -> str:
    """Xóa HTML tags và decode HTML entities."""
    if not text:
        return ""
    from html import unescape
    text = re.sub(r'<[^>]+>', '', text)
    text = unescape(text)
    return text.strip()


def _parse_date(entry) -> datetime:
    """Parse published date từ RSS entry."""
    try:
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
    except Exception:
        pass
    return datetime.now(timezone.utc)


def _match_country(text: str, keywords: list) -> bool:
    """Kiểm tra text có chứa keyword của quốc gia không."""
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in keywords)


# ── SCRAPE COUNTRY INFO ───────────────────────────────────────────────────────
def scrape_countries(verbose=True) -> list[dict]:
    """Trả về danh sách quốc gia mục tiêu kèm cờ (đã được lưu cứng)."""
    results = []
    for item in TARGET_COUNTRIES:
        name = item["name_vi"]
        if verbose:
            print(f"  [Country] {name} (Flag: {item['flag']})")

        row = {
            "country_name": name,
            "country_code": item["code3"],
            "continent": "Châu Á",
            "flag_emoji": item["flag"]
        }
        results.append(row)
    return results


# ── SCRAPE NEWS ───────────────────────────────────────────────────────────────
def _fetch_feed(feed_info: dict) -> list[dict]:
    """Fetch 1 RSS feed, trả về list articles đã lọc."""
    url    = feed_info["url"]
    source = feed_info["source"]
    results = []
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries:
            title   = _clean_html(getattr(entry, 'title', '') or '')
            summary = _clean_html(getattr(entry, 'summary', '') or
                                  getattr(entry, 'description', '') or '')
            link    = getattr(entry, 'link', '') or ''
            if not title or not link:
                continue
                
            pub_date = _parse_date(entry)
            
            # Ưu tiên cào các bài báo mới nhất trong ngày (trong vòng 24h)
            if datetime.now(timezone.utc) - pub_date > timedelta(hours=24):
                continue

            full_text = f"{title} {summary}".lower()
            
            # 1. BỘ LỌC BÀI RÁC (Phèn phèn, showbiz, chuyện vặt)
            TRIVIAL_KEYWORDS = [
                "showbiz", "ca sĩ", "diễn viên", "hoa hậu", "người mẫu", "hot girl", "hot boy", 
                "phốt", "hẹn hò", "chia tay", "ly hôn", "đánh ghen", "ngoại tình", "mẹ chồng", "nàng dâu",
                "chuyện lạ", "tử vi", "cung hoàng đạo", "mặc đẹp", "giảm cân", "cư dân mạng", 
                "tin đồn", "drama", "bóc phốt", "ồn ào", "khoe dáng", "gợi cảm", "tình tứ"
            ]
            if any(kw in full_text for kw in TRIVIAL_KEYWORDS):
                continue

            # 2. BỘ LỌC ẢNH HƯỞNG RỘNG (Hot, nổi bật, quan trọng)
            HIGH_IMPACT_KEYWORDS = [
                "chính phủ", "thủ tướng", "bộ trưởng", "chủ tịch", "quốc hội", "đại hội", "ngoại giao", "chuyến thăm", "hợp tác", "ký kết",
                "kinh tế", "đầu tư", "fdi", "gdp", "ngân hàng", "lãi suất", "chứng khoán", "bất động sản", "dự án", "quy hoạch", "doanh nghiệp",
                "cao tốc", "sân bay", "khánh thành", "khởi công", "thông xe", "hạ tầng", "cầu đường",
                "khởi tố", "bắt giam", "kỷ luật", "đình chỉ", "tham nhũng", "đường dây", "triệt phá", "chuyên án", "điều tra", "tòa án", "xét xử", "tội phạm",
                "bão", "lũ", "ngập", "sạt lở", "động đất", "thiên tai", "cháy", "nổ", "khẩn cấp", "cảnh báo", "thương vong", "tử vong", "thiệt hại", "dịch bệnh", "cứu hộ",
                "chiến tranh", "xung đột", "quân sự", "tên lửa", "căng thẳng", "lãnh thổ", "biển đông", "tập trận",
                "tai nạn", "kẹt xe", "ùn tắc", "đề xuất", "chính sách", "quy định mới", "tăng giá", "giảm giá"
            ]
            if not any(kw in full_text for kw in HIGH_IMPACT_KEYWORDS):
                continue

            # 3. PHẢI THUỘC VỀ MỘT TRONG CÁC QUỐC GIA MỤC TIÊU
            for country in TARGET_COUNTRIES:
                if _match_country(full_text, country["keywords"]):
                    results.append({
                        "title":        title,
                        "summary":      summary[:800] if summary else title,
                        "url":          link,
                        "source":       source,
                        "country_name": country["name_vi"],
                        "country_en":   country["name_en"],
                        "published_at": pub_date,
                        "scraped_at":   datetime.now(timezone.utc),
                    })
                    break
    except Exception as e:
        log.warning(f"RSS failed {url}: {e}")
    return results


def scrape_news(verbose=True) -> list[dict]:
    """Cào tin tức song song từ tất cả RSS feeds."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    all_articles = []
    seen_urls    = set()

    if verbose:
        print(f"  Fetching {len(RSS_FEEDS)} feeds in parallel...", flush=True)

    with ThreadPoolExecutor(max_workers=len(RSS_FEEDS)) as executor:
        futures = {executor.submit(_fetch_feed, f): f for f in RSS_FEEDS}
        for future in as_completed(futures):
            feed_info = futures[future]
            try:
                articles = future.result()
                added = 0
                for a in articles:
                    if a["url"] not in seen_urls:
                        seen_urls.add(a["url"])
                        all_articles.append(a)
                        added += 1
                if verbose:
                    src = feed_info["source"].encode('ascii','replace').decode()
                    print(f"  [RSS] {src}: {added} bai", flush=True)
            except Exception as e:
                log.warning(f"Feed error: {e}")

    return all_articles


# ── SAVE TO DB ────────────────────────────────────────────────────────────────
def save_countries(records: list[dict], engine) -> int:
    """Lưu thông tin quốc gia vào bảng countries."""
    df = pd.DataFrame(records).drop_duplicates(subset=["country_name"])
    for col in ["flag_emoji", "continent", "country_code"]:
        if col not in df.columns:
            df[col] = None
    df.to_sql("countries", engine, if_exists="replace", index=False)
    return len(df)


def save_articles(records: list[dict], engine) -> int:
    """Lưu bài báo vào bảng articles — xóa cũ, ghi mới."""
    if not records:
        return 0

    # Tạo bảng nếu chưa có
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS articles (
                id          SERIAL PRIMARY KEY,
                title       TEXT NOT NULL,
                summary     TEXT,
                url         TEXT UNIQUE NOT NULL,
                source      VARCHAR(200),
                country_name VARCHAR(100),
                country_en  VARCHAR(100),
                published_at TIMESTAMPTZ,
                scraped_at  TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        # Xóa bài cũ hơn 7 ngày
        conn.execute(text("""
            DELETE FROM articles
            WHERE scraped_at < NOW() - INTERVAL '7 days'
        """))
        conn.commit()

    # Bulk insert với executemany — nhanh hơn nhiều so với từng row
    df = pd.DataFrame(records)
    rows_data = [
        {
            "title":        r["title"],
            "summary":      r.get("summary", ""),
            "url":          r["url"],
            "source":       r.get("source", ""),
            "country_name": r.get("country_name", ""),
            "country_en":   r.get("country_en", ""),
            "published_at": r.get("published_at"),
            "scraped_at":   r.get("scraped_at"),
        }
        for r in df.to_dict("records")
    ]
    inserted = 0
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                INSERT INTO articles (title, summary, url, source, country_name, country_en, published_at, scraped_at)
                VALUES (:title, :summary, :url, :source, :country_name, :country_en, :published_at, :scraped_at)
                ON CONFLICT (url) DO UPDATE SET
                    title      = EXCLUDED.title,
                    summary    = EXCLUDED.summary,
                    scraped_at = EXCLUDED.scraped_at
            """), rows_data)
            conn.commit()
            inserted = len(rows_data)
        except Exception as e:
            log.warning(f"Bulk insert failed, falling back: {e}")
            conn.rollback()
    return inserted


# ── ENTRY POINT ───────────────────────────────────────────────────────────────
# ── ENTRY POINT ───────────────────────────────────────────────────────────────
def backfill_news(days_back: int = 6, db_url: str = DB_URL, verbose=True):
    """
    Cào thêm bài báo và gán ngày giả lập cho các ngày trước
    để demo chức năng lọc theo ngày.
    Chỉ chạy 1 lần khi cần seed dữ liệu demo.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    engine = create_engine(db_url)

    # Đảm bảo bảng tồn tại
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS articles (
                id          SERIAL PRIMARY KEY,
                title       TEXT NOT NULL,
                summary     TEXT,
                url         TEXT UNIQUE NOT NULL,
                source      VARCHAR(200),
                country_name VARCHAR(100),
                country_en  VARCHAR(100),
                published_at TIMESTAMPTZ,
                scraped_at  TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        conn.commit()

    if verbose:
        print(f"\n[Backfill] Cào bài báo cho {days_back} ngày trước...")

    # Fetch tất cả feeds 1 lần
    all_raw = []
    seen    = set()
    with ThreadPoolExecutor(max_workers=len(RSS_FEEDS)) as ex:
        for articles in ex.map(_fetch_feed, RSS_FEEDS):
            for a in articles:
                if a["url"] not in seen:
                    seen.add(a["url"])
                    all_raw.append(a)

    if verbose:
        print(f"  Fetched {len(all_raw)} unique articles from feeds")

    # Phân phối bài báo đều cho các ngày trước
    # Mỗi ngày lấy 1 subset, đổi URL để tránh conflict
    inserted_total = 0
    per_day = max(1, len(all_raw) // days_back)

    for day_offset in range(1, days_back + 1):
        target_date = datetime.now(timezone.utc) - timedelta(days=day_offset)
        # Lấy slice bài cho ngày này (xoay vòng)
        start = ((day_offset - 1) * per_day) % len(all_raw)
        day_articles = []
        for i in range(per_day):
            a = dict(all_raw[(start + i) % len(all_raw)])
            # Đổi URL để tránh UNIQUE conflict với bài gốc
            a["url"]          = a["url"] + f"?day={day_offset}"
            a["published_at"] = target_date.replace(
                hour=8 + (i % 12), minute=(i * 7) % 60
            )
            a["scraped_at"]   = target_date
            day_articles.append(a)

        # Bulk insert
        with engine.connect() as conn:
            try:
                conn.execute(text("""
                    INSERT INTO articles
                        (title, summary, url, source, country_name, country_en, published_at, scraped_at)
                    VALUES
                        (:title, :summary, :url, :source, :country_name, :country_en, :published_at, :scraped_at)
                    ON CONFLICT (url) DO NOTHING
                """), day_articles)
                conn.commit()
                inserted_total += len(day_articles)
                if verbose:
                    print(f"  Day -{day_offset}: {len(day_articles)} bài ({target_date.strftime('%d/%m/%Y')})")
            except Exception as e:
                conn.rollback()
                if verbose:
                    print(f"  Day -{day_offset}: LỖI {e}")

    if verbose:
        print(f"[Backfill] Hoàn tất: {inserted_total} bài đã thêm\n")
    return inserted_total


def run_all(db_url: str = DB_URL, verbose=True):
    """Cào toàn bộ: thông tin quốc gia + tin tức. Trả về dict kết quả."""
    if verbose:
        print("\n" + "="*50)
        print("[Scraper] Bắt đầu cào dữ liệu mới nhất...")
        print("="*50)

    engine = create_engine(db_url)
    result = {"countries": 0, "articles": 0, "errors": []}

    # 1. Thông tin quốc gia
    if verbose:
        print("\n[1/2] Cào thông tin quốc gia:")
    try:
        country_records = scrape_countries(verbose=verbose)
        result["countries"] = save_countries(country_records, engine)
        if verbose:
            print(f"  → Đã lưu {result['countries']} quốc gia")
    except Exception as e:
        result["errors"].append(f"countries: {e}")
        if verbose:
            print(f"  → LỖI: {e}")

    # 2. Tin tức
    if verbose:
        print("\n[2/2] Cào tin tức từ RSS feeds:")
    try:
        news_records = scrape_news(verbose=verbose)
        result["articles"] = save_articles(news_records, engine)
        if verbose:
            print(f"  → Đã lưu {result['articles']} bài báo")
    except Exception as e:
        result["errors"].append(f"news: {e}")
        if verbose:
            print(f"  → LỖI: {e}")

    if verbose:
        print(f"\n[Scraper] Hoàn tất: {result['countries']} quốc gia, {result['articles']} bài báo\n")

    return result


# Chạy trực tiếp: python scraper.py
if __name__ == "__main__":
    run_all(verbose=True)
