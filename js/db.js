// js/db.js
import { collection, onSnapshot, doc, updateDoc, setDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db, auth } from './firebase-config.js';
import { state } from './state.js';
import { enforceAuthorization } from './auth.js';

// ======== 1. 核心資料庫寫入防護 ========
export async function safeWrite(promise) { 
    if (!navigator.onLine) return 'offline'; 
    const t = new Promise(r => setTimeout(() => r('timeout'), 3000)); 
    const res = await Promise.race([promise, t]); 
    if (res === 'timeout') console.warn("寫入暫存於本地快取"); 
    return res; 
}

const snapErrorHandler = (err) => { console.warn("Firestore 讀取被拒絕:", err.message); };

// ======== 2. 全域即時資料監聽 (Realtime Listeners) ========
export function setupRealtimeListeners() {
    let count = 0; 
    const check = () => { 
        count++; 
        if (count >= 13 && !state.isInitialized) { 
            state.isInitialized = true; 
            const loader = document.getElementById('loading-overlay');
            if(loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 300);
            }
            enforceAuthorization(); 
        } else if (state.isInitialized) { 
            enforceAuthorization(); 
        } 
    };

    // 存取申請與白名單
    onSnapshot(collection(db, "access_requests"), (s) => {
        state.globalAccessRequests = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        const bdg = document.getElementById('admin-badge'), mb = document.getElementById('admin-badge-menu');
        if (bdg && mb) { 
            if (state.globalAccessRequests.length > 0 && (state.globalAdmins.includes(auth.currentUser?.email) || auth.currentUser?.email === state.SUPER_ADMIN)) { 
                bdg.style.display = 'flex'; bdg.innerText = state.globalAccessRequests.length; mb.innerText = state.globalAccessRequests.length; 
            } else { bdg.style.display = 'none'; mb.innerText = '0'; } 
        }
        if (document.getElementById('approval-modal-overlay')?.classList.contains('active') && window.renderApprovalList) window.renderApprovalList(); 
        check();
    }, snapErrorHandler);

    onSnapshot(doc(db, "settings", "admins"), (s) => { 
        if(s.exists()) state.globalAdmins = s.data().emails || []; 
        else { safeWrite(setDoc(doc(db, "settings", "admins"), { emails: [state.SUPER_ADMIN] })); state.globalAdmins = [state.SUPER_ADMIN]; } 
        if(document.getElementById('whitelist-modal-overlay')?.classList.contains('active') && window.renderWhitelist) window.renderWhitelist(); 
        check(); 
    }, snapErrorHandler);

    onSnapshot(doc(db, "settings", "whitelist"), (s) => { 
        if(s.exists()) state.globalWhitelist = s.data().emails || []; 
        else { safeWrite(setDoc(doc(db, "settings", "whitelist"), { emails: [state.SUPER_ADMIN] })); state.globalWhitelist = [state.SUPER_ADMIN]; } 
        if(document.getElementById('whitelist-modal-overlay')?.classList.contains('active') && window.renderWhitelist) window.renderWhitelist(); 
        check(); 
    }, snapErrorHandler);

    onSnapshot(collection(db, "users"), (s) => {
        state.globalUsers = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        if (auth.currentUser) { 
            const p = state.globalUsers.find(u => u.id === (auth.currentUser.email || '')); 
            if (p) { 
                if (p.nickname) {
                    const el = document.getElementById('user-name-display');
                    if(el) el.innerText = p.nickname;
                }
                state.myPinnedItems = p.pinnedItems || []; 
                if (state.currentLevel === 0 && window.renderPinnedItems) window.renderPinnedItems(); 
            } 
        }
        if(document.getElementById('whitelist-modal-overlay')?.classList.contains('active') && window.renderWhitelist) window.renderWhitelist(); 
        check();
    }, snapErrorHandler);

    // 核心實體資料
    onSnapshot(collection(db, "offices"), (s) => {
        state.globalOffices = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        if (state.currentLevel === 2) { 
            const a = state.globalOffices.find(o => o.id === state.currentOfficeId); 
            if (a && a.name !== state.currentOfficeName) { 
                state.currentOfficeName = a.name; 
                if(window.updateMainTitle) window.updateMainTitle(state.currentOfficeName); 
            } 
        }
        if (state.currentLevel === 0 && window.renderPinnedItems) window.renderPinnedItems(); 
        if(window.renderSidebarTree) window.renderSidebarTree(); 
        check();
    }, snapErrorHandler);

    // ✨ 修正：加入即時渲染觸發，新增人員後會立刻更新畫面
    onSnapshot(collection(db, "members"), (s) => { 
        state.globalMembers = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        check(); 
        if(document.getElementById('owner-panel')?.classList.contains('active') && window.renderOwnerDropdown) window.renderOwnerDropdown(); 
        if(state.currentLevel === 0 && window.renderPinnedItems) window.renderPinnedItems(); 
        if(state.currentLevel === 2 && window.updateDetailContent) window.updateDetailContent(); 
    }, snapErrorHandler);

    // ✨ 修正：加入即時渲染觸發，新增資產後會立刻更新畫面
    onSnapshot(collection(db, "assets"), (s) => { 
        state.globalAssets = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        check(); 
        if(state.currentLevel === 0 && window.renderPinnedItems) window.renderPinnedItems(); 
        if(state.currentLevel === 2 && window.updateDetailContent) window.updateDetailContent(); 
        if(state.currentLevel === 4 && window.showAssetsTotalView) window.showAssetsTotalView(false); 
    }, snapErrorHandler);
    
    onSnapshot(collection(db, "bookings"), (s) => { 
        state.globalBookings = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        check(); 
        if (state.currentLevel === 2 && state.currentTab === 'booking' && window.updateDetailContent) window.updateDetailContent(); 
    }, snapErrorHandler);

    onSnapshot(collection(db, "regions"), (s) => { 
        state.globalRegions = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        check(); 
        if (state.currentLevel === 0 && window.initView) window.initView(); 
    }, snapErrorHandler);

    // 資源回收桶與設定
    onSnapshot(collection(db, "deleted_items"), (s) => {
        state.globalDeletedItems = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        check();
        if (state.globalDeletedItems.length > 1000) { 
            const toDelete = [...state.globalDeletedItems].sort((a, b) => a.deletedAt.localeCompare(b.deletedAt)).slice(0, state.globalDeletedItems.length - 1000); 
            toDelete.forEach(x => safeWrite(deleteDoc(doc(db, 'deleted_items', x.id)))); 
        }
        if (document.getElementById('recycle-bin-modal-overlay')?.classList.contains('active') && window.renderRecycleBinList) window.renderRecycleBinList();
    }, snapErrorHandler);

    onSnapshot(doc(db, "settings", "categories"), (s) => { 
        if(s.exists()) state.globalCategories = s.data().list; 
        else { safeWrite(setDoc(doc(db, "settings", "categories"), { list: state.globalCategories })); } 
        if(document.getElementById('category-panel')?.classList.contains('active') && window.renderCategoryDropdown) window.renderCategoryDropdown(); 
        check(); 
    }, snapErrorHandler);

    onSnapshot(doc(db, "settings", "roomTypes"), (s) => { 
        if(s.exists()) state.globalRoomTypes = s.data().list; 
        else { safeWrite(setDoc(doc(db, "settings", "roomTypes"), { list: state.globalRoomTypes })); } 
        if(document.getElementById('room-type-panel')?.classList.contains('active') && window.renderRoomTypeDropdown) window.renderRoomTypeDropdown(); 
        check(); 
    }, snapErrorHandler);

    onSnapshot(doc(db, "settings", "titleRanks"), (s) => { 
        if(s.exists()) { 
            state.globalTitleRankSettings = s.data(); 
            if(!state.globalTitleRankSettings.global) state.globalTitleRankSettings.global = []; 
            if(!state.globalTitleRankSettings.offices) state.globalTitleRankSettings.offices = {}; 
        } else state.globalTitleRankSettings = { global: [], offices: {} }; 
        check(); 
    }, snapErrorHandler);
}

// ======== 3. 資源回收桶備份機制 ========
export async function backupToRecycleBin(collectionPath, docId, data, itemTitle = '未命名') { 
    return safeWrite(setDoc(doc(db, 'deleted_items', docId), { collectionPath, docId, data, itemTitle, deletedAt: new Date().toISOString() })); 
}

export async function restoreDeletedItem(id) {
    const item = state.globalDeletedItems.find(x => x.id === id); if(!item) return;
    try {
        await safeWrite(setDoc(doc(db, item.collectionPath, item.docId), item.data)); 
        await safeWrite(deleteDoc(doc(db, 'deleted_items', id))); 
        if(window.customAlert) window.customAlert(`已成功復原：${item.itemTitle}`);
    } catch(e) { console.error(e); if(window.customAlert) window.customAlert('復原失敗', true); }
}

// 過渡期掛載至 window 供 HTML 呼叫
window.safeWrite = safeWrite;
window.backupToRecycleBin = backupToRecycleBin;
window.restoreDeletedItem = restoreDeletedItem;