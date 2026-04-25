// js/auth.js
import { onAuthStateChanged, signInWithPopup, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, provider, db } from './firebase-config.js';
import { state } from './state.js';
import { safeWrite, setupRealtimeListeners } from './db.js';

// ======== 1. 系統登入與初始化 ========
export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.querySelector('#loading-text').innerText = '正在驗證系統授權...';
                loader.style.display = 'flex'; 
                loader.style.opacity = '1';
            }

            if (user.isAnonymous) {
                document.getElementById('user-profile').style.display = 'flex'; 
                document.getElementById('user-info-text').style.display = 'block';
                document.getElementById('user-name-display').innerText = '預覽訪客'; 
                document.getElementById('user-email-display').innerText = 'canvas@preview';
                document.getElementById('user-avatar').src = 'https://via.placeholder.com/32'; 
                document.getElementById('header-left').style.visibility = 'visible';
                if(window.checkOfflineLogoutLock) window.checkOfflineLogoutLock();
                
                if (!state.isInitialized) setupRealtimeListeners(); 
                else { enforceAuthorization(); if(loader) loader.style.display = 'none'; }
                return;
            }

            document.getElementById('user-profile').style.display = 'flex'; 
            document.getElementById('user-info-text').style.display = 'block';
            document.getElementById('user-name-display').innerText = user.displayName || '系統使用者'; 
            document.getElementById('user-email-display').innerText = user.email || '';
            document.getElementById('user-avatar').src = user.photoURL || 'https://via.placeholder.com/32';
            if(window.checkOfflineLogoutLock) window.checkOfflineLogoutLock(); 

            const userId = user.email || 'anonymous@preview.com';
            await safeWrite(setDoc(doc(db, 'users', userId), { email: user.email }, { merge: true }));

            if (!state.isInitialized) {
                if(loader) loader.querySelector('#loading-text').innerText = '載入系統資料...'; 
                setupRealtimeListeners();
            } else { 
                enforceAuthorization(); 
                if(loader) loader.style.display = 'none'; 
            }
        } else {
            state.currentLevel = -1;
            ['user-profile', 'user-info-text', 'breadcrumb', 'fab-container', 'dev-tabs-container', 'pinned-section', 'btn-global-pin', 'loading-overlay', 'admin-crown'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            const headerLeft = document.getElementById('header-left');
            if (headerLeft) headerLeft.style.visibility = 'hidden';
            
            const dropdown = document.getElementById('avatar-dropdown'); 
            if (dropdown) dropdown.style.display = 'none';

            if(window.updateMainTitle) window.updateMainTitle('ＰＭＯ電子圖資系統'); 
            if(window.renderFriendlyLinks) window.renderFriendlyLinks(); 
            if(window.switchView) window.switchView('view-login');
        }
    });
}

export async function loginWithGoogle() {
    try {
        const rememberMe = document.getElementById('remember-me').checked;
        const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistenceType);
        await signInWithPopup(auth, provider);
    } catch (error) {
        if (error.code === 'auth/unauthorized-domain') {
            if (window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('localhost') || window.location.hostname.includes('goog')) { 
                if(window.customAlert) window.customAlert('啟用訪客預覽模式！'); 
                await signInAnonymously(auth); 
            } else { 
                if(window.customAlert) window.customAlert('登入失敗：網址未獲 Firebase 授權！', true); 
            }
        } else if (error.code !== 'auth/popup-closed-by-user') { 
            if(window.customAlert) window.customAlert('登入失敗：' + error.message, true); 
        }
    }
}

export function logout() { signOut(auth); }

