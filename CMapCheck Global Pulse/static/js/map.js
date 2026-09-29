// 1. Khởi tạo bản đồ chính (Giới hạn địa lý)
const bounds = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));
const map = L.map('map', {
    maxBounds: bounds,
    maxBoundsViscosity: 1.0,
    minZoom: 2.5,
    zoomControl: false
}).setView([20, 0], 3);

// Các lớp bản đồ
const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { noWrap: true, bounds: bounds });
const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { noWrap: true, bounds: bounds });

satelliteTile.addTo(map);

let geojsonLayer;
let focusMap = null;
let focusLayer = null;
let currentMode = 'satellite';
let cityMarkers = []; // Store city markers
let currentSelectedCountry = null;
let currentViewMode = 'country'; // 'country' or 'city'
let currentSelectedCity = null;

// Danh sách quốc gia từ DB (key: tên tiếng Anh)
let dbCountries = new Set();
let dbCountryData = {};  // { "Vietnam": { population, gdp_usd, ... } }
let riskScores = {};     // { "Vietnam": 20, "Russia": 80, ... }

// Load risk scores từ API
function loadRiskScores() {
    fetch('/api/risk-scores')
        .then(res => res.json())
        .then(data => {
            riskScores = data;
            if (geojsonLayer && currentMode === 'risk') {
                geojsonLayer.setStyle(feature => getLayerStyle(feature));
            }
        })
        .catch(() => console.warn('Không thể tải risk scores'));
}

// Load danh sách quốc gia từ DB ngay khi khởi động
fetch('/api/risk-data')
    .then(res => res.json())
    .then(data => {
        data.forEach(c => {
            dbCountries.add(c.name);
            dbCountryData[c.name] = c;
        });
        if (geojsonLayer) geojsonLayer.setStyle(feature => getLayerStyle(feature));
    })
    .catch(() => console.warn('Không thể tải dữ liệu từ DB'));

// 2. Khởi tạo bản đồ Focus (Quốc gia lơ lửng)
function initFocusMap() {
    focusMap = L.map('focus-map', {
        zoomControl: false, attributionControl: false,
        dragging: true, scrollWheelZoom: true,
        background: 'transparent'
    });
    focusMap.getContainer().style.background = 'transparent';
}

// 3. Tải GeoJSON và xử lý tương tác
fetch('/static/data/countries.json')
    .then(res => res.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: (feature) => getLayerStyle(feature),
            onEachFeature: (feature, layer) => {
                layer.on('click', () => detachCountry(feature, layer));
                layer.on('mouseover', (e) => {
                    e.target.setStyle({ color: '#38bdf8', weight: 2 });
                    if (currentMode === 'risk') {
                        const name = feature.properties.name;
                        layer.bindTooltip(
                            `<b>${name}</b><br>${getRiskLabel(name)}`,
                            { sticky: true, className: 'risk-tooltip' }
                        ).openTooltip();
                    }
                });
                layer.on('mouseout', () => {
                    geojsonLayer.resetStyle(layer);
                    layer.closeTooltip();
                });
            }
        }).addTo(map);
    });

// 3b. Load quần đảo Hoàng Sa & Trường Sa (thuộc Việt Nam)
let islandsLayer;
fetch('/static/data/vietnam_islands.geojson')
    .then(res => res.json())
    .then(data => {
        islandsLayer = L.geoJSON(data, {
            style: () => getIslandStyle(),
            onEachFeature: (feature, layer) => {
                const props = feature.properties;
                // Tooltip luôn hiển thị tên
                layer.bindTooltip(`<b>${props.name}</b><br><small>${props.description}</small>`,
                    { sticky: true, className: 'risk-tooltip' });
                layer.on('click', () => {
                    // Khi click vào quần đảo → hiển thị thông tin Việt Nam
                    const vietnamFeature = {
                        properties: { name: 'Vietnam', pop_est: null, gdp_md_est: null }
                    };
                    detachCountry(vietnamFeature, layer);
                    // Cập nhật tên hiển thị
                    const flag = dbCountryData['Vietnam']?.flag_emoji || '🇻🇳';
                    document.getElementById('country-name').innerText =
                        `${flag} Vietnam — ${props.name}`;
                });
                layer.on('mouseover', (e) => {
                    e.target.setStyle({ color: '#fbbf24', weight: 2, fillOpacity: 0.7 });
                });
                layer.on('mouseout', () => {
                    islandsLayer.resetStyle(layer);
                });
            }
        }).addTo(map);
    })
    .catch(() => console.warn('Không tải được file quần đảo'));

