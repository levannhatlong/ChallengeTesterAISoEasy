// ===================== CHAT MODULE =====================
let currentCountry = '';

// Toggle independent chat panel
document.getElementById('btn-open-chat').onclick = () => {
    const chatPanel = document.getElementById('chat-panel');
    chatPanel.classList.toggle('active');
    currentCountry = document.getElementById('country-name').innerText;
    updateSuggestions(currentCountry);
};

// Close independent chat panel
document.getElementById('btn-close-chat-panel').onclick = () => {
    const chatPanel = document.getElementById('chat-panel');
    chatPanel.classList.remove('active');
};

// Toggle creation modal with backdrop
document.getElementById('btn-open-creation').onclick = () => {
    const creationModal = document.getElementById('creation-modal');
    const backdrop = document.getElementById('creation-backdrop');
    creationModal.classList.add('active');
    backdrop.classList.add('active');
};

// Close creation modal with backdrop
document.getElementById('btn-close-creation').onclick = () => {
    const creationModal = document.getElementById('creation-modal');
    const backdrop = document.getElementById('creation-backdrop');
    creationModal.classList.remove('active');
    backdrop.classList.remove('active');
};

// Close modal when clicking on backdrop
document.getElementById('creation-backdrop').onclick = () => {
    const creationModal = document.getElementById('creation-modal');
    const backdrop = document.getElementById('creation-backdrop');
    creationModal.classList.remove('active');
    backdrop.classList.remove('active');
};

// Quick suggestions
document.getElementById('quick-suggestions').addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestion-chip')) {
        document.getElementById('chat-input').value = e.target.innerText;
        sendMessage();
    }
});

function updateSuggestions(country) {
    const chips = document.querySelectorAll('.suggestion-chip');
    const suggestions = [
        `Rủi ro tại ${country}?`,
        `Kinh tế ${country} ra sao?`,
        `Dân số ${country}?`,
    ];
    chips.forEach((chip, i) => {
        if (suggestions[i]) chip.innerText = suggestions[i];
    });
}

// Gửi tin nhắn khi nhấn Enter
document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Gửi tin nhắn khi nhấn nút
document.getElementById('btn-send-chat').onclick = sendMessage;

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    appendUserMessage(message);
    input.value = '';

    // Ẩn suggestions sau lần gửi đầu
    document.getElementById('quick-suggestions').style.display = 'none';

    const botMsgEl = appendBotMessage('...');

    // Lấy thời gian thực tế của quốc gia đang xem
    const tzData = typeof COUNTRY_TIMEZONE !== 'undefined' ? COUNTRY_TIMEZONE[currentCountry] : null;
    let realtime = '';
    if (tzData) {
        const now = new Date();
        const fmt = new Intl.DateTimeFormat('vi-VN', {
            timeZone: tzData.tz,
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
        realtime = fmt.format(now);
    } else {
        realtime = new Date().toLocaleString('vi-VN');
    }

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, country: currentCountry, realtime })
        });
        const data = await res.json();
        updateBotMessage(botMsgEl, data.reply || data.error || 'Không có phản hồi.');
    } catch {
        updateBotMessage(botMsgEl, 'Không thể kết nối đến AI.');
    }
}

