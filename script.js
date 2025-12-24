/**
 * 阿丹快省站 - 互動邏輯 v3
 * 功能：複製優惠碼 + 跳轉蝦皮 + 折扣比例排序 + 緊湊佈局
 */

// ===================================
// 全域設定
// ===================================
let globalRedirectEnabled = true;

// ===================================
// 模擬資料（之後由 n8n 動態生成）
// ===================================
const COUPON_DATA = [
    {
        code: "GU2BP87D9H",
        threshold: 100,
        discount: 20,
        type: "全站券",
        quantity: "有限",
        link: "https://shopee.tw/user/voucher-wallet"
    },
    {
        code: "MALL299M30",
        threshold: 299,
        discount: 30,
        type: "商城券",
        quantity: "有限",
        link: "https://shopee.tw/user/voucher-wallet"
    },
    {
        code: "FREESHIP50",
        threshold: 0,
        discount: 50,
        type: "免運券",
        quantity: "無限",
        link: "https://shopee.tw/user/voucher-wallet"
    },
    {
        code: "LIVE100M15",
        threshold: 100,
        discount: 15,
        type: "直播券",
        quantity: "有限",
        link: "https://shopee.tw/user/voucher-wallet"
    },
    {
        code: "XMAS500M80",
        threshold: 500,
        discount: 80,
        type: "全站券",
        quantity: "有限",
        link: "https://shopee.tw/user/voucher-wallet"
    },
    {
        code: "MALL199M25",
        threshold: 199,
        discount: 25,
        type: "商城券",
        quantity: "無限",
        link: "https://shopee.tw/user/voucher-wallet"
    },
    {
        code: "SUPER1000M80",
        threshold: 1000,
        discount: 80,
        type: "全站券",
        quantity: "有限",
        link: "https://shopee.tw/user/voucher-wallet"
    }
];

// ===================================
// DOM Elements
// ===================================
const toastEl = document.getElementById('toast');
const couponGridEl = document.getElementById('coupon-grid');
const emptyStateEl = document.getElementById('empty-state');
const redirectToggleEl = document.getElementById('redirect-toggle');

// ===================================
// 計算折扣比例（越高越划算）
// ===================================
function calcDiscountRatio(threshold, discount) {
    if (threshold === 0) {
        // 無門檻券，以折扣金額為排序依據
        return discount;
    }
    // 折扣比例 = 折扣 / 門檻 (e.g., 20/100 = 0.2 = 20%)
    return discount / threshold;
}

// ===================================
// 按折扣比例排序（高到低）
// ===================================
function sortByDiscountRatio(coupons) {
    return [...coupons].sort((a, b) => {
        const ratioA = calcDiscountRatio(a.threshold, a.discount);
        const ratioB = calcDiscountRatio(b.threshold, b.discount);
        return ratioB - ratioA; // 降冪排列
    });
}

// ===================================
// 初始化跳轉開關
// ===================================
function initToggle() {
    const savedState = localStorage.getItem('redirectEnabled');
    if (savedState !== null) {
        globalRedirectEnabled = savedState === 'true';
        if (redirectToggleEl) {
            redirectToggleEl.checked = globalRedirectEnabled;
        }
    }

    if (redirectToggleEl) {
        redirectToggleEl.addEventListener('change', function () {
            globalRedirectEnabled = this.checked;
            localStorage.setItem('redirectEnabled', globalRedirectEnabled);
            renderCoupons();
        });
    }
}

// ===================================
// 設定頁面日期
// ===================================
function setPageDate() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateStr = `${month}/${day}`;

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = `${dateStr} 優惠碼｜阿丹快省站`;
    }

    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
        headerTitle.textContent = `${dateStr} 優惠碼`;
    }
}

// ===================================
// 複製並跳轉
// ===================================
async function copyAndGo(code, link = 'https://shopee.tw/user/voucher-wallet') {
    try {
        await navigator.clipboard.writeText(code);

        if (globalRedirectEnabled) {
            showToast(`✅ ${code} 已複製`);
            setTimeout(() => {
                window.open(link, '_blank', 'noopener,noreferrer');
            }, 250);
        } else {
            showToast(`✅ ${code} 已複製`);
        }
    } catch (err) {
        fallbackCopy(code);
        showToast(`✅ ${code} 已複製`);

        if (globalRedirectEnabled) {
            setTimeout(() => {
                window.open(link, '_blank', 'noopener,noreferrer');
            }, 250);
        }
    }
}

// ===================================
// Fallback 複製
// ===================================
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// ===================================
// Toast 通知
// ===================================
function showToast(message) {
    if (!toastEl) return;

    toastEl.textContent = message;
    toastEl.classList.add('show', 'toast--success');

    setTimeout(() => {
        toastEl.classList.remove('show', 'toast--success');
    }, 1800);
}

// ===================================
// 渲染優惠碼卡片
// ===================================
function renderCoupons(coupons = COUPON_DATA) {
    if (!couponGridEl) return;

    couponGridEl.innerHTML = '';

    if (!coupons || coupons.length === 0) {
        if (emptyStateEl) emptyStateEl.style.display = 'block';
        return;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';

    // 按折扣比例排序
    const sortedCoupons = sortByDiscountRatio(coupons);

    sortedCoupons.forEach(coupon => {
        const card = createCouponCard(coupon);
        couponGridEl.appendChild(card);
    });
}

// ===================================
// 建立單張優惠碼卡片（緊湊版）
// ===================================
function createCouponCard(coupon) {
    const {
        code,
        threshold = 0,
        discount = 0,
        type = '全站券',
        quantity = '有限',
        link = 'https://shopee.tw/user/voucher-wallet'
    } = coupon;

    const card = document.createElement('div');
    card.className = 'coupon-card coupon-card--compact';

    const quantityClass = quantity === '無限' ? 'tag--unlimited' : 'tag--quantity';
    const quantityLabel = quantity === '無限' ? '無限' : '限量';
    const thresholdText = threshold > 0 ? `滿 $${threshold}` : '無門檻';

    // 計算折扣百分比顯示
    let discountPercent = '';
    if (threshold > 0) {
        const percent = Math.round((discount / threshold) * 100);
        discountPercent = `${percent}%`;
    }

    card.innerHTML = `
    ${discountPercent ? `<span class="coupon-card__discount-badge">${discountPercent} OFF</span>` : ''}
    <div class="coupon-card__tags">
      <span class="tag tag--type">${type}</span>
      <span class="tag ${quantityClass}">${quantityLabel}</span>
    </div>
    <div class="coupon-card__info">
      <p class="coupon-card__deal">
        <span class="threshold">${thresholdText}</span>
        <span class="discount"> 折 $${discount}</span>
      </p>
    </div>
    <button class="coupon-card__button" onclick="copyAndGo('${code}', '${link}')">
      <span class="code">${code}</span>
    </button>
  `;

    return card;
}

// ===================================
// 從外部 JSON 載入資料
// ===================================
async function loadCouponsFromJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('載入失敗');
        const data = await response.json();
        renderCoupons(data.coupons || data);
    } catch (error) {
        console.error('載入優惠碼資料失敗:', error);
        renderCoupons(COUPON_DATA);
    }
}