function getIslandStyle() {
    if (currentMode === 'risk') {
        const score = riskScores['Vietnam'] || 20;
        const color = getRiskColor('Vietnam');
        return { color: color, weight: 1.5, fillColor: color, fillOpacity: 0.6 };
    }
    // Satellite mode: viền vàng nổi bật để phân biệt
    return { color: '#fbbf24', weight: 1.5, fillColor: '#fbbf24', fillOpacity: 0.35 };
}

function getLayerStyle(feature) {
    const name = feature.properties.name;
    const hasData = dbCountries.has(name);

    if (currentMode === 'risk') {
        const color = getRiskColor(name);
        return { color: color, weight: 1, fillColor: color, fillOpacity: 0.5 };
    }
    // Satellite mode: style mặc định cho tất cả
    return { color: 'rgba(255,255,255,0.2)', weight: 1, fillColor: 'transparent', fillOpacity: 0 };
}

// 4. LOGIC TÁCH RỜI QUỐC GIA
async function detachCountry(feature, layer) {
    const props = feature.properties;
    const riskColor = getRiskColor(props.name);
    
    // Reset city selection when picking a new country
    currentSelectedCity = null;
    
    // Store selected country
    currentSelectedCountry = props.name;
    
    // Cập nhật màu Glow
    document.documentElement.style.setProperty('--risk-color', riskColor);

    // Hiệu ứng làm mờ nền
    document.getElementById('map').classList.add('blurred');
    document.getElementById('focus-container').classList.remove('hidden');

    // Thiết lập bản đồ focus
    if (!focusMap) initFocusMap();
    if (focusLayer) {
        if (Array.isArray(focusLayer)) {
            focusLayer.forEach(l => focusMap.removeLayer(l));
        } else {
            focusMap.removeLayer(focusLayer);
        }
    }

    const islandStyle = {
        fillColor: riskColor,
        color: riskColor,
        weight: 2,
        fillOpacity: 0.7
    };

    const mainLayer = L.geoJSON(feature, {
        style: { fillColor: riskColor, color: riskColor, weight: 3, fillOpacity: 0.7 }
    }).addTo(focusMap);

    // Nếu là Vietnam → thêm Hoàng Sa & Trường Sa vào focus map
    let islandFocusLayer = null;
    if (props.name === 'Vietnam') {
        fetch('/static/data/vietnam_islands.geojson')
            .then(r => r.json())
            .then(islandData => {
                islandFocusLayer = L.geoJSON(islandData, {
                    style: islandStyle,
                    onEachFeature: (feat, lyr) => {
                        // Thêm label tên quần đảo
                        lyr.bindTooltip(feat.properties.name, {
                            permanent: true,
                            direction: 'center',
                            className: 'island-label'
                        });
                    }
                }).addTo(focusMap);
                focusLayer = [mainLayer, islandFocusLayer];
                // Fit bounds bao gồm cả quần đảo, zoom out để thấy toàn bộ
                const combined = L.featureGroup([mainLayer, islandFocusLayer]);
                focusMap.fitBounds(combined.getBounds(), { padding: [40, 40], maxZoom: 5 });
            })
            .catch(() => {});
        focusLayer = [mainLayer];
        // Zoom out đủ để thấy Biển Đông khi chờ load quần đảo
        focusMap.fitBounds(mainLayer.getBounds(), { padding: [50, 50], maxZoom: 5 });
    } else {
        focusLayer = mainLayer;
        focusMap.fitBounds(mainLayer.getBounds(), { padding: [50, 50] });
    }

    // Add city markers
    await addCityMarkers(props.name);

    // Set view mode to country initially
    setViewMode('country');

    // Load country summary when country is selected
    loadCitySummary('', props.name);

    // Hiển thị Sidebar
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('active');
    document.getElementById('btn-close-sidebar').classList.add('visible');
    
    // Ensure country view is shown
    document.getElementById('country-default-view').classList.remove('hidden');
    
    // Ưu tiên dữ liệu từ DB, fallback sang GeoJSON
    const dbData = dbCountryData[props.name];
    const flag = dbData?.flag_emoji ? `${dbData.flag_emoji} ` : '';

    document.getElementById('country-name').innerText = flag + props.name;

    // Load news and city data
    loadNewsAndCityData(props.name);
    loadCitySummary(null, props.name);
}