function appendUserMessage(text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-message user';
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function appendBotMessage(text) {
    const container = document.getElementById('chat-messages');

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message bot';

    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.innerHTML = '<i class="fa-solid fa-earth-asia"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'bot-bubble';

    const textEl = document.createElement('div');
    textEl.className = 'bot-text';
    textEl.innerText = text;

    const actions = document.createElement('div');
    actions.className = 'bot-actions';
    actions.innerHTML = `
        <button class="bot-action-btn" title="Tạo lại" onclick="regenerateLastMessage(this)">
            <i class="fa-solid fa-rotate-right"></i>
        </button>
        <button class="bot-action-btn" title="Hữu ích" onclick="this.style.color='#22c55e'">
            <i class="fa-solid fa-thumbs-up"></i>
        </button>
        <button class="bot-action-btn" title="Không hữu ích" onclick="this.style.color='#ef4444'">
            <i class="fa-solid fa-thumbs-down"></i>
        </button>
    `;

    bubble.appendChild(textEl);
    bubble.appendChild(actions);
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;

    return textEl; // trả về element text để update sau
}

function updateBotMessage(textEl, text) {
    textEl.innerText = text;
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

async function regenerateLastMessage(btn) {
    const container = document.getElementById('chat-messages');
    const userMsgs = container.querySelectorAll('.chat-message.user');
    if (userMsgs.length === 0) return;

    const lastUserMsg = userMsgs[userMsgs.length - 1].innerText;
    const botBubble = btn.closest('.bot-bubble');
    const textEl = botBubble.querySelector('.bot-text');
    textEl.innerText = '...';

    // Lấy thời gian thực tế
    const tzData = typeof COUNTRY_TIMEZONE !== 'undefined' ? COUNTRY_TIMEZONE[currentCountry] : null;
    let realtime = '';
    if (tzData) {
        const now = new Date();
        const fmt = new Intl.DateTimeFormat('vi-VN', {
            timeZone: tzData.tz,
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
        realtime = fmt.format(now);
    } else {
        realtime = new Date().toLocaleString('vi-VN');
    }

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: lastUserMsg, country: currentCountry, realtime })
        });
        const data = await res.json();
        textEl.innerText = data.reply || data.error || 'Không có phản hồi.';
    } catch {
        textEl.innerText = 'Không thể kết nối đến AI.';
    }
}

// ===================== TẠO ẢNH =====================
document.querySelectorAll('.btn-create')[0].onclick = async function () {
    const promptInput = document.getElementById('img-prompt').value.trim();
    const resolution  = document.getElementById('img-resolution').value;
    const style       = document.getElementById('img-style').value;
    const angle       = document.getElementById('img-angle').value;

    if (!promptInput) {
        alert('Vui lòng nhập mô tả ảnh.');
        return;
    }

    const btn = this;
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...';

    let preview = btn.parentElement.querySelector('.result-preview');
    if (!preview) {
        preview = document.createElement('div');
        preview.className = 'result-preview';
        btn.parentElement.insertBefore(preview, btn);
    }
    preview.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI đang vẽ ảnh...';
    preview.classList.add('visible');

    try {
        // Bước 1: Enhance prompt
        let enhancedPrompt = promptInput;
        try {
            const res1 = await fetch('/api/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptInput, style, angle, country: currentCountry })
            });
            const data1 = await res1.json();
            if (data1.prompt) enhancedPrompt = data1.prompt;
        } catch {
            enhancedPrompt = promptInput;
        }

        // Bước 2: Gọi backend proxy tạo ảnh
        const seed = Math.floor(Math.random() * 999999);
        const res2 = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: enhancedPrompt, resolution, style, angle, seed })
        });

        if (!res2.ok) {
            const err = await res2.json();
            preview.innerHTML = '❌ ' + (err.error || 'Không thể tạo ảnh');
            btn.classList.remove('loading');
            btn.innerHTML = '<i class="fa-solid fa-camera"></i> Bắt đầu tạo ảnh';
            return;
        }

        // Bước 3: Hiển thị ảnh
        const blob = await res2.blob();
        const imgUrl = URL.createObjectURL(blob);

        preview.innerHTML = '';
        const imgEl = document.createElement('img');
        imgEl.src = imgUrl;
        imgEl.alt = promptInput;
        imgEl.style.cssText = 'width:100%;border-radius:8px;margin-top:8px;cursor:pointer;';
        imgEl.title = 'Click để tải về';
        imgEl.onclick = () => {
            const a = document.createElement('a');
            a.href = imgUrl;
            a.download = `global-pulse-${Date.now()}.jpg`;
            a.click();
        };

        const caption = document.createElement('p');
        caption.style.cssText = 'font-size:0.75rem;color:rgba(255,255,255,0.4);margin:6px 0 0;';
        caption.innerText = `📐 ${resolution} · 🎨 ${style} · Click ảnh để tải về`;

        preview.appendChild(imgEl);
        preview.appendChild(caption);
        btn.classList.remove('loading');
        btn.innerHTML = '<i class="fa-solid fa-camera"></i> Tạo ảnh mới';

    } catch (err) {
        preview.innerHTML = '❌ Lỗi: ' + err.message;
        btn.classList.remove('loading');
        btn.innerHTML = '<i class="fa-solid fa-camera"></i> Bắt đầu tạo ảnh';
    }
};