// ======== 2. 權限控管 (Authorization) ========
export function enforceAuthorization() {
    const user = auth.currentUser; 
    if (!user) return;
    
    const userEmail = user.email || 'anonymous@preview.com'; 
    const isSuperAdmin = userEmail === state.SUPER_ADMIN;
    const isAdmin = state.globalAdmins.includes(userEmail) || isSuperAdmin || user.isAnonymous; 
    const isAuth = state.globalWhitelist.includes(userEmail) || isAdmin;

    if (isAdmin) {
        document.getElementById('admin-crown').style.display = 'inline-block'; 
        document.getElementById('menu-item-approval').style.display = 'flex';
        const btnDevWhitelist = document.getElementById('btn-dev-whitelist'); 
        if(btnDevWhitelist) btnDevWhitelist.classList.remove('locked');
        
        if (!user.isAnonymous) {
            const myProfile = state.globalUsers.find(u => u.id === userEmail);
            if (myProfile && !myProfile.hasSeenAdminWelcome) {
                if(window.openAdminWelcomeModal) window.openAdminWelcomeModal();
                safeWrite(setDoc(doc(db, 'users', userEmail), { hasSeenAdminWelcome: true }, { merge: true }));
            }
        }
    } else {
        document.getElementById('admin-crown').style.display = 'none'; 
        document.getElementById('menu-item-approval').style.display = 'none';
        document.getElementById('admin-badge').style.display = 'none';
        const btnDevWhitelist = document.getElementById('btn-dev-whitelist'); 
        if(btnDevWhitelist) btnDevWhitelist.classList.add('locked');
    }

    if(window.renderFriendlyLinks) window.renderFriendlyLinks(); 

    if (isAuth) {
        document.getElementById('header-left').style.visibility = 'visible'; 
        document.getElementById('breadcrumb').style.display = 'flex';
        if (state.currentLevel < 0) { if(window.goHome) window.goHome(false); } 
        else { if(window.refreshCurrentView) window.refreshCurrentView(); }
    } else {
        state.currentLevel = -2; 
        document.getElementById('header-left').style.visibility = 'hidden'; 
        ['breadcrumb', 'fab-container', 'dev-tabs-container', 'pinned-section', 'btn-global-pin'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
        
        if(window.updateMainTitle) window.updateMainTitle('ＰＭＯ電子圖資系統'); 
        updateUnauthorizedViewStatus(userEmail); 
        if(window.switchView) window.switchView('view-unauthorized');
    }
}

// ======== 3. 系統存取申請與審核 ========
export function updateUnauthorizedViewStatus(email) {
    const btn = document.getElementById('btn-request-access'); 
    const statusText = document.getElementById('request-access-status');
    if(!btn || !statusText) return;

    if (state.globalAccessRequests.some(r => r.id === email)) { 
        btn.style.display = 'none'; statusText.style.display = 'block'; 
    } else { 
        btn.style.display = 'block'; statusText.style.display = 'none'; 
        btn.disabled = false; btn.innerHTML = '👉 送出系統存取申請'; 
    }
}

export async function requestAccess() {
    const user = auth.currentUser; if (!user) return;
    const btn = document.getElementById('btn-request-access'); 
    btn.disabled = true; btn.innerText = '申請傳送中...';
    try {
        await safeWrite(setDoc(doc(db, 'access_requests', user.email), { 
            email: user.email, name: user.displayName || '未設定名稱', timestamp: new Date().toISOString() 
        }));
    } catch (e) { 
        console.error(e); if(window.customAlert) window.customAlert('申請送出失敗。', true); 
        btn.disabled = false; btn.innerHTML = '👉 送出系統存取申請'; 
    }
}

export async function approveRequest(email) { 
    try { 
        await safeWrite(setDoc(doc(db, 'settings', 'whitelist'), { emails: [...state.globalWhitelist, email] })); 
        await safeWrite(deleteDoc(doc(db, 'access_requests', email))); 
        if(window.customAlert) window.customAlert(`加入白名單：${email}`); 
    } catch(e) { if(window.customAlert) window.customAlert('操作失敗', true); } 
}

export async function rejectRequest(email) { 
    try { 
        await safeWrite(deleteDoc(doc(db, 'access_requests', email))); 
        if(window.customAlert) window.customAlert(`已拒絕該申請。`); 
    } catch(e) { if(window.customAlert) window.customAlert('操作失敗', true); } 
}

// ======== 4. 防呆密碼鎖 (Strict Action) ========
export function promptStrictAction(actionType, email) {
    const userEmail = auth.currentUser?.email || '';
    if (actionType === 'removeAdmin' && email === userEmail && state.globalAdmins.filter(a => a !== state.SUPER_ADMIN).length <= 1) {
        return window.customAlert('無法移除：系統必須至少保留一位一般管理員！', true);
    }

    state.pendingDeleteAction = { type: actionType, payload: email, strict: true }; 
    const confirmInputContainer = document.getElementById('strict-input-container');
    const confirmInput = document.getElementById('strict-confirm-input');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-msg');
    const btn = document.getElementById('btn-confirm-action');
    
    confirmInputContainer.style.display = 'block'; confirmInput.value = '';
    
    if (actionType === 'promoteAdmin') { 
        if (state.globalAdmins.filter(a => a !== state.SUPER_ADMIN).length >= 5 && userEmail !== state.SUPER_ADMIN) return window.customAlert('一般管理員最多 5 位！', true); 
        titleEl.innerText = '⚠️ 授權系統管理員'; msgEl.innerText = `賦予「${email}」管理權限？`; 
    }
    else if (actionType === 'removeAdmin') { titleEl.innerText = '⛔ 剝奪管理權限'; msgEl.innerText = `剝奪「${email}」權限並踢出？`; }
    else if (actionType === 'removeUser') { titleEl.innerText = '🗑️ 踢出使用者'; msgEl.innerText = `移除「${email}」？`; }
    else if (actionType === 'friendlyLink') { 
        titleEl.innerText = '⚠️ 移除友站連結'; msgEl.innerText = `確定要刪除常用連結「${state.globalFriendlyLinks[email].name}」嗎？`; 
        confirmInputContainer.style.display = 'none'; btn.disabled = false; btn.innerText = '確定移除'; 
        document.getElementById('confirm-modal-overlay').classList.add('active'); return; 
    }
    else if (actionType === 'region') { 
        titleEl.innerText = '⚠️ 刪除區域'; msgEl.innerText = email; 
        confirmInputContainer.style.display = 'none'; btn.disabled = false; btn.innerText = '確定刪除'; 
        document.getElementById('confirm-modal-overlay').classList.add('active'); return; 
    }

    btn.disabled = true; btn.innerText = '請輸入完整信箱解鎖'; btn.classList.remove('btn-danger');
    
    confirmInput.oninput = (e) => { 
        if (e.target.value.trim().toLowerCase() === email.toLowerCase()) { 
            if (!btn.disabled && btn.innerText === '確定執行') return; 
            if (state.strictCountdownTimer) return; 
            
            let tl = 5; btn.disabled = true; btn.innerText = `等待 ${tl} 秒...`; 
            state.strictCountdownTimer = setInterval(() => { 
                tl--; 
                if (tl > 0) btn.innerText = `等待 ${tl} 秒...`; 
                else { 
                    clearInterval(state.strictCountdownTimer); state.strictCountdownTimer = null; 
                    btn.disabled = false; btn.innerText = '確定執行'; btn.classList.add('btn-danger'); 
                } 
            }, 1000); 
        } else { 
            if (state.strictCountdownTimer) { clearInterval(state.strictCountdownTimer); state.strictCountdownTimer = null; } 
            btn.disabled = true; btn.innerText = '請輸入完整信箱解鎖'; btn.classList.remove('btn-danger'); 
        } 
    };
    document.getElementById('confirm-modal-overlay').classList.add('active');
}

// 過渡期掛載至 window 供 HTML 呼叫
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.requestAccess = requestAccess;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.promptStrictAction = promptStrictAction;