// 5. CÁC HÀM TIỆN ÍCH
function getRiskColor(name) {
    const score = riskScores[name];
    if (score === undefined) return '#334155'; // xám - không có dữ liệu

    // Gradient: 0=xanh lá → 50=vàng → 80=cam → 100=đỏ
    if (score >= 80) return '#dc2626';      // đỏ đậm - nguy hiểm cao
    if (score >= 65) return '#ea580c';      // cam đỏ - nguy hiểm
    if (score >= 50) return '#f59e0b';      // vàng cam - cảnh báo cao
    if (score >= 35) return '#eab308';      // vàng - cảnh báo
    if (score >= 20) return '#84cc16';      // xanh vàng - ổn định vừa
    return '#22c55e';                        // xanh lá - ổn định
}

function getRiskLabel(name) {
    const score = riskScores[name];
    if (score === undefined) return 'Không có dữ liệu';
    if (score >= 80) return `Nguy hiểm cao (${score}/100)`;
    if (score >= 65) return `Nguy hiểm (${score}/100)`;
    if (score >= 50) return `Cảnh báo cao (${score}/100)`;
    if (score >= 35) return `Cảnh báo (${score}/100)`;
    if (score >= 20) return `Ổn định vừa (${score}/100)`;
    return `Ổn định (${score}/100)`;
}

// Add city markers to the focus map
async function addCityMarkers(country) {
    try {
        const response = await fetch('/api/city-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: country })
        });
        const data = await response.json();
        
        // Clear existing city markers
        cityMarkers.forEach(marker => {
            if (focusMap) focusMap.removeLayer(marker);
        });
        cityMarkers = [];
        
        // Add new city markers
        data.cities.forEach(city => {
            const color  = getCityProminenceColor(city.prominence);
            // Radius scale: 6 (0 tin) → 16 (nhiều tin), dựa vào news_count
            const radius = Math.max(6, Math.min(16, 6 + city.news_count * 1.5));
            // Pulse animation cho thành phố nổi bật
            const isPulsing = city.prominence >= 40;

            const marker = L.circleMarker([city.lat, city.lng], {
                radius:      radius,
                fillColor:   color,
                color:       city.prominence >= 60 ? color : '#ffffff',
                weight:      city.prominence >= 60 ? 2 : 1.5,
                opacity:     1,
                fillOpacity: city.prominence === 0 ? 0.25 : 0.85,
                className:   isPulsing ? 'city-marker-pulse' : ''
            }).addTo(focusMap);
            
            marker.bindTooltip(`
                <div style="text-align: center;">
                    <strong>${city.name}</strong><br>
                    <span style="color: ${color};">●</span> Mức độ: ${city.prominence}%
                </div>
            `, {
                permanent: false,
                className: 'city-tooltip'
            });
            
            // Prefetch khi hover để click sẽ nhanh hơn
            marker.on('mouseover', () => {
                const activeBtn  = document.querySelector('.time-btn.active');
                const activeDate = activeBtn ? activeBtn.dataset.date : new Date().toISOString().split('T')[0];
                prefetchCityNews(country, city.name, activeDate);
            });

            marker.on('click', () => {
                const activeBtn  = document.querySelector('.time-btn.active');
                const activeDate = activeBtn ? activeBtn.dataset.date : new Date().toISOString().split('T')[0];
                
                if (currentSelectedCity === city.name) {
                    // Toggle off: quay về dữ liệu quốc gia
                    currentSelectedCity = null;
                    setViewMode('country');
                    loadNewsAndCityData(country, activeDate, '');
                    loadCitySummary('', country);
                    updateActiveCity('');
                } else {
                    // Chọn thành phố mới
                    currentSelectedCity = city.name;
                    setViewMode('city');
                    loadNewsAndCityData(country, activeDate, city.name);
                    loadCitySummary(city.name, country);
                    updateActiveCity(city.name);
                }
            });
            
            cityMarkers.push(marker);
        });
    } catch (error) {
        console.error('Error loading city data:', error);
    }
}

