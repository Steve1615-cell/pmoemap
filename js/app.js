// js/app.js

// 1. 匯入各功能模組 (這樣瀏覽器才會去執行它們內部的邏輯與 window 綁定)
import { initAuth } from './auth.js';
import { syncHeaderLayout, customAlert } from './ui.js';
import './db.js';
import './modals.js';

// 2. 全域錯誤捕捉防護網 (防止無限載入卡死)
window.addEventListener('error', function(e) {
    const loader = document.getElementById('loading-overlay');
    if (loader && loader.style.display !== 'none') {
        loader.style.display = 'none';
        if (typeof customAlert === 'function') {
            customAlert('⚠️ 系統發生局部異常，部分功能可能受限。', true);
        }
    }
});

window.addEventListener('unhandledrejection', function(e) {
    const loader = document.getElementById('loading-overlay');
    if (loader && loader.style.display !== 'none') {
        loader.style.display = 'none';
    }
});

// 3. 綁定全域視窗縮放事件
window.addEventListener('resize', syncHeaderLayout);

// 4. 正式啟動系統：驗證身分並掛載資料
initAuth();