// ===================== TẠO BÁO CÁO =====================
document.querySelectorAll('.btn-create')[1].onclick = async function () {
    const format     = document.getElementById('report-format').value;
    const prompt     = document.getElementById('report-prompt').value.trim();
    const lang       = document.getElementById('report-lang').value;

    if (!prompt) {
        alert('Vui lòng nhập nội dung yêu cầu báo cáo.');
        return;
    }

    const btn = this;
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...';

    let preview = btn.parentElement.querySelector('.result-preview');
    if (!preview) {
        preview = document.createElement('div');
        preview.className = 'result-preview';
        btn.parentElement.insertBefore(preview, btn);
    }
    preview.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI đang soạn báo cáo...';
    preview.classList.add('visible');

    try {
        const res = await fetch('/api/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format, prompt, lang, country: currentCountry })
        });

        if (!res.ok) {
            const err = await res.json();
            preview.innerHTML = '❌ ' + (err.error || 'Lỗi không xác định');
            btn.classList.remove('loading');
            btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Bắt đầu tạo báo cáo';
            return;
        }

        // Lấy tên file từ header
        const disposition = res.headers.get('Content-Disposition') || '';
        const nameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        let filename = nameMatch && nameMatch[1] ? nameMatch[1].replace(/['"]/g, '') : `report_${currentCountry}_${Date.now()}`;
        
        // Tải file về
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);

        // Thử auto-download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Hiển thị thông báo + nút tải thủ công
        const extIcon = format.includes('PDF') ? '📄' : format.includes('Excel') ? '📊' : '📑';
        preview.innerHTML = `
            <div style="text-align:center;padding:16px 0;">
                <div style="font-size:2.5rem;margin-bottom:10px;">${extIcon}</div>
                <div style="font-weight:600;font-size:0.95rem;margin-bottom:6px;color:#38bdf8;">Báo cáo đã được tạo!</div>
                <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:12px;word-break:break-all;">${filename}</div>
                <button class="btn-download-report" data-url="${url}" data-name="${filename}"
                    style="background:#38bdf8;border:none;color:#000;padding:10px 20px;border-radius:10px;
                    cursor:pointer;font-size:0.85rem;font-weight:600;margin:4px;">
                    <i class="fa-solid fa-download"></i> Tải về
                </button>
                <button onclick="this.closest('.result-preview').nextElementSibling.click()"
                    style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);
                    color:rgba(255,255,255,0.7);padding:10px 20px;border-radius:10px;cursor:pointer;
                    font-size:0.85rem;margin:4px;">
                    <i class="fa-solid fa-rotate-right"></i> Tạo lại
                </button>
            </div>`;

        // Gắn event cho nút tải
        preview.querySelector('.btn-download-report').onclick = function() {
            const link = document.createElement('a');
            link.href = this.dataset.url;
            link.download = this.dataset.name;
            link.click();
        };

        btn.classList.remove('loading');
        btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Bắt đầu tạo báo cáo';

    } catch (err) {
        preview.innerHTML = '❌ Lỗi kết nối: ' + err.message;
        btn.classList.remove('loading');
        btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Bắt đầu tạo báo cáo';
    }
};