// Get color based on city prominence level
function getCityProminenceColor(prominence) {
    if (prominence >= 80) return '#ff0000'; // Đỏ tươi - rất nổi bật
    if (prominence >= 60) return '#dc2626'; // Đỏ đậm - nổi bật cao
    if (prominence >= 40) return '#f59e0b'; // Cam - trung bình cao
    if (prominence >= 20) return '#eab308'; // Vàng - trung bình
    if (prominence >= 5)  return '#84cc16'; // Xanh vàng - ít tin
    return '#475569';                        // Xám - không có tin
}

// Cache phía frontend để tránh gọi API lặp lại
const _frontendNewsCache = {};

// Prefetch news cho 1 city (gọi trước khi user click)
function prefetchCityNews(country, cityName, date) {
    if (!date) date = new Date().toISOString().split('T')[0];
    const key = `${country}|${date}|${cityName}`;
    if (_frontendNewsCache[key]) return; // đã có cache
    fetch('/api/news-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, date, city: cityName })
    }).then(r => r.json()).then(data => {
        _frontendNewsCache[key] = data;
    }).catch(() => {});
}

// Load news and city data for sidebar
async function loadNewsAndCityData(country, date = null, city = '') {
    if (!date) {
        date = new Date().toISOString().split('T')[0];
    }

    // Hiển thị loading ngay lập tức
    const newsContainer = document.getElementById('news-articles');
    if (newsContainer && city) {
        newsContainer.innerHTML = `<p class="no-data" style="color:var(--accent)">
            <i class="fa-solid fa-spinner fa-spin"></i> Đang tải tin tức ${city}...</p>`;
        newsContainer.dataset.currentCity = city;
    }

    // Kiểm tra frontend cache trước
    const key = `${country}|${date}|${city}`;
    if (_frontendNewsCache[key]) {
        updateSidebarWithNews(_frontendNewsCache[key]);
        return;
    }

    try {
        const response = await fetch('/api/news-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country, date, city })
        });
        const data = await response.json();
        _frontendNewsCache[key] = data; // lưu cache
        updateSidebarWithNews(data);
    } catch (error) {
        console.error('Error loading news data:', error);
    }
}

// Get date string from days ago
function getDateFromDays(days) {
    const date = new Date();
    date.setDate(date.getDate() - days + 1);
    return date.toISOString().split('T')[0];
}

let _currentKeywordContext = { country: null, city: null };

