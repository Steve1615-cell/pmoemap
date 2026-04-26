// js/modals.js
import { collection, doc, updateDoc, setDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { state } from './state.js';
import { safeWrite, backupToRecycleBin } from './db.js';
import { customAlert, closeSidebar, closeFabMenu, updateDetailContent, showOffices, initView, goHome, goUpLevel } from './ui.js';
import { approveRequest, rejectRequest, promptStrictAction } from './auth.js';

export function openApprovalModal() { closeSidebar(); document.getElementById('avatar-dropdown').style.display = 'none'; renderApprovalList(); document.getElementById('approval-modal-overlay').classList.add('active'); }
export function closeApprovalModal() { document.getElementById('approval-modal-overlay').classList.remove('active'); }
export function renderApprovalList() {
    const d = document.getElementById('approval-list'); d.innerHTML = '';
    if (state.globalAccessRequests.length === 0) return d.innerHTML = '<div style="padding:30px; text-align:center; color:var(--text-muted);">🎉 目前沒有待審核的申請！</div>';
    state.globalAccessRequests.forEach(r => {
        const div = document.createElement('div'); div.className = 'draggable-item'; div.style.justifyContent = 'space-between';
        div.innerHTML = `<div style="display:flex; flex-direction:column; gap:4px; flex:1;"><span style="font-size:14px; font-weight:bold;">${r.name}</span><span style="font-size:12px; color:var(--text-muted);">${r.email}</span></div><div style="display:flex; gap:5px; align-items:center;"><button class="btn-primary" style="background:var(--success); font-size:12px; padding:6px 10px;" onclick="window.approveRequest('${r.email}')">✅ 允許</button><button class="btn-danger" style="font-size:12px; padding:6px 10px;" onclick="window.rejectRequest('${r.email}')">❌</button></div>`; d.appendChild(div);
    });
}

export function openNicknameModal() { const u = state.globalUsers.find(x => x.id === (auth.currentUser?.email || '')); document.getElementById('nickname-input').value = u?.nickname || ''; document.getElementById('nickname-modal-overlay').classList.add('active'); document.getElementById('avatar-dropdown').style.display = 'none'; }
export function closeNicknameModal() { document.getElementById('nickname-modal-overlay').classList.remove('active'); }
export async function saveNickname() { try { await safeWrite(setDoc(doc(db, 'users', auth.currentUser?.email || 'anonymous@preview.com'), { nickname: document.getElementById('nickname-input').value.trim() }, { merge: true })); customAlert('暱稱設定成功！'); closeNicknameModal(); } catch (e) { customAlert('暱稱設定失敗', true); } }

export function openShareModal() { document.getElementById('avatar-dropdown').style.display = 'none'; document.getElementById('share-link-input').value = window.location.origin + window.location.pathname; document.getElementById('share-invite-input').value = ''; document.getElementById('share-modal-overlay').classList.add('active'); }
export function closeShareModal() { document.getElementById('share-modal-overlay').classList.remove('active'); }
export function copyShareLink() { const c = document.getElementById('share-link-input'); c.select(); document.execCommand("copy"); customAlert('✅ 連結已複製！'); }
export async function inviteUser() { const e = document.getElementById('share-invite-input').value.trim().toLowerCase(); if (!e || !e.includes('@')) return customAlert('信箱格式無效！', true); if (state.globalWhitelist.includes(e) || e === state.SUPER_ADMIN) return customAlert('信箱已在授權名單中！', true); try { await safeWrite(setDoc(doc(db, 'settings', 'whitelist'), { emails: [...state.globalWhitelist, e] })); document.getElementById('share-invite-input').value = ''; customAlert(`成功開通 ${e}`); } catch(err) { customAlert('授權失敗', true); } }

export function openWhitelistModal() { closeSidebar(); const e = auth.currentUser?.email || 'anonymous@preview.com'; if (!(state.globalAdmins.includes(e) || e === state.SUPER_ADMIN || auth.currentUser?.isAnonymous)) return customAlert('⛔ 僅限管理員', true); renderWhitelist(); document.getElementById('whitelist-modal-overlay').classList.add('active'); }
export function closeWhitelistModal() { document.getElementById('whitelist-modal-overlay').classList.remove('active'); }
export function renderWhitelist() {
    const d = document.getElementById('whitelist-list'); d.innerHTML = ''; let l = [...state.globalWhitelist]; if (!l.includes(state.SUPER_ADMIN)) l.unshift(state.SUPER_ADMIN);
    l.forEach(e => {
        const u = state.globalUsers.find(x => x.id === e); const isA = state.globalAdmins.includes(e) || e === state.SUPER_ADMIN; const div = document.createElement('div'); div.className = 'draggable-item'; div.style.justifyContent = 'space-between'; div.style.flexWrap = 'wrap';
        let html = `<div style="display:flex; align-items:center; gap:8px; flex:1; min-width:180px;"><span style="font-size:14px;">${e}</span>${u && u.nickname ? `<span style="font-size:11px; color:white; background:var(--primary); padding:2px 8px; border-radius:12px; font-weight:bold; white-space: nowrap;">${u.nickname}</span>` : ''}</div>`;
        if (e === state.SUPER_ADMIN) html += `<span style="font-size:12px; background:var(--warning); color:white; font-weight:bold; padding:4px 8px; border-radius:4px; flex-shrink: 0;">👑 創辦人</span>`;
        else if (isA) html += `<div style="display:flex; gap:5px; align-items:center;"><span style="font-size:12px; background:var(--accent); color:var(--text-main); font-weight:bold; padding:4px 8px; border-radius:4px; margin-right:5px; flex-shrink: 0;">👑 管理員</span><button class="btn-edit" style="color:var(--danger); border-color:var(--danger);" onclick="window.promptStrictAction('removeAdmin', '${e}')">🗑️ 降級移除</button></div>`;
        else html += `<div style="display:flex; gap:5px; align-items:center;"><button class="btn-edit" style="color:var(--primary); border-color:var(--primary);" onclick="window.promptStrictAction('promoteAdmin', '${e}')">⬆️ 授權管理員</button><button class="btn-edit" style="color:var(--danger);" onclick="window.promptStrictAction('removeUser', '${e}')">🗑️</button></div>`;
        div.innerHTML = html; d.appendChild(div);
    });
}
export async function addWhitelistEmail() { const input = document.getElementById('whitelist-input'); const email = input.value.trim().toLowerCase(); if (!email || !email.includes('@')) return customAlert('格式無效！', true); if (state.globalWhitelist.includes(email) || email === state.SUPER_ADMIN) return customAlert('已在白名單！', true); try { await safeWrite(setDoc(doc(db, 'settings', 'whitelist'), { emails: [...state.globalWhitelist, email] })); input.value = ''; customAlert(`成功加入白名單！`); } catch(e) { customAlert('失敗', true); } }
export function promptDeleteWhitelist(email) { promptStrictAction('removeUser', email); }

export function openFriendlyLinkModal() { document.getElementById('link-name-input').value = ''; document.getElementById('link-url-input').value = ''; document.getElementById('friendly-link-modal-overlay').classList.add('active'); closeSidebar(); }
export function closeFriendlyLinkModal() { document.getElementById('friendly-link-modal-overlay').classList.remove('active'); }
export async function saveFriendlyLink() {
    const name = document.getElementById('link-name-input').value.trim(); let url = document.getElementById('link-url-input').value.trim();
    if (!name || !url) return customAlert('名稱與網址皆為必填！', true); if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (state.globalFriendlyLinks.length >= 20) return customAlert('友站連結已達 20 個上限！', true);
    try { await safeWrite(setDoc(doc(db, 'settings', 'friendlyLinks'), { list: [...state.globalFriendlyLinks, { name, url, clicks: 0 }] })); customAlert('成功新增友站連結！'); closeFriendlyLinkModal(); } catch (e) { customAlert('儲存失敗', true); }
}
export function promptDeleteFriendlyLink(i) {
    state.pendingDeleteAction = { type: 'friendlyLink', index: i }; document.getElementById('confirm-modal-title').innerText = '⚠️ 移除友站連結'; document.getElementById('confirm-msg').innerText = `確定要刪除常用連結「${state.globalFriendlyLinks[i].name}」嗎？`; document.getElementById('strict-input-container').style.display = 'none'; document.getElementById('btn-confirm-action').innerText = '確定移除'; document.getElementById('btn-confirm-action').disabled = false; document.getElementById('confirm-modal-overlay').classList.add('active');
}

export function openPinModal() { document.getElementById('pin-search-modal-input').value = ''; window.filterPinItemsModal(); document.getElementById('pin-modal-overlay').classList.add('active'); document.getElementById('pin-search-modal-input').focus(); }
export function closePinModal() { document.getElementById('pin-modal-overlay').classList.remove('active'); }
export function filterPinItemsModal() {
    const t = document.getElementById('pin-search-modal-input').value.toLowerCase(); const d = document.getElementById('pin-modal-list'); d.innerHTML = ''; let res = [];
    [...new Set(state.globalOffices.map(o => o.floor || '未分類區域'))].forEach(f => { if(f.toLowerCase().includes(t)) res.push({type: 'floor', id: f, name: f, icon: '🏢'}); });
    state.globalRegions.forEach(r => { if(r.name.toLowerCase().includes(t) && !res.some(x=>x.name===r.name)) res.push({type: 'floor', id: r.name, name: r.name, icon: '🏢'}); });
    state.globalOffices.forEach(o => { if(o.name.toLowerCase().includes(t)) res.push({type: 'office', id: o.id, name: o.name, officeName: o.name, icon: '🚪'}); });
    state.globalMembers.forEach(m => { if(m.name.toLowerCase().includes(t)) res.push({type: 'member', id: m.id, name: m.name, icon: '👤'}); });
    state.globalAssets.forEach(a => { const n = a.item || '未命名設備'; if(n.toLowerCase().includes(t) || (a.sn && a.sn.toLowerCase().includes(t))) res.push({type: 'asset', id: a.id, name: n, icon: '📦'}); });
    
    res.slice(0, 30).forEach(x => {
        const div = document.createElement('div'); div.className = 'dropdown-item'; let tl = x.type==='floor'?'大樓/區域':x.type==='office'?'辦公室':x.type==='member'?'人員':'資產';
        div.innerHTML = `<span style="font-weight:bold; font-size:14px; display:flex; gap:8px;"><span>${x.icon}</span> <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${x.name}</span></span><span style="font-size:11px; color:white; background:var(--text-muted); padding:2px 6px; border-radius:12px; font-weight:bold;">${tl}</span>`;
        div.onclick = (e) => { e.stopPropagation(); window.addPinItem(x); }; d.appendChild(div);
    });
    if(res.length === 0) d.innerHTML = '<div style="padding:20px; color:#94a3b8; font-size:13px; text-align:center;">無符合項目</div>';
}
export async function addPinItem(res) {
    if (state.myPinnedItems.length >= 8) return customAlert('置頂項目最多只能 8 個！', true);
    if (state.myPinnedItems.find(p => p.id === res.id && p.type === res.type)) return customAlert('此項目已經在置頂清單中！', true);
    const obj = { type: res.type, id: res.id, name: res.name, icon: res.icon }; if (res.officeName) obj.officeName = res.officeName; 
    state.myPinnedItems = [...state.myPinnedItems, obj]; initView(); closePinModal(); 
    try { await safeWrite(setDoc(doc(db, 'users', auth.currentUser?.email || 'anonymous@preview.com'), { pinnedItems: state.myPinnedItems }, { merge: true })); } catch(err) {}
}
export async function removePinItem(idx) {
    state.myPinnedItems.splice(idx, 1); initView(); 
    try { await safeWrite(setDoc(doc(db, 'users', auth.currentUser?.email || 'anonymous@preview.com'), { pinnedItems: state.myPinnedItems }, { merge: true })); } catch(e) {}
}

let titleDragSrcEl = null; 
export function openTitleRankModal() { closeSidebar(); const ss = document.getElementById('title-rank-scope'); ss.innerHTML = `<option value="global">🌍 套用至所有辦公室 (預設全域)</option>`; const owm = [...new Set(state.globalMembers.map(m => m.office_id))]; state.globalOffices.filter(o => owm.includes(o.id)).sort((a,b) => a.name.localeCompare(b.name)).forEach(o => { ss.innerHTML += `<option value="${o.id}">🏢 指定辦公室：${o.name}</option>`; }); ss.value = 'global'; changeTitleRankScope(); document.getElementById('title-rank-modal-overlay').classList.add('active'); }
export function closeTitleRankModal() { document.getElementById('title-rank-modal-overlay').classList.remove('active'); }
export function changeTitleRankScope() {
    state.currentTitleRankScope = document.getElementById('title-rank-scope').value; const ats = new Set(); let tm = state.globalMembers;
    if (state.currentTitleRankScope !== 'global') tm = state.globalMembers.filter(m => m.office_id === state.currentTitleRankScope);
    tm.forEach(m => { if(m.title && m.title !== 'N/A' && m.title.trim() !== '') ats.add(m.title.trim()); });
    if (state.currentTitleRankScope !== 'global' && ats.size === 0) { state.tempTitleRanks = []; renderTitleRankList(); return; }
    let er = state.currentTitleRankScope === 'global' ? (state.globalTitleRankSettings.global || []) : (state.globalTitleRankSettings.offices[state.currentTitleRankScope] || []); if(er.length===0 && state.currentTitleRankScope!=='global') er = state.globalTitleRankSettings.global || [];
    state.tempTitleRanks = [...er]; ats.forEach(t => { if (!state.tempTitleRanks.includes(t)) state.tempTitleRanks.push(t); }); state.tempTitleRanks = state.tempTitleRanks.filter(t => ats.has(t)); renderTitleRankList();
}
export function renderTitleRankList() {
    const d = document.getElementById('title-rank-list'); d.innerHTML = '';
    if (state.tempTitleRanks.length === 0) { d.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">此範圍內尚未登錄任何職稱</div>'; return; }
    state.tempTitleRanks.forEach((t, i) => { const div = document.createElement('div'); div.className = 'draggable-item'; div.draggable = true; div.dataset.index = i; div.innerHTML = `<span class="drag-handle">☰</span><span style="background:var(--accent); color:var(--text-muted); font-size:12px; padding:2px 6px; border-radius:4px; font-family:monospace;">${i + 1}</span><span style="flex:1; font-weight:bold;">${t}</span>`; div.addEventListener('dragstart', function(e){ titleDragSrcEl = this; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/html', this.innerHTML); this.classList.add('dragging'); }); div.addEventListener('dragover', function(e){ if(e.preventDefault) e.preventDefault(); e.dataTransfer.dropEffect='move'; return false; }); div.addEventListener('dragenter', function(e){ this.classList.add('drag-over'); }); div.addEventListener('dragleave', function(e){ this.classList.remove('drag-over'); }); div.addEventListener('drop', function(e){ if (e.stopPropagation) e.stopPropagation(); if (titleDragSrcEl !== this) { const f = parseInt(titleDragSrcEl.dataset.index), t = parseInt(this.dataset.index), item = state.tempTitleRanks.splice(f, 1)[0]; state.tempTitleRanks.splice(t, 0, item); renderTitleRankList(); } return false; }); div.addEventListener('dragend', function(e){ this.classList.remove('dragging'); document.querySelectorAll('.draggable-item').forEach(col => col.classList.remove('drag-over')); }); d.appendChild(div); });
}
export function promptSaveTitleRanks() { const t = document.getElementById('title-rank-scope').options[document.getElementById('title-rank-scope').selectedIndex].text; state.pendingDeleteAction = { type: 'titleRanks' }; document.getElementById('confirm-modal-title').innerText = '⚠️ 套用設定確認'; document.getElementById('confirm-msg').innerText = `確定將此排序套用至\n「${t}」？`; document.getElementById('confirm-modal-overlay').classList.add('active'); }

export function openUpdateLogModal() { closeSidebar(); document.getElementById('update-log-modal-overlay').classList.add('active'); }
export function closeUpdateLogModal() { document.getElementById('update-log-modal-overlay').classList.remove('active'); }

export function openRecycleBinModal() { closeSidebar(); window.renderRecycleBinList(); document.getElementById('recycle-bin-modal-overlay').classList.add('active'); }
export function closeRecycleBinModal() { document.getElementById('recycle-bin-modal-overlay').classList.remove('active'); }
export function renderRecycleBinList() {
    const listDiv = document.getElementById('recycle-bin-list'); listDiv.innerHTML = '';
    if(state.globalDeletedItems.length === 0) { listDiv.innerHTML = '<div style="padding:30px; text-align:center; color:#94a3b8;">回收桶目前是空的</div>'; return; }
    const sorted = [...state.globalDeletedItems].sort((a,b) => b.deletedAt.localeCompare(a.deletedAt));
    sorted.forEach(item => {
        const itemDiv = document.createElement('div'); itemDiv.className = 'draggable-item'; itemDiv.style.justifyContent = 'space-between';
        const dateStr = new Date(item.deletedAt).toLocaleString('zh-TW', {hour12: false});
        itemDiv.innerHTML = `<div style="display:flex; flex-direction:column; gap:4px; flex:1;"><span style="font-size:14px; font-weight:bold; color:var(--text-main);">${item.itemTitle}</span><span style="font-size:11px; color:var(--text-muted);">${dateStr} | 類型: ${item.collectionPath}</span></div><button class="btn-primary" style="padding:6px 12px; font-size:12px; flex-shrink:0;" onclick="window.restoreDeletedItem('${item.id}')">復原</button>`;
        listDiv.appendChild(itemDiv);
    });
}

export function openRegionModal() { closeFabMenu(); document.getElementById('region-name-input').value = ''; document.getElementById('region-modal-overlay').classList.add('active'); }
export function closeRegionModal() { document.getElementById('region-modal-overlay').classList.remove('active'); }
export async function saveRegionData() {
    const n = document.getElementById('region-name-input').value.trim(); if (!n) return customAlert('名稱不能為空！', true);
    if (state.globalRegions.find(r => r.name === n) || state.globalOffices.find(o => o.floor === n)) return customAlert('此區域已存在！', true);
    try { await safeWrite(setDoc(doc(collection(db, 'regions')), { name: n, createdAt: new Date().toISOString() })); closeRegionModal(); customAlert(`成功新增區域：${n}`); } catch(e) { customAlert('新增失敗', true); }
}
export function promptDeleteRegion(rName, rId) {
    const off = state.globalOffices.filter(o => o.floor === rName);
    if (off.length === 0) { if(confirm(`確定刪除空白區域「${rName}」？`)) safeWrite(deleteDoc(doc(db, 'regions', rId))).then(() => customAlert(`已刪除區域：${rName}`)); } 
    else {
        let c = off.length; off.forEach(o => { c += state.globalMembers.filter(m => m.office_id === o.id).length; c += state.globalAssets.filter(a => a.office_id === o.id).length; c += state.globalBookings.filter(b => b.office_id === o.id).length; });
        state.pendingDeleteAction = { type: 'region', payload: { rId, rName, off }, count: c, step: 1 };
        document.getElementById('confirm-modal-title').innerText = '⚠️ 刪除警告'; document.getElementById('confirm-msg').innerText = `區域「${rName}」內包含 ${c} 項資料。\n刪除將連帶永久刪除所有房間與資產！\n確認進入刪除程序？`; document.getElementById('confirm-modal-overlay').classList.add('active');
    }
}

export function openOfficeModal(id) {
    closeFabMenu(); state.isOfficeEditMode = true; state.currentEditOfficeId = id; const o = state.globalOffices.find(x => x.id === id); if (!o) return customAlert('找不到辦公室！', true);
    document.getElementById('office-modal-title').innerText = '✏️ 編輯房間資訊'; document.getElementById('office-floor-group').style.display = 'none'; document.getElementById('office-name').value = o.name; document.getElementById('office-pwd').value = o.pwd || '';
    document.getElementById('btn-delete-office').style.display = 'inline-block'; document.getElementById('room-type-dropdown-btn').style.pointerEvents = 'none'; document.getElementById('room-type-dropdown-btn').style.background = '#f1f5f9'; document.getElementById('room-type-lock-hint').style.display = 'inline'; document.getElementById('room-type-dropdown-arrow').style.display = 'none';
    window.selectRoomType(o.roomType || '辦公室'); document.getElementById('office-modal-overlay').classList.add('active');
}
export function openAddOfficeModal() {
    closeFabMenu(); state.isOfficeEditMode = false; state.currentEditOfficeId = null; document.getElementById('office-modal-title').innerText = '➕ 新增房間/辦公室'; document.getElementById('office-floor-group').style.display = 'block'; document.getElementById('office-floor').value = state.currentFloor; document.getElementById('office-name').value = ''; document.getElementById('office-pwd').value = ''; document.getElementById('btn-delete-office').style.display = 'none'; document.getElementById('room-type-dropdown-btn').style.pointerEvents = 'auto'; document.getElementById('room-type-dropdown-btn').style.background = 'white'; document.getElementById('room-type-lock-hint').style.display = 'none'; document.getElementById('room-type-dropdown-arrow').style.display = 'inline'; window.selectRoomType('辦公室'); document.getElementById('office-modal-overlay').classList.add('active');
}
export function closeOfficeModal() { document.getElementById('office-modal-overlay').classList.remove('active'); }
export async function saveOfficeData() {
    const n = document.getElementById('office-name').value.trim(), p = document.getElementById('office-pwd').value || 'N/A'; if (!n) return customAlert('辦公室名稱不能為空！', true); const btn = document.getElementById('btn-save-office'); btn.disabled = true; btn.innerText = '儲存中...';
    try {
        if (state.isOfficeEditMode) {
            if (state.globalOffices.find(o => o.name === n && o.id !== state.currentEditOfficeId)) return (customAlert('名稱存在', true), btn.disabled = false, btn.innerText = '儲存'); 
            await safeWrite(updateDoc(doc(db, 'offices', state.currentEditOfficeId), { name: n, pwd: p })); closeOfficeModal(); customAlert(`房間資訊已更新！`);
        } else {
            if (state.globalOffices.find(o => o.name === n)) return (customAlert('名稱存在', true), btn.disabled = false, btn.innerText = '儲存'); 
            await safeWrite(setDoc(doc(collection(db, 'offices')), { name: n, floor: state.currentFloor, pwd: p, roomType: state.currentRoomType })); closeOfficeModal(); customAlert(`成功新增房間：${n}`);
        }
    } catch(err) { customAlert("錯誤", true); } finally { btn.disabled = false; btn.innerText = '儲存'; }
}

export function openMemberModal(id = null) {
    closeFabMenu(); const bn = document.getElementById('btn-save-next'), bd = document.getElementById('btn-delete-member');
    if (id && typeof id === 'string') {
        state.isEditMode = true; state.currentEditMemberId = id; document.getElementById('modal-title').innerText = '✏️ 編輯人員資料'; bn.style.display = 'none'; bd.style.display = 'inline-block';
        const m = state.globalMembers.find(x => x.id === id); if(m) { document.getElementById('edit-name').value = m.name || ''; document.getElementById('edit-title').value = m.title || ''; document.getElementById('edit-join-date').value = m.join_date || ''; document.getElementById('edit-ext').value = m.ext || ''; }
    } else {
        state.isEditMode = false; state.currentEditMemberId = null; document.getElementById('modal-title').innerText = '➕ 新增人員資料'; bn.style.display = 'inline-block'; bd.style.display = 'none';
        document.getElementById('edit-name').value = ''; document.getElementById('edit-title').value = ''; document.getElementById('edit-ext').value = '';
    }
    document.getElementById('edit-modal-overlay').classList.add('active');
}
export function closeEditModal() { document.getElementById('edit-modal-overlay').classList.remove('active'); }
export async function saveMemberData(continueNext = false) {
    const n = document.getElementById('edit-name').value.trim(); if (!n) return customAlert('姓名必填！', true); const btn = document.getElementById(continueNext ? 'btn-save-next' : 'btn-save-member'), ot = btn.innerText; btn.disabled = true; btn.innerText = '儲存中...';
    try {
        const pay = { name: n, title: document.getElementById('edit-title').value || 'N/A', join_date: document.getElementById('edit-join-date').value || '', ext: document.getElementById('edit-ext').value || 'N/A', office_id: state.currentOfficeId };
        if (state.isEditMode) await safeWrite(updateDoc(doc(db, 'members', state.currentEditMemberId), pay)); 
        else { pay.dept = state.currentOfficeName.includes('接艦') ? '接艦人員' : state.currentOfficeName.includes('ABS') ? '監造人員' : state.currentOfficeName; await safeWrite(setDoc(doc(collection(db, 'members')), pay)); }
        if (continueNext && !state.isEditMode) { btn.innerText = '已新增 ✔'; ['edit-name', 'edit-title', 'edit-ext'].forEach(id => document.getElementById(id).value = ''); document.getElementById('edit-name').focus(); setTimeout(() => { btn.innerText = ot; btn.disabled = false; }, 800); } else { closeEditModal(); btn.disabled = false; btn.innerText = ot; }
    } catch(err) { customAlert("錯誤", true); btn.disabled = false; btn.innerText = ot; }
}

export function handleStartTimeChange() { const s = document.getElementById('booking-start'), e = document.getElementById('booking-end'); if (s.value) { let [h, m] = s.value.split(':').map(Number); h = (h + 1) % 24; e.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; } }
export function openBookingModal(id = null) {
    closeFabMenu(); document.getElementById('btn-save-booking').disabled = false; document.getElementById('btn-save-booking').innerText = '儲存'; document.getElementById('btn-save-next-booking').disabled = false; document.getElementById('btn-save-next-booking').innerText = '下一筆';
    const bd = document.getElementById('btn-delete-booking'), bn = document.getElementById('btn-save-next-booking'), dInp = document.getElementById('booking-date');
    const p = state.globalUsers.find(u => u.id === (auth.currentUser?.email || '')); const dn = (p && p.nickname) ? p.nickname : (auth.currentUser?.displayName || '');
    const to = new Date(), min = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
    const nm = new Date(to.getFullYear(), to.getMonth() + 2, 0), max = `${nm.getFullYear()}-${String(nm.getMonth() + 1).padStart(2, '0')}-${String(nm.getDate()).padStart(2, '0')}`;
    dInp.min = min; dInp.max = max;

    if (id && typeof id === 'string') {
        state.currentEditBookingId = id; document.getElementById('booking-modal-title').innerText = '✏️ 編輯預約排程'; bd.style.display = 'inline-block'; bn.style.display = 'none';
        const b = state.globalBookings.find(x => x.id === id); if (b) { document.getElementById('booking-title').value = b.title || ''; dInp.value = b.date || ''; document.getElementById('booking-start').value = b.startTime || ''; document.getElementById('booking-end').value = b.endTime || ''; document.getElementById('booking-user').value = b.booker || ''; }
    } else {
        state.currentEditBookingId = null; document.getElementById('booking-modal-title').innerText = '📅 新增預約排程'; bd.style.display = 'none'; bn.style.display = 'inline-block';
        document.getElementById('booking-title').value = ''; dInp.value = state.selectedCalendarDate >= min ? state.selectedCalendarDate : min; document.getElementById('booking-start').value = '09:00'; document.getElementById('booking-end').value = '10:00'; document.getElementById('booking-user').value = dn;
    }
    document.getElementById('booking-modal-overlay').classList.add('active');
}
export function closeBookingModal() { document.getElementById('booking-modal-overlay').classList.remove('active'); }
export async function saveBookingData(cN = false) {
    const t = document.getElementById('booking-title').value.trim(), di = document.getElementById('booking-date'), d = di.value, s = document.getElementById('booking-start').value, e = document.getElementById('booking-end').value, bkr = document.getElementById('booking-user').value.trim();
    if (!t || !d || !s || !e || !bkr) return customAlert('欄位皆為必填！', true); if (s >= e) return customAlert('結束時間需晚於開始時間！', true); if (d < di.min || d > di.max) return customAlert(`請選擇 ${di.min} 至 ${di.max} 的日期！`, true);
    const isConflict = state.globalBookings.some(b => { if (b.office_id !== state.currentOfficeId || b.date !== d) return false; if (state.currentEditBookingId && b.id === state.currentEditBookingId) return false; return s < b.endTime && e > b.startTime; });
    if (isConflict) return customAlert('❌ 此時段已被預約，確認是否衝堂！', true);

    const btn = document.getElementById(cN ? 'btn-save-next-booking' : 'btn-save-booking'), ot = btn.innerText; btn.disabled = true; btn.innerText = '儲存中...';
    try {
        const pay = { office_id: state.currentOfficeId, title: t, date: d, startTime: s, endTime: e, booker: bkr, updatedAt: new Date().toISOString() };
        if (state.currentEditBookingId) await safeWrite(updateDoc(doc(db, 'bookings', state.currentEditBookingId), pay)); else { pay.creatorEmail = auth.currentUser?.email || 'anon'; await safeWrite(addDoc(collection(db, 'bookings'), pay)); }
        window.selectCalendarDate(d);
        if (cN && !state.currentEditBookingId) { btn.innerText = '已新增 ✔'; setTimeout(() => { btn.innerText = ot; btn.disabled = false; }, 800); customAlert('預約已儲存！請修改時間或日期以新增下一筆。'); } 
        else { closeBookingModal(); customAlert('預約儲存成功！'); }
    } catch (err) { customAlert('儲存失敗', true); btn.disabled = false; btn.innerText = ot; }
}
export function promptDeleteBooking() { state.pendingDeleteAction = { type: 'booking', id: state.currentEditBookingId }; document.getElementById('confirm-modal-title').innerText = '⚠️ 取消預約'; document.getElementById('confirm-msg').innerText = '確定取消並刪除這筆預約？'; document.getElementById('confirm-modal-overlay').classList.add('active'); }

export function syncSnPc(src) { if (state.currentAssetCategory !== '電腦') return; if (src === 'sn') { const pc = document.getElementById('asset-pc'); const sn = document.getElementById('asset-sn'); if(pc && sn) pc.value = sn.value; } else { const sn = document.getElementById('asset-sn'); const pc = document.getElementById('asset-pc'); if(sn && pc) sn.value = pc.value; } }

export function switchAssetMainType(type) {
    const typeInput = document.getElementById('asset-main-type');
    if (typeInput) typeInput.value = type;

    const btnFixed = document.getElementById('btn-type-fixed');
    const btnConsumable = document.getElementById('btn-type-consumable');
    const fixedFields = document.getElementById('fixed-asset-fields');
    const consumableFields = document.getElementById('consumable-asset-fields');

    if (type === 'fixed') {
        if(btnFixed) { btnFixed.style.background = 'var(--primary)'; btnFixed.style.color = 'white'; }
        if(btnConsumable) { btnConsumable.style.background = 'white'; btnConsumable.style.color = 'var(--text-main)'; }
        if(fixedFields) fixedFields.style.display = 'block';
        if(consumableFields) consumableFields.style.display = 'none';
    } else {
        if(btnConsumable) { btnConsumable.style.background = 'var(--primary)'; btnConsumable.style.color = 'white'; }
        if(btnFixed) { btnFixed.style.background = 'white'; btnFixed.style.color = 'var(--text-main)'; }
        if(fixedFields) fixedFields.style.display = 'none';
        if(consumableFields) consumableFields.style.display = 'block';
    }
}

export function openAssetModal(id = null) {
    closeFabMenu(); const bd = document.getElementById('btn-delete-asset');
    if (id && typeof id === 'string') {
        state.currentEditAssetId = id; 
        if(document.getElementById('asset-modal-title')) document.getElementById('asset-modal-title').innerText = '📦 編輯資產資料'; 
        if(bd) bd.style.display = 'inline-block';
        
        const a = state.globalAssets.find(x => x.id === id);
        if(a) {
            const assetType = a.assetType || 'fixed';
            switchAssetMainType(assetType);
            
            if (assetType === 'fixed') {
                window.selectCategory(a.category || '其他'); 
                if(document.getElementById('asset-item')) document.getElementById('asset-item').value = a.item || ''; 
                if(document.getElementById('asset-sn')) document.getElementById('asset-sn').value = a.sn || ''; 
                if(document.getElementById('asset-status')) document.getElementById('asset-status').value = a.status || '正常';
                
                if (a.category === '電腦') { 
                    if(document.getElementById('asset-domain')) document.getElementById('asset-domain').value = a.domain || '外網'; 
                    if(document.getElementById('asset-pc')) document.getElementById('asset-pc').value = a.pc_id || ''; 
                    if(document.getElementById('asset-net')) document.getElementById('asset-net').value = a.net_port || ''; 
                    if(document.getElementById('asset-phone')) document.getElementById('asset-phone').value = a.phone_port || ''; 
                    if (a.owner_id) { const o = state.globalMembers.find(m => m.id === a.owner_id); if(o) window.selectOwner(o.id, o.name); else window.selectOwner('', '公用設備'); } else window.selectOwner('', '公用設備'); 
                }
            } else {
                if(document.getElementById('consumable-item')) document.getElementById('consumable-item').value = a.item || '';
                if(document.getElementById('consumable-tag')) document.getElementById('consumable-tag').value = a.tag || '';
                if(document.getElementById('consumable-quantity')) document.getElementById('consumable-quantity').value = a.quantity || 0;
                if(document.getElementById('consumable-unit')) document.getElementById('consumable-unit').value = a.unit || '個';
                if(document.getElementById('consumable-contact')) document.getElementById('consumable-contact').value = a.contactPerson || '';
                if(document.getElementById('consumable-remarks')) document.getElementById('consumable-remarks').value = a.remarks || '';
            }
        }
    } else {
        state.currentEditAssetId = null; 
        if(document.getElementById('asset-modal-title')) document.getElementById('asset-modal-title').innerText = '➕ 新增資產'; 
        if(bd) bd.style.display = 'none';
        
        switchAssetMainType('fixed');
        window.selectCategory('電腦'); 
        if(document.getElementById('asset-item')) document.getElementById('asset-item').value = ''; 
        if(document.getElementById('asset-sn')) document.getElementById('asset-sn').value = ''; 
        if(document.getElementById('asset-status')) document.getElementById('asset-status').value = '正常';
        window.selectOwner('', '公用設備'); 
        if(document.getElementById('asset-domain')) document.getElementById('asset-domain').value = '外網'; 
        if(document.getElementById('asset-pc')) document.getElementById('asset-pc').value = ''; 
        if(document.getElementById('asset-net')) document.getElementById('asset-net').value = ''; 
        if(document.getElementById('asset-phone')) document.getElementById('asset-phone').value = '';
        
        if(document.getElementById('consumable-item')) document.getElementById('consumable-item').value = ''; 
        if(document.getElementById('consumable-tag')) document.getElementById('consumable-tag').value = ''; 
        if(document.getElementById('consumable-quantity')) document.getElementById('consumable-quantity').value = '0'; 
        if(document.getElementById('consumable-unit')) document.getElementById('consumable-unit').value = '個'; 
        if(document.getElementById('consumable-contact')) document.getElementById('consumable-contact').value = ''; 
        if(document.getElementById('consumable-remarks')) document.getElementById('consumable-remarks').value = '';
    }
    if(document.getElementById('asset-modal-overlay')) document.getElementById('asset-modal-overlay').classList.add('active');
}
export function closeAssetModal() { if(document.getElementById('asset-modal-overlay')) document.getElementById('asset-modal-overlay').classList.remove('active'); }

export async function saveAssetData() {
    const typeInput = document.getElementById('asset-main-type');
    const assetType = typeInput ? typeInput.value : 'fixed';
    const btn = document.getElementById('btn-save-asset'); 
    if(btn) { btn.disabled = true; btn.innerText = '儲存中...'; }

    try {
        let assetDataToSave = { office_id: state.currentOfficeId, assetType: assetType };

        if (assetType === 'fixed') {
            let i = document.getElementById('asset-item') ? document.getElementById('asset-item').value.trim() : ''; 
            if (!i) i = state.currentAssetCategory;
            assetDataToSave = { 
                ...assetDataToSave, 
                type: 'public', 
                item: i, 
                category: state.currentAssetCategory, 
                sn: (document.getElementById('asset-sn') ? document.getElementById('asset-sn').value : '') || 'N/A', 
                status: document.getElementById('asset-status') ? document.getElementById('asset-status').value : '正常' 
            };
            if (state.currentAssetCategory === '電腦') { 
                assetDataToSave.domain = document.getElementById('asset-domain') ? document.getElementById('asset-domain').value : '外網'; 
                assetDataToSave.pc_id = (document.getElementById('asset-pc') ? document.getElementById('asset-pc').value : '') || 'N/A'; 
                assetDataToSave.net_port = (document.getElementById('asset-net') ? document.getElementById('asset-net').value : '') || 'N/A'; 
                assetDataToSave.phone_port = (document.getElementById('asset-phone') ? document.getElementById('asset-phone').value : '') || 'N/A'; 
                assetDataToSave.owner_id = document.getElementById('asset-owner-id') ? document.getElementById('asset-owner-id').value : null; 
            }
        } else {
            let i = document.getElementById('consumable-item') ? document.getElementById('consumable-item').value.trim() : '';
            if (!i) { customAlert('消耗品名稱為必填！', true); if(btn){ btn.disabled = false; btn.innerText = '儲存'; } return; }
            assetDataToSave = { 
                ...assetDataToSave, 
                item: i, 
                tag: (document.getElementById('consumable-tag') ? document.getElementById('consumable-tag').value : '') || '未分類', 
                quantity: parseInt(document.getElementById('consumable-quantity') ? document.getElementById('consumable-quantity').value : '0') || 0, 
                unit: (document.getElementById('consumable-unit') ? document.getElementById('consumable-unit').value : '') || '個', 
                contactPerson: (document.getElementById('consumable-contact') ? document.getElementById('consumable-contact').value : '') || '無', 
                remarks: (document.getElementById('consumable-remarks') ? document.getElementById('consumable-remarks').value : '') || '' 
            };
        }

        if (state.currentEditAssetId) await safeWrite(updateDoc(doc(db, 'assets', state.currentEditAssetId), assetDataToSave)); 
        else await safeWrite(setDoc(doc(collection(db, 'assets')), assetDataToSave));
        
        closeAssetModal(); customAlert("資產已儲存！");
    } catch(err) { customAlert("錯誤", true); } finally { if(btn){ btn.disabled = false; btn.innerText = '儲存'; } }
}

export function toggleCategoryDropdown(e) { if(e) e.stopPropagation(); const p = document.getElementById('category-panel'); if(!p) return; const op = document.getElementById('owner-panel'); if(op) op.classList.remove('active'); const rtp = document.getElementById('room-type-panel'); if(rtp) rtp.classList.remove('active'); p.classList.toggle('active'); if(p.classList.contains('active')) { const i = document.getElementById('category-search-input'); if(i){ i.value = ''; window.renderCategoryDropdown(); i.focus(); } } }
export function renderCategoryDropdown(t = '') {
    const l = document.getElementById('category-list'); if(!l) return; l.innerHTML = ''; const f = state.globalCategories.filter(c => c.toLowerCase().includes(t.toLowerCase()));
    if(f.length === 0) return l.innerHTML = '<div style="padding:10px; color:#94a3b8; font-size:13px; text-align:center;">找不到結果，可點擊上方 ➕ 新增</div>';
    f.forEach(c => { const d = document.createElement('div'); d.className = 'dropdown-item'; d.innerHTML = `<span style="flex:1;">${c}</span><button class="dropdown-item-delete" onclick="event.stopPropagation(); window.promptDeleteCategory('${c}')">🗑️</button>`; d.querySelector('span').onclick = () => window.selectCategory(c); l.appendChild(d); });
}
export function filterCategories() { const i = document.getElementById('category-search-input'); if(i) window.renderCategoryDropdown(i.value); }
export function selectCategory(c) { state.currentAssetCategory = c; const st = document.getElementById('selected-category-text'); if(st) st.innerText = c; const cp = document.getElementById('category-panel'); if(cp) cp.classList.remove('active'); const cf = document.getElementById('asset-computer-fields'); if(cf) cf.style.display = c === '電腦' ? 'block' : 'none'; }
export async function addCategory(e) { if(e) e.stopPropagation(); const i = document.getElementById('category-search-input'); if(!i) return; const c = i.value.trim(); if(!c) return customAlert('請輸入類型！', true); if(state.globalCategories.includes(c)) return customAlert('類型已存在！', true); try { state.globalCategories.push(c); await safeWrite(setDoc(doc(db, "settings", "categories"), { list: state.globalCategories })); i.value = ''; window.renderCategoryDropdown(); window.selectCategory(c); customAlert(`新增：${c}`); } catch(err) { customAlert('新增失敗', true); } }
export function promptDeleteCategory(c) { state.pendingDeleteAction = { type: 'category', payload: c }; const u = state.globalAssets.filter(a => a.category === c); document.getElementById('confirm-modal-title').innerText = '⚠️ 刪除警告'; document.getElementById('confirm-msg').innerText = u.length > 0 ? `曾以此類型「${c}」登錄的資產（共 ${u.length} 件）將一併刪除！\n\n請問確定？` : `確定刪除類型「${c}」？`; document.getElementById('confirm-modal-overlay').classList.add('active'); }

export function toggleRoomTypeDropdown(e) { if(e) e.stopPropagation(); const p = document.getElementById('room-type-panel'); if(!p) return; p.classList.toggle('active'); if(p.classList.contains('active')) { const i = document.getElementById('room-type-search-input'); if(i){ i.value = ''; window.renderRoomTypeDropdown(); i.focus(); } } }
export function renderRoomTypeDropdown(t = '') {
    const l = document.getElementById('room-type-list'); if(!l) return; l.innerHTML = ''; const f = state.globalRoomTypes.filter(c => c.toLowerCase().includes(t.toLowerCase()));
    if(f.length === 0) return l.innerHTML = '<div style="padding:10px; color:#94a3b8; font-size:13px; text-align:center;">找不到結果</div>';
    f.forEach(c => { const d = document.createElement('div'); d.className = 'dropdown-item'; d.innerHTML = `<span style="flex:1;">${c}</span><button class="dropdown-item-delete" onclick="event.stopPropagation(); window.promptDeleteRoomType('${c}')">🗑️</button>`; d.querySelector('span').onclick = () => window.selectRoomType(c); l.appendChild(d); });
}
export function filterRoomTypes() { const i = document.getElementById('room-type-search-input'); if(i) window.renderRoomTypeDropdown(i.value); }
export function selectRoomType(c) { state.currentRoomType = c; const st = document.getElementById('selected-room-type-text'); if(st) st.innerText = c; const rtp = document.getElementById('room-type-panel'); if(rtp) rtp.classList.remove('active'); }
export async function addRoomType(e) { if(e) e.stopPropagation(); const i = document.getElementById('room-type-search-input'); if(!i) return; const c = i.value.trim(); if(!c) return customAlert('請輸入類型！', true); if(state.globalRoomTypes.includes(c)) return customAlert('類型已存在！', true); try { state.globalRoomTypes.push(c); await safeWrite(setDoc(doc(db, "settings", "roomTypes"), { list: state.globalRoomTypes })); i.value = ''; window.renderRoomTypeDropdown(); window.selectRoomType(c); customAlert(`新增：${c}`); } catch(err) { customAlert('新增失敗', true); } }
export function promptDeleteRoomType(c) { state.pendingDeleteAction = { type: 'roomType', payload: c }; const u = state.globalOffices.filter(o => o.roomType === c); document.getElementById('confirm-modal-title').innerText = '⚠️ 刪除警告'; document.getElementById('confirm-msg').innerText = u.length > 0 ? `有 ${u.length} 間房間使用此類型「${c}」，刪除後將恢復預設。\n請問確定？` : `確定刪除房間類型「${c}」？`; document.getElementById('confirm-modal-overlay').classList.add('active'); }

export function toggleOwnerDropdown(e) { if(e) e.stopPropagation(); const p = document.getElementById('owner-panel'); if(!p) return; const cp = document.getElementById('category-panel'); if(cp) cp.classList.remove('active'); p.classList.toggle('active'); if(p.classList.contains('active')) { const i = document.getElementById('owner-search-input'); if(i){ i.value = ''; window.renderOwnerDropdown(); i.focus(); } } }
export function renderOwnerDropdown(t = '') {
    const l = document.getElementById('owner-list'); if(!l) return; l.innerHTML = ''; const f = state.globalMembers.filter(m => m.office_id === state.currentOfficeId && m.name.toLowerCase().includes(t.toLowerCase()));
    if ("公用設備 (無指定)".includes(t) || t === '') { const d = document.createElement('div'); d.className = 'dropdown-item'; d.innerHTML = `<span style="flex:1;">💻 公用設備 (無指定)</span>`; d.onclick = () => window.selectOwner('', '公用設備 (無指定)'); l.appendChild(d); }
    if(f.length === 0 && l.innerHTML === '') return l.innerHTML = '<div style="padding:10px; color:#94a3b8; font-size:13px; text-align:center;">找不到結果，點擊 ➕ 新增人員</div>';
    f.forEach(m => { const d = document.createElement('div'); d.className = 'dropdown-item'; d.innerHTML = `<span style="flex:1;">👤 ${m.name}</span><button class="dropdown-item-delete" onclick="event.stopPropagation(); window.promptDeleteOwner('${m.id}', '${m.name}')">🗑️</button>`; d.querySelector('span').onclick = () => window.selectOwner(m.id, m.name); l.appendChild(d); });
}
export function filterOwners() { const i = document.getElementById('owner-search-input'); if(i) window.renderOwnerDropdown(i.value); }
export function selectOwner(id, n) { const oi = document.getElementById('asset-owner-id'); if(oi) oi.value = id; const sot = document.getElementById('selected-owner-text'); if(sot) sot.innerText = id ? `👤 ${n}` : '💻 公用設備 (無指定)'; const op = document.getElementById('owner-panel'); if(op) op.classList.remove('active'); }
export async function addOwnerFromAsset(e) { if(e) e.stopPropagation(); const i = document.getElementById('owner-search-input'); if(!i) return; const n = i.value.trim(); if(!n) return customAlert('輸入姓名！', true); try { let d = state.currentOfficeName; if (d.includes('接艦')) d = '高緯度接艦人員'; else if (d.includes('ABS')) d = '高緯度監造人員'; const r = doc(collection(db, 'members')); await safeWrite(setDoc(r, { name: n, title: 'N/A', join_date: '', ext: 'N/A', office_id: state.currentOfficeId, dept: d })); i.value = ''; window.selectOwner(r.id, n); customAlert(`成功新增：${n}`); } catch(err) { customAlert('失敗', true); } }
export function promptDeleteOwner(id, n) { state.pendingDeleteAction = { type: 'owner', id, name: n }; const u = state.globalAssets.filter(a => a.owner_id === id); document.getElementById('confirm-modal-title').innerText = '⚠️ 刪除警告'; document.getElementById('confirm-msg').innerText = u.length > 0 ? `確定刪除人員「${n}」？\n該員名下綁定 ${u.length} 件設備，將轉退為公用。` : `確定刪除人員「${n}」？`; document.getElementById('confirm-modal-overlay').classList.add('active'); }

export function executeDeleteFromModal(t) {
    if (t === 'member') { const m = state.globalMembers.find(x => x.id === state.currentEditMemberId); if (m) promptDeleteOwner(m.id, m.name); }
    else if (t === 'asset') { const a = state.globalAssets.find(x => x.id === state.currentEditAssetId); if (a) { state.pendingDeleteAction = { type: 'asset', id: a.id, data: a }; document.getElementById('confirm-modal-title').innerText = '⚠️ 刪除警告'; let ext = ''; if (a.owner_id) { const o = state.globalMembers.find(m => m.id === a.owner_id); if (o) ext = `\n\n⚠️ 配發給「${o.name}」。`; } document.getElementById('confirm-msg').innerText = `將資產「${a.item || '設備'}」移至回收桶？${ext}`; document.getElementById('confirm-modal-overlay').classList.add('active'); } } 
    else if (t === 'office') {
        const om = state.globalMembers.filter(m => m.office_id === state.currentEditOfficeId), oa = state.globalAssets.filter(a => a.office_id === state.currentEditOfficeId), len = om.length + oa.length;
        if (len >= 3) { const s = document.getElementById('office-move-floor-select'); s.innerHTML = ''; const fm = {}; state.globalOffices.forEach(o => { const f = o.floor || '其他'; if (!fm[f]) fm[f] = true; }); Object.keys(fm).sort().forEach(f => { s.innerHTML += `<option value="${f}">🏢 轉移至：${f}</option>`; }); s.innerHTML += `<option value="ADD_NEW">➕ 新增區域 (未開放)</option>`; document.getElementById('office-action-msg').innerText = `房間內有 ${len} 項目。可轉移或刪除。`; document.getElementById('office-action-modal-overlay').classList.add('active'); } 
        else promptDeleteOffice();
    }
}
export function closeOfficeActionModal() { document.getElementById('office-action-modal-overlay').classList.remove('active'); }
export function promptDeleteOffice() {
    closeOfficeActionModal(); const len = state.globalMembers.filter(m => m.office_id === state.currentEditOfficeId).length + state.globalAssets.filter(a => a.office_id === state.currentEditOfficeId).length;
    const o = state.globalOffices.find(x => x.id === state.currentEditOfficeId), nm = o ? o.name : state.currentEditOfficeId; state.pendingDeleteAction = { type: 'office', payload: state.currentEditOfficeId, data: o, name: nm, count: len, step: 1 };
    document.getElementById('confirm-modal-title').innerText = '⚠️ 刪除警告'; document.getElementById('confirm-msg').innerText = len >= 10 ? `警告：房間內有 ${len} 項物件。移除將全數移至回收桶！確認？` : len > 0 ? `警告：內有 ${len} 項物件，將移至回收桶！確定？` : `移至回收桶？`; document.getElementById('confirm-modal-overlay').classList.add('active');
}
export async function moveOfficeRegion() { const t = document.getElementById('office-move-floor-select').value; if (t === 'ADD_NEW') return customAlert('未開放！', true); const b = document.querySelector('#office-action-modal-overlay .btn-primary'); b.disabled = true; b.innerText = '處理中...'; try { await safeWrite(updateDoc(doc(db, 'offices', state.currentEditOfficeId), { floor: t })); closeOfficeActionModal(); window.closeOfficeModal(); customAlert(`轉移至：${t}`); if (state.currentLevel === 1) showOffices(state.currentFloor); } catch(e) { customAlert('失敗', true); } finally { b.disabled = false; b.innerText = '轉移區域'; } }

export async function executeConfirmAction() {
    if (!state.pendingDeleteAction) return; const btn = document.getElementById('btn-confirm-action');
    if (state.pendingDeleteAction.strict) { const inputVal = document.getElementById('strict-confirm-input').value.trim().toLowerCase(); if (inputVal !== state.pendingDeleteAction.payload.toLowerCase()) return customAlert('輸入的信箱不相符，請重新確認！', true); }
    if ((state.pendingDeleteAction.type === 'office' || state.pendingDeleteAction.type === 'region') && state.pendingDeleteAction.count >= 10 && state.pendingDeleteAction.step === 1) {
        state.pendingDeleteAction.step = 2; document.getElementById('confirm-modal-title').innerText = '⛔ 最終防護鎖'; document.getElementById('confirm-msg').innerText = `【最終確認】\n您即將一次性刪除大量資料 (${state.pendingDeleteAction.count} 件) 至回收桶！\n\n為防止誤觸，請等待 5 秒鐘解鎖按鈕...`;
        btn.disabled = true; let timeLeft = 5; btn.innerText = `等待 ${timeLeft} 秒...`;
        if (state.strictCountdownTimer) clearInterval(state.strictCountdownTimer);
        state.strictCountdownTimer = setInterval(() => { timeLeft--; if (timeLeft > 0) { btn.innerText = `等待 ${timeLeft} 秒...`; } else { clearInterval(state.strictCountdownTimer); state.strictCountdownTimer = null; btn.disabled = false; btn.innerText = '確定執行'; btn.classList.add('btn-danger'); } }, 1000); return;
    }

    btn.disabled = true; btn.innerText = '處理中...';
    try {
        if (state.pendingDeleteAction.type === 'friendlyLink') {
            const newLinks = [...state.globalFriendlyLinks]; newLinks.splice(state.pendingDeleteAction.index, 1); await safeWrite(setDoc(doc(db, 'settings', 'friendlyLinks'), { list: newLinks }));
            closeConfirmModal(); customAlert(`已移除友站連結！`);
        } else if (state.pendingDeleteAction.type === 'booking') {
            const bData = state.globalBookings.find(b => b.id === state.pendingDeleteAction.id); if (bData) await backupToRecycleBin('bookings', state.pendingDeleteAction.id, bData, `預約：${bData.title}`);
            await safeWrite(deleteDoc(doc(db, 'bookings', state.pendingDeleteAction.id))); if (document.getElementById('booking-modal-overlay')?.classList.contains('active')) window.closeBookingModal(); closeConfirmModal(); customAlert(`已成功取消預約！`);
        } else if (state.pendingDeleteAction.type === 'promoteAdmin') {
            const targetEmail = state.pendingDeleteAction.payload; const newAdmins = [...state.globalAdmins, targetEmail]; await safeWrite(setDoc(doc(db, 'settings', 'admins'), { emails: newAdmins }));
            closeConfirmModal(); customAlert(`成功！「${targetEmail}」已升級為管理員。`);
        } else if (state.pendingDeleteAction.type === 'removeAdmin') {
            const targetEmail = state.pendingDeleteAction.payload; const newAdmins = state.globalAdmins.filter(e => e !== targetEmail); await safeWrite(setDoc(doc(db, 'settings', 'admins'), { emails: newAdmins }));
            closeConfirmModal(); customAlert(`已剝奪「${targetEmail}」的管理員權限！`);
        } else if (state.pendingDeleteAction.type === 'removeUser') {
            const targetEmail = state.pendingDeleteAction.payload; const newWl = state.globalWhitelist.filter(e => e !== targetEmail); await safeWrite(setDoc(doc(db, 'settings', 'whitelist'), { emails: newWl }));
            closeConfirmModal(); customAlert(`已將「${targetEmail}」移出系統白名單！`);
        } else if (state.pendingDeleteAction.type === 'titleRanks') {
            if (state.currentTitleRankScope === 'global') state.globalTitleRankSettings.global = [...state.tempTitleRanks]; else state.globalTitleRankSettings.offices[state.currentTitleRankScope] = [...state.tempTitleRanks];
            await safeWrite(setDoc(doc(db, "settings", "titleRanks"), state.globalTitleRankSettings)); window.closeTitleRankModal(); closeConfirmModal(); customAlert("職稱排序設定已儲存！");
            if (document.getElementById('staff-sort-select')?.value === 'title') updateDetailContent();
        } else if (state.pendingDeleteAction.type === 'category') {
            const cat = state.pendingDeleteAction.payload; const usedAssets = state.globalAssets.filter(a => a.category === cat); const ops = usedAssets.map(a => deleteDoc(doc(db, 'assets', a.id)));
            state.globalCategories = state.globalCategories.filter(c => c !== cat); ops.push(setDoc(doc(db, "settings", "categories"), { list: state.globalCategories }));
            await safeWrite(Promise.all(ops)); if (state.currentAssetCategory === cat) window.selectCategory('電腦'); if (document.getElementById('category-panel')?.classList.contains('active')) window.renderCategoryDropdown(); closeConfirmModal(); customAlert(`已刪除類型「${cat}」及其相關資產！`);
        } else if (state.pendingDeleteAction.type === 'roomType') {
            const cat = state.pendingDeleteAction.payload; const usedOffices = state.globalOffices.filter(o => o.roomType === cat); const ops = usedOffices.map(o => updateDoc(doc(db, 'offices', o.id), { roomType: '辦公室' }));
            state.globalRoomTypes = state.globalRoomTypes.filter(c => c !== cat); ops.push(setDoc(doc(db, "settings", "roomTypes"), { list: state.globalRoomTypes }));
            await safeWrite(Promise.all(ops)); if (state.currentRoomType === cat) window.selectRoomType('辦公室'); if (document.getElementById('room-type-panel')?.classList.contains('active')) window.renderRoomTypeDropdown(); closeConfirmModal(); customAlert(`已刪除房間類型「${cat}」！`);
        } else if (state.pendingDeleteAction.type === 'owner') {
            const ownerId = state.pendingDeleteAction.id; const userAssets = state.globalAssets.filter(a => a.owner_id === ownerId); const ops = userAssets.map(a => updateDoc(doc(db, 'assets', a.id), { owner_id: null }));
            const mData = state.globalMembers.find(m => m.id === ownerId); if(mData) ops.push(backupToRecycleBin('members', ownerId, mData, `人員：${mData.name}`)); ops.push(deleteDoc(doc(db, 'members', ownerId))); await safeWrite(Promise.all(ops));
            if (document.getElementById('asset-owner-id')?.value === ownerId) window.selectOwner('', '公用設備 (無指定)'); if (document.getElementById('owner-panel')?.classList.contains('active')) window.renderOwnerDropdown(document.getElementById('owner-search-input').value);
            if (document.getElementById('edit-modal-overlay')?.classList.contains('active')) window.closeEditModal(); closeConfirmModal(); customAlert(`已將該人員移至回收桶！`);
        } else if (state.pendingDeleteAction.type === 'asset') {
            const aData = state.pendingDeleteAction.data; if(aData) await backupToRecycleBin('assets', state.pendingDeleteAction.id, aData, `資產：${aData.item || aData.category}`);
            await safeWrite(deleteDoc(doc(db, 'assets', state.pendingDeleteAction.id))); if (document.getElementById('asset-modal-overlay')?.classList.contains('active')) window.closeAssetModal(); closeConfirmModal(); customAlert(`已將該資產移至回收桶！`);
        } else if (state.pendingDeleteAction.type === 'office') {
            const offId = state.pendingDeleteAction.payload; const offName = state.pendingDeleteAction.name; const membersToDelete = state.globalMembers.filter(m => m.office_id === offId); const assetsToDelete = state.globalAssets.filter(a => a.office_id === offId); const bookingsToDelete = state.globalBookings.filter(b => b.office_id === offId);
            const ops = []; 
            const oData = state.pendingDeleteAction.data; if(oData) ops.push(backupToRecycleBin('offices', offId, oData, `辦公室：${oData.name}`));
            membersToDelete.forEach(m => { ops.push(backupToRecycleBin('members', m.id, m, `人員：${m.name}`)); ops.push(deleteDoc(doc(db, 'members', m.id))); });
            assetsToDelete.forEach(a => { ops.push(backupToRecycleBin('assets', a.id, a, `資產：${a.item || a.category}`)); ops.push(deleteDoc(doc(db, 'assets', a.id))); });
            bookingsToDelete.forEach(b => { ops.push(backupToRecycleBin('bookings', b.id, b, `預約：${b.title}`)); ops.push(deleteDoc(doc(db, 'bookings', b.id))); });
            ops.push(deleteDoc(doc(db, 'offices', offId))); await safeWrite(Promise.all(ops));
            if (document.getElementById('office-modal-overlay')?.classList.contains('active')) window.closeOfficeModal(); closeConfirmModal(); customAlert(`房間「${offName}」及內部資料已移至回收桶！`); if (state.currentLevel === 2) goUpLevel();
        } else if (state.pendingDeleteAction.type === 'region') {
            const rId = state.pendingDeleteAction.payload.regionId; const rName = state.pendingDeleteAction.payload.regionName; const offices = state.pendingDeleteAction.payload.offices; const ops = [];
            const rData = state.globalRegions.find(r => r.id === rId); if(rData) ops.push(backupToRecycleBin('regions', rId, rData, `區域：${rName}`));
            offices.forEach(o => {
                ops.push(backupToRecycleBin('offices', o.id, o, `辦公室：${o.name}`));
                const membersToDelete = state.globalMembers.filter(m => m.office_id === o.id); const assetsToDelete = state.globalAssets.filter(a => a.office_id === o.id); const bookingsToDelete = state.globalBookings.filter(b => b.office_id === o.id);
                membersToDelete.forEach(m => { ops.push(backupToRecycleBin('members', m.id, m, `人員：${m.name}`)); ops.push(deleteDoc(doc(db, 'members', m.id))); });
                assetsToDelete.forEach(a => { ops.push(backupToRecycleBin('assets', a.id, a, `資產：${a.item || a.category}`)); ops.push(deleteDoc(doc(db, 'assets', a.id))); });
                bookingsToDelete.forEach(b => { ops.push(backupToRecycleBin('bookings', b.id, b, `預約：${b.title}`)); ops.push(deleteDoc(doc(db, 'bookings', b.id))); });
                ops.push(deleteDoc(doc(db, 'offices', o.id)));
            });
            if(rId) ops.push(deleteDoc(doc(db, 'regions', rId))); await safeWrite(Promise.all(ops)); closeConfirmModal(); customAlert(`區域「${rName}」及內部資料已移至回收桶！`); if (state.currentLevel === 1) goHome();
        }
    } catch(e) { console.error(e); customAlert('操作發生錯誤', true); } finally { btn.disabled = false; btn.innerText = '確定執行'; }
}

export function closeConfirmModal() { document.getElementById('confirm-modal-overlay').classList.remove('active'); document.getElementById('strict-input-container').style.display = 'none'; state.pendingDeleteAction = null; if (state.strictCountdownTimer) { clearInterval(state.strictCountdownTimer); state.strictCountdownTimer = null; } }

export async function importLegacyRequests() {
    if(!confirm('匯入歷史名單？')) return; const lo = document.getElementById('loading-overlay'); if(lo){ lo.querySelector('#loading-text').innerText = '匯入中...'; lo.style.display = 'flex'; lo.style.opacity = '1'; }
    try {
        const ops = []; let c = 0; state.globalUsers.forEach(u => { const isA = state.globalAdmins.includes(u.id) || u.id === state.SUPER_ADMIN; if (!(state.globalWhitelist.includes(u.id) || isA) && !state.globalAccessRequests.some(r => r.id === u.id) && u.id !== 'anonymous@preview.com') { ops.push(setDoc(doc(db, 'access_requests', u.id), { email: u.id, name: u.nickname || u.id.split('@')[0], timestamp: new Date().toISOString(), isLegacy: true })); c++; } });
        if (ops.length > 0) { await safeWrite(Promise.all(ops)); customAlert(`匯入 ${c} 筆`); } else customAlert('無匯入項目。');
    } catch(e) { customAlert('失敗！', true); } finally { if(lo) lo.style.display = 'none'; }
}

// 掛載至 window
window.openApprovalModal = openApprovalModal; window.closeApprovalModal = closeApprovalModal; window.renderApprovalList = renderApprovalList;
window.openNicknameModal = openNicknameModal; window.closeNicknameModal = closeNicknameModal; window.saveNickname = saveNickname;
window.openShareModal = openShareModal; window.closeShareModal = closeShareModal; window.copyShareLink = copyShareLink; window.inviteUser = inviteUser;
window.openWhitelistModal = openWhitelistModal; window.closeWhitelistModal = closeWhitelistModal; window.renderWhitelist = renderWhitelist; window.addWhitelistEmail = addWhitelistEmail; window.promptDeleteWhitelist = promptDeleteWhitelist;
window.openFriendlyLinkModal = openFriendlyLinkModal; window.closeFriendlyLinkModal = closeFriendlyLinkModal; window.saveFriendlyLink = saveFriendlyLink; window.promptDeleteFriendlyLink = promptDeleteFriendlyLink;
window.openPinModal = openPinModal; window.closePinModal = closePinModal; window.filterPinItemsModal = filterPinItemsModal;
window.openTitleRankModal = openTitleRankModal; window.closeTitleRankModal = closeTitleRankModal; window.changeTitleRankScope = changeTitleRankScope; window.renderTitleRankList = renderTitleRankList; window.promptSaveTitleRanks = promptSaveTitleRanks;
window.openUpdateLogModal = openUpdateLogModal; window.closeUpdateLogModal = closeUpdateLogModal;
window.openRecycleBinModal = openRecycleBinModal; window.closeRecycleBinModal = closeRecycleBinModal; window.renderRecycleBinList = renderRecycleBinList;
window.openRegionModal = openRegionModal; window.closeRegionModal = closeRegionModal; window.saveRegionData = saveRegionData; window.promptDeleteRegion = promptDeleteRegion;
window.openOfficeModal = openOfficeModal; window.openAddOfficeModal = openAddOfficeModal; window.closeOfficeModal = closeOfficeModal; window.saveOfficeData = saveOfficeData;
window.openMemberModal = openMemberModal; window.closeEditModal = closeEditModal; window.saveMemberData = saveMemberData;
window.handleStartTimeChange = handleStartTimeChange; window.openBookingModal = openBookingModal; window.closeBookingModal = closeBookingModal; window.saveBookingData = saveBookingData; window.promptDeleteBooking = promptDeleteBooking;
window.syncSnPc = syncSnPc; window.openAssetModal = openAssetModal; window.closeAssetModal = closeAssetModal; window.saveAssetData = saveAssetData; window.switchAssetMainType = switchAssetMainType;
window.toggleCategoryDropdown = toggleCategoryDropdown; window.renderCategoryDropdown = renderCategoryDropdown; window.filterCategories = filterCategories; window.selectCategory = selectCategory; window.addCategory = addCategory; window.promptDeleteCategory = promptDeleteCategory;
window.toggleRoomTypeDropdown = toggleRoomTypeDropdown; window.renderRoomTypeDropdown = renderRoomTypeDropdown; window.filterRoomTypes = filterRoomTypes; window.selectRoomType = selectRoomType; window.addRoomType = addRoomType; window.promptDeleteRoomType = promptDeleteRoomType;
window.toggleOwnerDropdown = toggleOwnerDropdown; window.renderOwnerDropdown = renderOwnerDropdown; window.filterOwners = filterOwners; window.selectOwner = selectOwner; window.addOwnerFromAsset = addOwnerFromAsset; window.promptDeleteOwner = promptDeleteOwner;
window.executeDeleteFromModal = executeDeleteFromModal; window.closeOfficeActionModal = closeOfficeActionModal; window.promptDeleteOffice = promptDeleteOffice; window.moveOfficeRegion = moveOfficeRegion; window.executeConfirmAction = executeConfirmAction; window.closeConfirmModal = closeConfirmModal; window.importLegacyRequests = importLegacyRequests;