// Load keywords using the new API — nhận city để lọc đúng
async function loadKeywords(country, city = '') {
    // Bỏ qua việc tải lại từ khóa nếu đang xem cùng một quốc gia và thành phố
    // Vì từ khóa luôn phân tích dữ liệu 7 ngày gần nhất bất chấp bộ lọc ngày
    if (_currentKeywordContext.country === country && _currentKeywordContext.city === city) {
        return;
    }
    _currentKeywordContext = { country, city };

    const keywordsContainer = document.getElementById('keywords-container');
    if (!keywordsContainer) return;
    keywordsContainer.innerHTML = '<p class="no-data" style="color:var(--accent)"><i class="fa-solid fa-spinner fa-spin"></i> Đang phân tích từ khóa...</p>';

    try {
        const response = await fetch('/api/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country, city, limit: 60 })
        });
        const data = await response.json();

        keywordsContainer.innerHTML = '';

        const keywords = (data.keywords || []).filter(k => {
            const l = k.toLowerCase();
            return !l.includes('dưới đây') && !l.includes('trích xuất') && !l.includes('tin tức trên');
        });

        if (keywords.length === 0) {
            keywordsContainer.innerHTML = '<p class="no-data">Không có từ khóa</p>';
            return;
        }

        const kwArticles = data.keyword_articles || {};

        keywords.forEach(keyword => {
            const articles = kwArticles[keyword] || [];
            const hasArticles = articles.length > 0;

            const item = document.createElement('div');
            item.className = 'keyword-item';

            item.innerHTML = `
                <div class="keyword-header">
                    <span class="keyword-text">${keyword}</span>
                    ${hasArticles ? `<button class="keyword-toggle" aria-label="Mở rộng">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>` : ''}
                </div>
                ${hasArticles ? `<div class="keyword-articles hidden">
                    ${articles.map(a => `
                        <a class="keyword-article-link" href="${a.url}" target="_blank" rel="noopener">
                            <i class="fa-solid fa-newspaper"></i>
                            <span>${a.title}</span>
                            <span class="kw-source">${a.source || ''}</span>
                        </a>`).join('')}
                </div>` : ''}
            `;

            // Toggle accordion
            if (hasArticles) {
                const btn      = item.querySelector('.keyword-toggle');
                const articles_div = item.querySelector('.keyword-articles');
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = !articles_div.classList.contains('hidden');
                    articles_div.classList.toggle('hidden');
                    btn.querySelector('i').style.transform = isOpen ? '' : 'rotate(180deg)';
                });
                // Click vào header cũng toggle
                item.querySelector('.keyword-header').addEventListener('click', () => {
                    btn.click();
                });
            }

            keywordsContainer.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading keywords:', error);
        keywordsContainer.innerHTML = '<p class="no-data">Lỗi tải từ khóa</p>';
    }
}

// Update sidebar with news and keywords
function updateSidebarWithNews(data) {
    // Update news articles
    const newsContainer = document.getElementById('news-articles');
    if (newsContainer) {
        newsContainer.innerHTML = '';
        
        // Store current city for time filter
        newsContainer.dataset.currentCity = data.city || '';
        
        if (data.news.length === 0) {
            newsContainer.innerHTML = '<p class="no-data">Không có tin tức cho thành phố này</p>';
            if (data.country) {
                loadKeywords(data.country, data.city || '');
            }
            return;
        }
        
        data.news.forEach(article => {
            const articleEl = document.createElement('div');
            articleEl.className = 'news-article clickable';
            articleEl.innerHTML = `
                <h4 class="news-title">${article.title}</h4>
                <p class="news-summary">${article.summary}</p>
                <div class="news-meta">
                    <span class="news-source">${article.source}</span>
                    <span class="news-time">${article.time}</span>
                    <span class="news-prominence" style="color: ${getCityProminenceColor(article.prominence)}">● ${article.prominence}%</span>
                </div>
                <div class="news-url-indicator">
                    <i class="fa-solid fa-external-link-alt"></i> Nhấn để đọc bài viết gốc
                </div>
            `;
            
            // Add click event to open news URL
            articleEl.addEventListener('click', () => {
                if (article.url) {
                    window.open(article.url, '_blank');
                }
            });
            
            newsContainer.appendChild(articleEl);
        });
    }
    
    // Load keywords — truyền city để lọc đúng
    if (data.country) {
        loadKeywords(data.country, data.city || '');
    }
}

// Update active city indicator
function updateActiveCity(cityName) {
    // Update city markers to show which one is active
    cityMarkers.forEach(marker => {
        // Reset all markers to normal size
        marker.setRadius(8);
    });
    
    // Find and highlight the active city marker
    const activeMarker = cityMarkers.find(marker => {
        // This is a simplified approach - in production you'd store city data with markers
        return marker.getTooltip().getContent().includes(cityName);
    });
    
    if (activeMarker) {
        activeMarker.setRadius(12); // Make active marker larger
    }

    // Update sidebar title to show Country / City
    if (currentSelectedCountry) {
        const flag = dbCountryData[currentSelectedCountry]?.flag_emoji ? `${dbCountryData[currentSelectedCountry].flag_emoji} ` : '';
        if (cityName) {
            document.getElementById('country-name').innerText = `${flag}${currentSelectedCountry} / ${cityName}`;
        } else {
            // Restore country name when no city is active
            document.getElementById('country-name').innerText = `${flag}${currentSelectedCountry}`;
        }
    }
}

// Set view mode (country or city)
function setViewMode(mode) {
    currentViewMode = mode;
    const sidebar = document.getElementById('sidebar');
    
    // Remove all view mode classes
    sidebar.classList.remove('country-view', 'city-view');
    
    // Add appropriate view mode class
    sidebar.classList.add(mode + '-view');
    
    // Update news section title based on mode
    const newsTitle = document.querySelector('.news-section h3');
    if (newsTitle) {
        if (mode === 'country') {
            newsTitle.innerHTML = '<i class="fa-solid fa-newspaper"></i> Tin tức nổi bật cả nước';
        } else {
            newsTitle.innerHTML = '<i class="fa-solid fa-newspaper"></i> Tin tức thành phố';
        }
    }
}

// Load city summary
async function loadCitySummary(city, country) {
    try {
        const response = await fetch('/api/city-country-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: city, country: country })
        });
        const data = await response.json();
        
        const summaryContainer = document.getElementById('city-summary');
        if (summaryContainer) {
            if (data.summary) {
                // Filter out introductory text
                let filteredSummary = data.summary;
                const introPatterns = [
                    /Dưới đây là tóm tắt/gi,
                    /Dưới đây là/gi,
                    /Tóm tắt về/gi,
                    /Tình hình/gi
                ];
                
                introPatterns.forEach(pattern => {
                    filteredSummary = filteredSummary.replace(pattern, '').trim();
                });
                
                // Remove any leading/trailing punctuation
                filteredSummary = filteredSummary.replace(/^[.:,;]+|[.:,;]+$/g, '').trim();
                
                summaryContainer.innerHTML = `
                    <h4>Tóm tắt tình hình ${city || country}</h4>
                    <p>${filteredSummary}</p>
                `;
            } else if (data.error) {
                summaryContainer.innerHTML = `<p class="no-data">Không thể tải tóm tắt</p>`;
            }
        }
    } catch (error) {
        console.error('Error loading city summary:', error);
    }
}

// Đóng chế độ Focus
document.getElementById('btn-close-sidebar').onclick = () => {
    // Clear city markers
    cityMarkers.forEach(marker => {
        if (focusMap) focusMap.removeLayer(marker);
    });
    cityMarkers = [];
    currentSelectedCountry = null;
    currentViewMode = 'country';
    
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebar').classList.remove('wide');
    document.getElementById('sidebar').classList.remove('country-view', 'city-view');
    document.getElementById('btn-close-sidebar').classList.remove('visible');
    document.getElementById('btn-close-sidebar').classList.remove('visible-wide');
    document.getElementById('focus-container').classList.add('hidden');
    document.getElementById('map').classList.remove('blurred');
    document.getElementById('advanced-panel').classList.add('hidden');
    document.getElementById('chat-tab').classList.remove('hidden');
    
    // Close independent chat panel if open
    document.getElementById('chat-panel').classList.remove('active');
    
    // Dừng đồng hồ
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
};

// Time filter functionality - Generate 7 day buttons
document.addEventListener('DOMContentLoaded', function() {
    const timeFilterContainer = document.getElementById('time-filter-buttons');
    
    // Generate buttons for the last 7 days
    const today = new Date();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayName = i === 0 ? 'Hôm nay' : dayNames[date.getDay()];
        const dateString = `${date.getDate()}/${date.getMonth() + 1}`;
        const fullDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const button = document.createElement('button');
        button.className = 'time-btn' + (i === 0 ? ' active' : '');
        button.dataset.date = fullDate;
        button.innerHTML = `${dayName}<br><small>${dateString}</small>`;
        
        timeFilterContainer.appendChild(button);
    }
    
    // Add click event listeners to the dynamically generated buttons
    timeFilterContainer.addEventListener('click', function(e) {
        const button = e.target.closest('.time-btn');
        if (!button) return;
        
        // Remove active class from all buttons
        timeFilterContainer.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Reload news data with selected date
        if (currentSelectedCountry) {
            const selectedDate = button.dataset.date;
            const currentCity = getCurrentSelectedCity() || '';
            loadNewsAndCityData(currentSelectedCountry, selectedDate, currentCity);
        }
    });

    // News search functionality
    const searchInput = document.getElementById('news-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const articles = document.querySelectorAll('.news-article');
            let hasVisibleArticles = false;
            
            articles.forEach(article => {
                const title = article.querySelector('.news-title')?.textContent.toLowerCase() || '';
                const summary = article.querySelector('.news-summary')?.textContent.toLowerCase() || '';
                
                if (title.includes(searchTerm) || summary.includes(searchTerm)) {
                    article.style.display = '';
                    hasVisibleArticles = true;
                } else {
                    article.style.display = 'none';
                }
            });
            
            // Show/hide no data message based on search results
            let noDataMsg = document.querySelector('.news-search-no-data');
            if (!hasVisibleArticles && articles.length > 0) {
                if (!noDataMsg) {
                    noDataMsg = document.createElement('p');
                    noDataMsg.className = 'no-data news-search-no-data';
                    noDataMsg.textContent = 'Không tìm thấy bài báo nào phù hợp';
                    document.getElementById('news-articles').appendChild(noDataMsg);
                } else {
                    noDataMsg.style.display = '';
                }
            } else if (noDataMsg) {
                noDataMsg.style.display = 'none';
            }
        });
    }
});

// Get current selected city from sidebar or return null
function getCurrentSelectedCity() {
    const newsContainer = document.getElementById('news-articles');
    if (newsContainer && newsContainer.dataset.currentCity) {
        return newsContainer.dataset.currentCity;
    }
    return null;
}

document.getElementById('btn-risk').onclick = function() {
    currentMode = 'risk';
    this.classList.add('active');
    document.getElementById('btn-satellite').classList.remove('active');
    map.removeLayer(satelliteTile);
    darkTile.addTo(map);
    if (Object.keys(riskScores).length === 0) {
        loadRiskScores();
    }
    if (geojsonLayer) geojsonLayer.setStyle((feature) => getLayerStyle(feature));
    if (islandsLayer) islandsLayer.setStyle(() => getIslandStyle());
    document.getElementById('risk-legend').classList.remove('hidden');
};

document.getElementById('btn-satellite').onclick = function() {
    currentMode = 'satellite';
    this.classList.add('active');
    document.getElementById('btn-risk').classList.remove('active');
    map.removeLayer(darkTile);
    satelliteTile.addTo(map);
    if (geojsonLayer) geojsonLayer.setStyle((feature) => getLayerStyle(feature));
    if (islandsLayer) islandsLayer.setStyle(() => getIslandStyle());
    document.getElementById('risk-legend').classList.add('hidden');
};

// Gọi API Backend
