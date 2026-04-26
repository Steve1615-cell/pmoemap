// js/ui.js
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { state } from './state.js';

export function customAlert(msg, isDanger = false) {
    const toast = document.getElementById('custom-toast');
    if(!toast) return;
    toast.innerText = msg;
    if (isDanger) toast.classList.add('danger'); else toast.classList.remove('danger');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

export function togglePinnedSectionCollapse(e) {
    if(e) e.stopPropagation();
    const p = document.getElementById('pinned-section'), b = document.getElementById('pinned-collapse-btn');
    if (p.classList.contains('collapsed')) { p.classList.remove('collapsed'); b.innerText = '[–] 收合'; } 
    else { p.classList.add('collapsed'); b.innerText = '[+] 展開'; }
}

export function expandPinnedSection(e) {
    const p = document.getElementById('pinned-section');
    if (p.classList.contains('collapsed')) { e.stopPropagation(); togglePinnedSectionCollapse(); }
}

export function initView() {
    const gridNav = document.getElementById('floor-list-container');
    if (gridNav) {
        gridNav.innerHTML = ''; const floorMap = {};
        state.globalRegions.forEach(r => { floorMap[r.name] = { id: r.id, name: r.name, offices: [], isRegion: true }; });
        state.globalOffices.forEach(o => { const f = o.floor || '未分類區域'; if (!floorMap[f]) floorMap[f] = { id: f, name: f, offices: [], isRegion: false }; floorMap[f].offices.push(o); });
        let sortedFloors = Object.keys(floorMap).sort();
        
        if (sortedFloors.length === 0) {
            gridNav.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 50px; color: #64748b;">系統內尚無大樓與區域，請點擊右下角「＋」新增。</div>`;
        } else {
            sortedFloors.forEach((floor, idx) => {
                const regionObj = floorMap[floor]; const card = document.createElement('div'); card.className = 'nav-card'; card.onclick = () => showOffices(floor);
                let delBtn = ''; if (regionObj.isRegion) { delBtn = `<button class="card-edit-btn" onclick="event.stopPropagation(); window.promptDeleteRegion('${regionObj.name}', '${regionObj.id}')">🗑️</button>`; }
                let html = `${delBtn}<h2>${floor}</h2><ul class="preview-list" id="preview-floor-${idx}">`;
                const sortedOffices = regionObj.offices.sort((a,b) => (a.name||'').localeCompare(b.name||''));
                if (sortedOffices.length > 0) { sortedOffices.forEach(o => { html += `<li>• ${o.name}</li>`; }); } else { html += `<li style="color: #94a3b8; font-style: italic;">此區域為空</li>`; }
                html += `</ul>`; card.innerHTML = html; gridNav.appendChild(card);
            });
        }
    }
    document.getElementById('dev-tabs-container').style.display = (state.devOptionsEnabled && state.currentLevel === 0) ? 'flex' : 'none';
    if (state.currentLevel === 0) {
        const p = document.getElementById('pinned-section'), b = document.getElementById('btn-global-pin');
        if (state.myPinnedItems.length > 0) { b.style.display = 'none'; p.style.display = 'block'; state.isPinSectionVisible = true; } 
        else { b.style.display = 'inline-block'; p.style.display = state.isPinSectionVisible ? 'block' : 'none'; }
        renderPinnedItems(); 
    }
    updateNavigationUI(); if (!history.state) history.replaceState({ level: 0 }, "");
}

export function updateMainTitle(text) {
    const t = document.getElementById('title-container'); t.innerHTML = `<h1 id="main-title" class="static-title">${text}</h1>`; void t.offsetWidth; 
    requestAnimationFrame(() => setTimeout(() => { const m = document.getElementById('main-title'); if (m && m.scrollWidth > t.clientWidth) t.innerHTML = `<div class="marquee-wrapper"><h1 class="marquee-text">${text}</h1><h1 class="marquee-text">${text}</h1></div>`; }, 50));
}

export function syncHeaderLayout() { const l = document.getElementById('header-left'), r = document.getElementById('header-right'); if (l && r) r.style.width = l.offsetWidth + 'px'; }

export function renderSidebarTree() {
    const t = document.getElementById('sidebar-nav-tree'); if (!t) return;
    let html = `<div class="menu-item" onclick="window.goHome(); window.closeSidebar();" style="border-bottom: 1px solid #f1f5f9;">🏠 首頁</div>`;
    const map = {}; state.globalRegions.forEach(r => map[r.name] = []); state.globalOffices.forEach(o => { const f = o.floor || '其他樓層'; if (!map[f]) map[f] = []; map[f].push(o); });
    Object.keys(map).sort().forEach((f, idx) => {
        html += `<div class="tree-floor" onclick="window.toggleTreeFloor('floor-${idx}')"><span>🏢 ${f}</span><span id="floor-${idx}-arrow" style="font-size:12px; transition: transform 0.3s;">▼</span></div><ul class="tree-office-list" id="floor-${idx}-list">`;
        if (map[f].length > 0) { map[f].sort((a,b)=>(a.name||'').localeCompare(b.name||'')).forEach(off => { html += `<li class="tree-office" onclick="window.showDetail('${off.id}', '${off.name}'); window.closeSidebar();">↳ ${off.name}</li>`; }); } else { html += `<li class="tree-office" style="color:#cbd5e1; cursor:default;">(無房間)</li>`; }
        html += `</ul>`;
    });
    t.innerHTML = html;
}

export function toggleTreeFloor(id) { const l = document.getElementById(`${id}-list`), a = document.getElementById(`${id}-arrow`); if (l.classList.contains('open')) { l.classList.remove('open'); a.style.transform = 'rotate(0deg)'; } else { l.classList.add('open'); a.style.transform = 'rotate(180deg)'; } }
export function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('sidebar-overlay').classList.toggle('active'); }
export function closeSidebar() { document.getElementById('sidebar').classList.remove('active'); document.getElementById('sidebar-overlay').classList.remove('active'); }
export function toggleFabMenu(e) { if(e) e.stopPropagation(); document.getElementById('fab-container').classList.toggle('active'); document.getElementById('fab-menu').classList.toggle('active'); }
export function closeFabMenu() { document.getElementById('fab-container').classList.remove('active'); document.getElementById('fab-menu').classList.remove('active'); }

export function toggleDevOptions(e) {
    state.devOptionsEnabled = e.target.checked;
    if (state.currentLevel === 0) { document.getElementById('dev-tabs-container').style.display = state.devOptionsEnabled ? 'flex' : 'none'; }
}

export function updateFabMenu() {
    const m = document.getElementById('fab-menu'), c = document.getElementById('fab-container'); m.innerHTML = ''; closeFabMenu(); 
    if (state.currentLevel < 0) { c.style.display = 'none'; return; }
    if (state.currentLevel === 0) { c.style.display = 'flex'; m.innerHTML = `<button class="fab-item" onclick="window.openRegionModal()">➕ 新增區域 (大樓/樓層)</button>`; } 
    else if (state.currentLevel === 1) { c.style.display = 'flex'; m.innerHTML = `<button class="fab-item" onclick="window.openAddOfficeModal()">➕ 新增辦公室</button><button class="fab-item disabled" style="color: #94a3b8; cursor: not-allowed;">🗺️ 綁定地圖區塊 (未開放)</button>`; } 
    else if (state.currentLevel === 2) {
        c.style.display = 'flex'; let act = '';
        if (state.currentTab === 'staff') act = `<button class="fab-item" onclick="window.openMemberModal()">➕ 新增人員</button>`;
        else if (state.currentTab === 'assets') act = `<button class="fab-item" onclick="window.openAssetModal()">➕ 新增資產</button>`;
        else if (state.currentTab === 'checkout') act = `<button class="fab-item" onclick="window.customAlert('尚未開放')">➕ 新增紀錄</button>`;
        else if (state.currentTab === 'booking') act = `<button class="fab-item" onclick="window.openBookingModal()">📅 新增會議預約</button>`;
        m.innerHTML = `${act}<button class="fab-item" onclick="window.openOfficeModal('${state.currentOfficeId}')">✏️ 編輯房間資訊</button>`;
    } else { c.style.display = 'none'; }
}

export function updateNavigationUI() {
    const bh = document.getElementById('btn-global-home'), bu = document.getElementById('btn-global-up'), bc = document.getElementById('breadcrumb'), bp = document.getElementById('btn-global-pin');
    if (state.currentLevel < 0) { bh.style.display = 'none'; bu.style.display = 'none'; bp.style.display = 'none'; bc.style.display = 'none'; document.getElementById('dev-tabs-container').style.display = 'none'; document.getElementById('pinned-section').style.display = 'none'; return; }
    bc.style.display = 'flex'; 
    if (state.currentLevel === 0) { bh.style.display = 'none'; bu.style.display = 'none'; bp.style.display = state.myPinnedItems.length === 0 ? 'inline-block' : 'none'; } 
    else { bh.style.display = 'inline-block'; bu.style.display = 'inline-block'; bp.style.display = 'none'; document.getElementById('pinned-section').style.display = 'none'; }
    
    document.getElementById('dev-tabs-container').style.display = (state.currentLevel === 0 && state.devOptionsEnabled) ? 'flex' : 'none'; syncHeaderLayout();
    
    if (state.currentLevel === 0) updateMainTitle('ＰＭＯ電子圖資系統'); 
    else if (state.currentLevel === 1) updateMainTitle(state.currentFloor); 
    else if (state.currentLevel === 2) updateMainTitle(state.currentOfficeName); 
    else if (state.currentLevel === 3) updateMainTitle('辦公室分機總表');
    else if (state.currentLevel === 4) updateMainTitle('在列資產總表');

    let html = state.currentLevel === 0 ? `<span class="breadcrumb-item current">首頁</span>` : `<span class="breadcrumb-item" onclick="window.goHome()">首頁</span>`;
    if (state.currentLevel === 1 || state.currentLevel === 2) html += `<span class="breadcrumb-separator">/</span>${state.currentLevel === 1 ? `<span class="breadcrumb-item current">${state.currentFloor}</span>` : `<span class="breadcrumb-item" onclick="window.showOffices('${state.currentFloor}')">${state.currentFloor}</span>`}`;
    if (state.currentLevel === 2) html += `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item current">${state.currentOfficeName}</span>`;
    if (state.currentLevel === 3) html += `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item current">分機總表</span>`;
    if (state.currentLevel === 4) html += `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item current">在列資產總表</span>`;
    bc.innerHTML = html; updateFabMenu();
}

export function switchView(id) { document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.getElementById(id).classList.add('active'); updateNavigationUI(); }
export function goHome(push = true) { state.currentLevel = 0; state.currentFloor = ''; state.currentOfficeId = ''; state.currentOfficeName = ''; if (push) history.pushState({ level: 0 }, ""); initView(); switchView('view-floor'); }
export function goUpLevel(push = true) { if (state.currentLevel === 3 || state.currentLevel === 4) goHome(push); else if (state.currentLevel === 2) showOffices(state.currentFloor, push); else if (state.currentLevel === 1) goHome(push); }

export function showOffices(floor, push = true) {
    state.currentLevel = 1; state.currentFloor = floor; state.currentOfficeId = ''; state.currentOfficeName = ''; if (push) history.pushState({ level: 1, floor: floor }, "");
    const l = document.getElementById('office-list'); l.innerHTML = '';
    state.globalOffices.filter(o => o.floor === floor).forEach(off => {
        const c = document.createElement('div'); c.className = 'nav-card'; const rt = off.roomType || '辦公室';
        c.innerHTML = `${rt !== '辦公室' ? `<div style="position:absolute; top:12px; left:15px; font-size:12px; color:var(--text-muted); background:var(--accent); padding:2px 8px; border-radius:12px;">${rt}</div>` : ''}<button class="card-edit-btn" onclick="event.stopPropagation(); window.openOfficeModal('${off.id}')">✏️</button><h2>${off.name} ${rt === '會議室' ? `<span style="font-size:12px; color:var(--success); font-weight:bold; background:#d1fae5; padding:2px 6px; border-radius:4px; margin-left:10px;">🟢 可預約</span>` : ''}</h2><div class="password-container"><span class="password-badge">${off.pwd || 'N/A'}</span></div><div style="font-size:12px; color:var(--primary); margin-top:10px;">點擊查看詳情</div>`;
        c.onclick = () => showDetail(off.id, off.name); l.appendChild(c);
    });
    switchView('view-office');
}

export function showDetail(id, name, push = true) {
    state.currentLevel = 2; state.currentOfficeId = id; state.currentOfficeName = name; 
    const od = state.globalOffices.find(o => o.id === state.currentOfficeId); if (od && od.floor) state.currentFloor = od.floor;
    if (push) history.pushState({ level: 2, floor: state.currentFloor, officeId: id, officeName: name }, "");
    const rt = od ? (od.roomType || '辦公室') : '辦公室'; const tr = state.ROOM_TRAITS[rt] || state.ROOM_TRAITS['DEFAULT'];
    const tc = document.getElementById('dynamic-room-tabs'); tc.innerHTML = tr.tabs.map(k => `<button id="tab-${k}" class="tab-btn" onclick="window.switchTab('${k}')">${state.TAB_LABELS[k]}</button>`).join('');
    state.currentTab = tr.defaultTab; document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); const ab = document.getElementById(`tab-${state.currentTab}`); if(ab) ab.classList.add('active');
    updateDetailContent(); switchView('view-detail');
}

export function switchTab(tab) { state.currentTab = tab; document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); const ab = document.getElementById(`tab-${tab}`); if(ab) ab.classList.add('active'); updateDetailContent(); updateFabMenu(); }
export function changeCalendarMonth(d) { state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + d); updateDetailContent(); }
export function selectCalendarDate(d) { state.selectedCalendarDate = d; state.calendarViewMode = 'day'; updateDetailContent(); }
export function setCalendarViewMode(m) { state.calendarViewMode = m; updateDetailContent(); }
export function goToToday() { state.currentCalendarDate = new Date(); state.selectedCalendarDate = new Date().toISOString().split('T')[0]; state.calendarViewMode = 'day'; updateDetailContent(); }

export function updateDetailContent() {
    const grid = document.getElementById('detail-grid'); grid.innerHTML = '';
    let om = state.globalMembers.filter(m => m.office_id === state.currentOfficeId); 
    const officeAssetsList = state.globalAssets.filter(a => a.office_id === state.currentOfficeId);
    
    // ✨ 將資產分為「固定」與「消耗品」
    const fixedAssets = officeAssetsList.filter(a => a.assetType !== 'consumable');
    const consumableAssets = officeAssetsList.filter(a => a.assetType === 'consumable');

    const stb = document.getElementById('tab-staff'); if(stb) stb.innerText = `人員 (${om.length})`; 
    const atb = document.getElementById('tab-assets'); if(atb) atb.innerText = `資產 (${officeAssetsList.length})`;
    document.getElementById('filter-container').style.display = (state.currentTab === 'staff' || state.currentTab === 'assets') ? 'flex' : 'none'; document.getElementById('staff-sort-select').style.display = state.currentTab === 'staff' ? 'block' : 'none'; document.getElementById('asset-sort-select').style.display = state.currentTab === 'assets' ? 'block' : 'none';

    if (state.currentTab === 'checkout') { grid.className = 'grid-nav'; grid.innerHTML = `<div class="locked-feature-panel"><h3>🔒 此模組功能開發中</h3></div>`; return; }
    
    if (state.currentTab === 'booking') {
        grid.className = ''; grid.style.display = 'block'; let rb = state.globalBookings.filter(b => b.office_id === state.currentOfficeId); const todayStr = new Date().toISOString().split('T')[0];
        let html = `<div style="display:flex; justify-content:center; gap:8px; margin-bottom:15px; flex-wrap:wrap;"><div style="display:flex; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden;"><button onclick="window.setCalendarViewMode('day')" style="padding:6px 15px; border:none; background:${state.calendarViewMode === 'day' ? 'var(--primary)' : 'white'}; color:${state.calendarViewMode === 'day' ? 'white' : 'var(--text-main)'}; cursor:pointer; font-weight:bold;">日</button><button onclick="window.setCalendarViewMode('week')" style="padding:6px 15px; border:none; border-left:1px solid #cbd5e1; border-right:1px solid #cbd5e1; background:${state.calendarViewMode === 'week' ? 'var(--primary)' : 'white'}; color:${state.calendarViewMode === 'week' ? 'white' : 'var(--text-main)'}; cursor:pointer; font-weight:bold;">週</button><button onclick="window.setCalendarViewMode('month')" style="padding:6px 15px; border:none; background:${state.calendarViewMode === 'month' ? 'var(--primary)' : 'white'}; color:${state.calendarViewMode === 'month' ? 'white' : 'var(--text-main)'}; cursor:pointer; font-weight:bold;">月</button></div><button onclick="window.goToToday()" class="btn-secondary" style="border:1px solid #cbd5e1; background:white;">回今天</button></div>`;

        if (state.calendarViewMode === 'month') {
            const yy = state.currentCalendarDate.getFullYear(), mm = state.currentCalendarDate.getMonth(), fd = new Date(yy, mm, 1).getDay(), dim = new Date(yy, mm + 1, 0).getDate();
            html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px; background:white; padding:10px 15px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);"><button class="btn-secondary" onclick="window.changeCalendarMonth(-1)" style="padding:4px 12px;">◀ 上月</button><h3 style="margin:0; color:var(--primary); font-size:18px;">${yy}年 ${mm + 1}月</h3><button class="btn-secondary" onclick="window.changeCalendarMonth(1)" style="padding:4px 12px;">下月 ▶</button></div><div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:1px; background:#cbd5e1; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">`;
            ['日', '一', '二', '三', '四', '五', '六'].forEach(w => { html += `<div style="background:#f8fafc; padding:8px; text-align:center; font-size:13px; font-weight:bold; color:${w==='日'||w==='六'?'var(--danger)':'var(--text-muted)'};">${w}</div>`; });
            for(let i=0; i<fd; i++) html += `<div style="background:white; min-height:80px; padding:5px; opacity:0.3;"></div>`;
            for(let d=1; d<=dim; d++) {
                const dStr = `${yy}-${String(mm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const dbks = rb.filter(b => b.date === dStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
                const isSel = dStr === state.selectedCalendarDate, isTdy = dStr === todayStr; let bg = isSel ? '#eff6ff' : 'white'; let border = isSel ? '2px solid var(--primary)' : '2px solid transparent'; let dayColor = isTdy ? 'white' : 'var(--text-main)'; let dayBg = isTdy ? 'var(--danger)' : 'transparent';
                let badges = ''; dbks.slice(0, 3).forEach(b => { badges += `<div style="font-size:10px; background:var(--primary); color:white; border-radius:3px; padding:2px 4px; margin-top:3px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${b.startTime} ${b.title}</div>`; }); if(dbks.length > 3) badges += `<div style="font-size:10px; color:var(--text-muted); text-align:center; margin-top:2px;">+${dbks.length - 3} 更多</div>`;
                html += `<div style="background:${bg}; border:${border}; box-sizing:border-box; min-height:80px; padding:5px; cursor:pointer; transition:background 0.2s;" onclick="window.selectCalendarDate('${dStr}')"><div style="display:inline-block; width:20px; height:20px; line-height:20px; text-align:center; border-radius:50%; font-size:12px; font-weight:bold; color:${dayColor}; background:${dayBg};">${d}</div>${badges}</div>`;
            }
            const rmd = (fd + dim) % 7; if(rmd !== 0) for(let i=0; i<7-rmd; i++) html += `<div style="background:white; min-height:80px; padding:5px; opacity:0.3;"></div>`;
            html += `</div>`;
        } else if (state.calendarViewMode === 'week') {
            const cD = new Date(state.currentCalendarDate), dOw = cD.getDay(), sw = new Date(cD); sw.setDate(cD.getDate() - dOw); const ew = new Date(sw); ew.setDate(sw.getDate() + 6);
            html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px; background:white; padding:10px 15px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);"><button class="btn-secondary" onclick="window.currentCalendarDate.setDate(window.currentCalendarDate.getDate() - 7); window.updateDetailContent();" style="padding:4px 12px;">◀ 上週</button><h3 style="margin:0; color:var(--primary); font-size:18px;">${sw.getMonth()+1}/${sw.getDate()} - ${ew.getMonth()+1}/${ew.getDate()}</h3><button class="btn-secondary" onclick="window.currentCalendarDate.setDate(window.currentCalendarDate.getDate() + 7); window.updateDetailContent();" style="padding:4px 12px;">下週 ▶</button></div><div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:1px; background:#cbd5e1; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">`;
            for (let i = 0; i < 7; i++) { const cd = new Date(sw); cd.setDate(sw.getDate() + i); html += `<div style="background:#f8fafc; padding:8px; text-align:center; font-size:13px; font-weight:bold; color:${(i===0||i===6) ? 'var(--danger)' : 'var(--text-muted)'};">${['日','一','二','三','四','五','六'][i]}<br><span style="font-size:18px; color:var(--text-main);">${String(cd.getDate()).padStart(2,'0')}</span></div>`; }
            for (let i = 0; i < 7; i++) {
                const cd = new Date(sw); cd.setDate(sw.getDate() + i); const dStr = `${cd.getFullYear()}-${String(cd.getMonth()+1).padStart(2,'0')}-${String(cd.getDate()).padStart(2,'0')}`;
                const dbks = rb.filter(b => b.date === dStr).sort((a,b) => a.startTime.localeCompare(b.startTime)); const isSel = dStr === state.selectedCalendarDate; let bg = isSel ? '#eff6ff' : 'white'; let border = isSel ? '2px solid var(--primary)' : '2px solid transparent';
                let badges = ''; dbks.forEach(b => { badges += `<div style="font-size:11px; background:var(--primary); color:white; border-radius:4px; padding:4px; margin-top:4px; overflow:hidden; white-space:normal; line-height:1.2;"><b>${b.startTime}</b><br>${b.title}</div>`; }); if(dbks.length === 0) badges = `<div style="text-align:center; color:#cbd5e1; margin-top:20px; font-size:12px;">無排程</div>`;
                html += `<div style="background:${bg}; border:${border}; box-sizing:border-box; min-height:150px; padding:5px; cursor:pointer; transition:background 0.2s;" onclick="window.selectCalendarDate('${dStr}')">${badges}</div>`;
            }
            html += `</div>`;
        }

        if (state.calendarViewMode === 'day' || state.calendarViewMode === 'month') {
            const sbks = rb.filter(b => b.date === state.selectedCalendarDate).sort((a,b) => a.startTime.localeCompare(b.startTime));
            let dD = state.selectedCalendarDate === todayStr ? state.selectedCalendarDate.replace(/-/g,'/') + ' (今天)' : state.selectedCalendarDate.replace(/-/g,'/');
            if (state.calendarViewMode === 'day') { html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px; background:white; padding:10px 15px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);"><button class="btn-secondary" onclick="let d=new Date(window.selectedCalendarDate); d.setDate(d.getDate()-1); window.selectedCalendarDate = d.toISOString().split('T')[0]; window.updateDetailContent();" style="padding:4px 12px;">◀ 前一天</button><h3 style="margin:0; color:var(--primary); font-size:18px;">📌 ${dD} 預約清單</h3><button class="btn-secondary" onclick="let d=new Date(window.selectedCalendarDate); d.setDate(d.getDate()+1); window.selectedCalendarDate = d.toISOString().split('T')[0]; window.updateDetailContent();" style="padding:4px 12px;">後一天 ▶</button></div>`; } 
            else { html += `<h3 style="margin-top:30px; border-bottom:2px solid #e2e8f0; padding-bottom:10px; color:var(--text-main);">📌 ${dD} 預約清單</h3>`; }
            html += `<div class="grid-nav" id="calendar-agenda-grid"></div>`; grid.innerHTML = html; const ag = document.getElementById('calendar-agenda-grid');
            if(sbks.length === 0) { ag.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 30px; color: #64748b; background:white; border-radius:12px; border:1px dashed #cbd5e1;">這天尚無會議預約，點擊右下角「＋」可新增。</div>`; } 
            else { sbks.forEach(b => { const c = document.createElement('div'); c.className = 'nav-card'; c.style.textAlign = 'left'; c.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; padding-bottom:10px; margin-bottom:10px;"><div><h3 style="margin:0; color:var(--primary); font-size:18px;">${b.title}</h3></div><button class="btn-edit" onclick="window.openBookingModal('${b.id}')">✏️ 編輯</button></div><div style="font-size:14px; margin-bottom:6px;"><b>時間：</b> <span style="font-family:monospace; font-size:15px; font-weight:bold; color:var(--danger);">${b.startTime} - ${b.endTime}</span></div><div style="font-size:14px;"><b>預約人：</b> ${b.booker}</div>`; ag.appendChild(c); }); }
        } else { grid.innerHTML = html; }
        return;
    }

    grid.className = 'grid-nav'; grid.style.display = '';

    if (state.currentTab === 'staff') {
        if(om.length === 0) return grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px; color: #64748b;">目前尚無人員資料</div>';
        const sm = document.getElementById('staff-sort-select').value;
        om.sort((a, b) => { if (sm === 'name') return (a.name||'').localeCompare(b.name||'', 'zh-TW'); else if (sm === 'title') { const r = state.globalTitleRankSettings.offices[state.currentOfficeId] || state.globalTitleRankSettings.global || []; const ra = r.indexOf(a.title), rb = r.indexOf(b.title), va = ra !== -1 ? ra : 999, vb = rb !== -1 ? rb : 999; if (va !== vb) return va - vb; return (a.name||'').localeCompare(b.name||'', 'zh-TW'); } else if (sm === 'join_date') { const da = a.join_date || '9999-99-99', db = b.join_date || '9999-99-99'; if (da !== db) return da.localeCompare(db); return (a.name||'').localeCompare(b.name||'', 'zh-TW'); } return 0; });
        om.forEach(m => { const c = document.createElement('div'); c.className = 'nav-card'; const pc = fixedAssets.find(a => a.category === '電腦' && a.owner_id === m.id); c.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 10px;"><div style="text-align: left;"><h3 style="margin:0 0 5px 0;">${m.name}</h3></div><button class="btn-edit" onclick="window.openMemberModal('${m.id}')">✏️ 編輯</button></div><div class="detail-info" style="border-top: none; padding-top: 0; margin-top: 5px;"><div><b>職稱：</b>${m.title || 'N/A'}</div><div><b>分機：</b>${m.ext}</div><div><b>入廠日：</b>${m.join_date ? m.join_date.replace(/-/g, '/') : 'N/A'}</div><div><b>電腦編號：</b>${pc && pc.pc_id && pc.pc_id !== 'N/A' ? pc.pc_id : '無設備'}</div></div>`; grid.appendChild(c); });
    } 
    else if (state.currentTab === 'assets') {
        if(officeAssetsList.length === 0) return grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px; color: #64748b;">目前尚無資產資料</div>';
        
        let html = '';
        
        // 1. 固定資產區塊
        if (fixedAssets.length > 0) {
            html += `<div style="grid-column: 1/-1; margin-bottom: 10px;"><h3 style="margin:0; padding-bottom:5px; border-bottom: 2px solid var(--primary); font-size:16px;">📌 固定資產</h3></div>`;
            let displayFixed = fixedAssets.map(a => { let on = '💻 公用設備'; if (a.category === '電腦' && a.owner_id) { const owner = state.globalMembers.find(m => m.id === a.owner_id); if (owner) on = `👤 使用者: ${owner.name}`; } let t = a.item || '未命名設備'; if (a.category && a.category !== t && !t.includes(a.category)) t = `${a.category}：${t}`; return { ...a, _on: on, _t: t }; });
            displayFixed.forEach(a => {
                let si = a.status === '正常' ? '🟢' : a.status === '待修' ? '🔴' : a.status === '報廢' ? '⚫' : a.status === '碳粉不足' ? '🟡' : '⚪'; 
                html += `<div class="nav-card"><div style="display:flex; justify-content:space-between; align-items:flex-start;"><h3 style="margin:0; text-align:left;">${a._t}</h3><button class="btn-edit" onclick="window.openAssetModal('${a.id}')">✏️ 編輯</button></div>${a.category === '電腦' && a.owner_id ? `<div style="font-size:12px; color:#64748b; margin-bottom:5px;">${a._on}</div>` : ''}<div class="password-badge" style="font-size:14px; margin:10px 0;">SN: ${a.sn || 'N/A'}</div><div style="font-size:12px; font-weight:bold; color: var(--text-main);">${si} ${a.status || '未登記'}</div></div>`; 
            });
        }

        // 2. 消耗品區塊 (Dashboard 卡片)
        if (consumableAssets.length > 0) {
            html += `<div style="grid-column: 1/-1; margin-top: 20px; margin-bottom: 10px;"><h3 style="margin:0; padding-bottom:5px; border-bottom: 2px solid #8b5cf6; font-size:16px; color:#8b5cf6;">📦 消耗品</h3></div>`;
            consumableAssets.forEach(a => {
                html += `
                <div class="nav-card" style="border: 2px solid #ede9fe; background: white;">
                   <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                       <span style="background:#ede9fe; color:#8b5cf6; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">🏷️ ${a.tag || '未分類'}</span>
                       <button class="btn-edit" onclick="window.openAssetModal('${a.id}')">✏️ 編輯</button>
                   </div>
                   <h3 style="margin: 0 0 10px 0; color:var(--text-main); font-size: 16px;">${a.item}</h3>
                   <div style="font-size: 36px; font-weight: bold; color: var(--primary); margin: 15px 0;">
                       ${a.quantity || 0} <span style="font-size:14px; color:var(--text-muted); font-weight:normal;">${a.unit || '個'}</span>
                   </div>
                   <div style="font-size:12px; color:var(--text-muted); text-align:left; background:#f8fafc; padding:10px; border-radius:8px; border: 1px solid #e2e8f0;">
                       <div style="margin-bottom:6px;">📞 <b>領取找:</b> ${a.contactPerson || '無指定'}</div>
                       <div>📝 <b>備註:</b> ${a.remarks || '無'}</div>
                   </div>
                </div>`;
            });
        }
        
        grid.innerHTML = html;
    }
    else if (state.currentTab === 'facilities') {
        const cp = fixedAssets.filter(a => a.category === '電腦'); if(cp.length === 0) return grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px; color: #64748b;">目前尚無電腦或孔位配置</div>';
        cp.forEach(a => { const c = document.createElement('div'); c.className = 'nav-card'; c.style.textAlign = 'left'; let on = '💻 公用設備'; if (a.owner_id) { const owner = state.globalMembers.find(m => m.id === a.owner_id); if (owner) on = `👤 ${owner.name}`; } c.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start;"><h3 style="margin:0; margin-bottom: 4px; color: var(--primary);">${on}</h3><button class="btn-edit" onclick="window.openAssetModal('${a.id}')">✏️ 編輯</button></div><div style="font-weight:bold; font-size:14px; color:var(--text-main); margin-bottom:12px;">PC: ${a.pc_id && a.pc_id !== 'N/A' ? a.pc_id : '未編號'}</div><table class="facility-table"><tr><td class="facility-label">網路孔</td><td>${a.net_port || 'N/A'} ${a.domain ? `<span style="color:#94a3b8; font-size:11px;">(${a.domain})</span>` : ''}</td></tr><tr><td class="facility-label">電話孔</td><td>${a.phone_port || 'N/A'}</td></tr></table>`; grid.appendChild(c); });
    }
}

export function showExtensionsView(push = true) {
    closeSidebar(); state.currentLevel = 3; if (push) history.pushState({ level: 3 }, ""); const c = document.getElementById('ext-container'); c.innerHTML = '';
    const m = {}; state.globalMembers.forEach(x => { const o = state.globalOffices.find(y => y.id === x.office_id); const n = o ? o.name : (x.office_id || '未分配辦公室'); if (!m[n]) m[n] = []; m[n].push(x); });
    for (let n in m) { const g = document.createElement('div'); g.style.marginBottom = '30px'; let h = `<h2 style="border-bottom: 2px solid var(--primary); padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">${n}</h2><div class="grid-nav" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 15px;">`; m[n].forEach(x => { const he = (x.ext && x.ext !== 'N/A'); h += `<div class="nav-card no-hover" style="padding: 15px 20px; text-align: left; display: flex; justify-content: space-between; align-items: center;"><div><div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${x.name}</div><div style="font-size: 12px; color: var(--text-muted);">${x.title && x.title !== 'N/A' ? x.title : ''}</div></div><div style="font-size: 24px; font-weight: bold; color: ${he ? 'var(--primary)' : 'var(--text-muted)'}; font-family: monospace;">${he ? x.ext : '無分機'}</div></div>`; }); h += `</div>`; g.innerHTML = h; c.appendChild(g); }
    switchView('view-extensions');
}

// ✨ 在列資產總表：支援消耗品渲染
export function showAssetsTotalView(push = true) {
    closeSidebar(); state.currentLevel = 4; if (push) history.pushState({ level: 4 }, ""); 
    const container = document.getElementById('assets-total-container');
    container.innerHTML = '';

    const fixedAssets = state.globalAssets.filter(a => a.assetType !== 'consumable');
    const consumableAssets = state.globalAssets.filter(a => a.assetType === 'consumable');

    let html = '';

    // 1. 渲染固定資產 (按辦公室分組)
    html += `<h2 style="border-bottom: 2px solid var(--primary); padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">📌 固定資產總表 (${fixedAssets.length}件)</h2>`;
    const officeMap = {};
    fixedAssets.forEach(a => { const off = state.globalOffices.find(o => o.id === a.office_id); const offName = off ? off.name : '未分配區域'; if (!officeMap[offName]) officeMap[offName] = []; officeMap[offName].push(a); });

    for (let offName in officeMap) {
        html += `<div style="margin-bottom: 25px;"><h3 style="font-size: 15px; color: var(--text-muted); margin-bottom: 10px;">🏢 ${offName}</h3><div class="grid-nav" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));">`;
        officeMap[offName].forEach(a => {
            let oName = '💻 公用設備'; if (a.category === '電腦' && a.owner_id) { const owner = state.globalMembers.find(m => m.id === a.owner_id); if (owner) oName = `👤 ${owner.name}`; }
            let t = a.item || '未命名設備'; if (a.category && a.category !== t && !t.includes(a.category)) t = `${a.category}：${t}`;
            let si = a.status === '正常' ? '🟢' : a.status === '待修' ? '🔴' : a.status === '報廢' ? '⚫' : a.status === '碳粉不足' ? '🟡' : '⚪';
            html += `<div class="nav-card no-hover" style="padding: 15px; text-align: left; cursor: default;">
                <h4 style="margin:0 0 5px 0; color:var(--primary); font-size:15px;">${t}</h4>
                ${a.category === '電腦' && a.owner_id ? `<div style="font-size:12px; color:#64748b; margin-bottom:5px;">${oName}</div>` : ''}
                <div style="font-size:12px; margin-bottom: 4px; font-family:monospace; color:var(--danger); font-weight:bold;">SN: ${a.sn || 'N/A'}</div>
                <div style="font-size:12px; color: var(--text-main); font-weight:bold;">${si} ${a.status || '未知'}</div>
            </div>`;
        });
        html += `</div></div>`;
    }

    // 2. 渲染消耗品 (按標籤分組 Dashboard)
    html += `<h2 style="border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; margin-top: 40px; margin-bottom: 15px; font-size: 18px; color: #8b5cf6;">📦 消耗品總庫存 (${consumableAssets.length}項)</h2>`;
    if (consumableAssets.length === 0) {
        html += `<div style="text-align:center; padding:30px; background:white; border-radius:12px; color:var(--text-muted); border:1px dashed #cbd5e1;">目前尚無登錄任何消耗品。未來可在此統一盤點庫存數量與聯絡資訊。</div>`;
    } else {
        html += `<div class="grid-nav">`;
        consumableAssets.forEach(a => {
            const off = state.globalOffices.find(o => o.id === a.office_id); const offName = off ? off.name : '未分配區域';
            html += `
            <div class="nav-card no-hover" style="border: 2px solid #ede9fe; background: white;">
               <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                   <span style="background:#ede9fe; color:#8b5cf6; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">🏷️ ${a.tag || '未分類'}</span>
                   <span style="font-size:12px; color:var(--text-muted); font-weight:bold;">🏢 ${offName}</span>
               </div>
               <h3 style="margin: 0 0 10px 0; color:var(--text-main); font-size: 16px;">${a.item}</h3>
               <div style="font-size: 36px; font-weight: bold; color: var(--primary); margin: 15px 0;">
                   ${a.quantity || 0} <span style="font-size:14px; color:var(--text-muted); font-weight:normal;">${a.unit || '個'}</span>
               </div>
               <div style="font-size:12px; color:var(--text-muted); text-align:left; background:#f8fafc; padding:10px; border-radius:8px; border: 1px solid #e2e8f0;">
                   <div style="margin-bottom:6px;">📞 <b>領取找:</b> ${a.contactPerson || '無指定'}</div>
                   <div>📝 <b>備註:</b> ${a.remarks || '無'}</div>
               </div>
            </div>`;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
    switchView('view-assets-total');
}

export function renderPinnedItems() {
    const wrap = document.getElementById('pinned-items-wrapper'); if(!wrap) return; wrap.innerHTML = ''; 
    state.myPinnedItems.forEach((item, idx) => {
        const c = document.createElement('div'); c.className = 'nav-card pinned-full-card'; c.draggable = true; c.dataset.index = idx;
        let h = '', oc = `window.handlePinClick('${item.type}', '${item.id}', event)`, b = `<div class="pinned-type-badge" style="position:absolute; top:12px; left:15px; font-size:12px; color:var(--text-muted); background:var(--accent); padding:2px 8px; border-radius:12px;">區域</div>`;
        if (item.type === 'floor') h = `${b}<h2 style="margin-top:15px;">${item.name}</h2><div class="card-content-detail" style="font-size:12px; color:var(--primary); margin-top:10px;">點擊查看樓層</div>`;
        else if (item.type === 'office') { const o = state.globalOffices.find(x => x.id === item.id); if (o) { const rt = o.roomType || '辦公室'; h = `<div class="pinned-type-badge" style="position:absolute; top:12px; left:15px; font-size:12px; color:var(--text-muted); background:var(--accent); padding:2px 8px; border-radius:12px;">${rt}</div><h2 style="margin-top:15px;">${o.name} ${rt === '會議室' ? `<span style="font-size:12px; color:var(--success); font-weight:bold; background:#d1fae5; padding:2px 6px; border-radius:4px; margin-left:10px;">🟢 可預約</span>` : ''}</h2><div class="password-container" style="max-height:none; opacity:1;"><span class="password-badge">${o.pwd || 'N/A'}</span></div><div class="card-content-detail" style="font-size:12px; color:var(--primary); margin-top:10px;">點擊查看詳情</div>`; } else h = `<h2 style="color:var(--danger)">該房間已移除</h2>`; }
        else if (item.type === 'member') { const m = state.globalMembers.find(x => x.id === item.id); if (m) { const pc = state.globalAssets.find(a => a.category === '電腦' && a.owner_id === m.id); h = `<div class="pinned-type-badge" style="position:absolute; top:12px; left:15px; font-size:12px; color:var(--text-muted); background:var(--accent); padding:2px 8px; border-radius:12px;">人員</div><div style="text-align: left; margin-top:5px;"><h3 style="margin:0 0 5px 0;">${m.name}</h3></div><div class="detail-info card-content-detail" style="border-top: none; padding-top: 0; margin-top: 5px; opacity: 1; max-height: none;"><div><b>職稱：</b>${m.title || 'N/A'}</div><div><b>分機：</b>${m.ext}</div><div><b>入廠日：</b>${m.join_date ? m.join_date.replace(/-/g, '/') : 'N/A'}</div><div><b>電腦編號：</b>${pc && pc.pc_id && pc.pc_id !== 'N/A' ? pc.pc_id : '無設備'}</div></div>`; } else h = `<h2 style="color:var(--danger)">該人員已移除</h2>`; }
        else if (item.type === 'asset') { const a = state.globalAssets.find(x => x.id === item.id); if (a) { let oName = '💻 公用設備'; if (a.category === '電腦' && a.owner_id) { const owner = state.globalMembers.find(m => m.id === a.owner_id); if (owner) oName = `👤 使用者: ${owner.name}`; } let t = a.item || '未命名設備'; if (a.category && a.category !== t && !t.includes(a.category)) t = `${a.category}：${t}`; h = `<div class="pinned-type-badge" style="position:absolute; top:12px; left:15px; font-size:12px; color:var(--text-muted); background:var(--accent); padding:2px 8px; border-radius:12px;">${a.category || '資產'}</div><div style="text-align:left; margin-top:5px;"><h3 style="margin:0;">${t}</h3></div><div class="card-content-detail">${a.category === '電腦' && a.owner_id ? `<div style="font-size:12px; color:#64748b; margin-bottom:5px;">${oName}</div>` : ''}<div class="password-badge" style="font-size:14px; margin:10px 0;">SN: ${a.sn || 'N/A'}</div><div style="font-size:12px; font-weight:bold; color: var(--text-main);">${a.status === '正常' ? '🟢' : a.status === '待修' ? '🔴' : a.status === '報廢' ? '⚫' : a.status === '碳粉不足' ? '🟡' : '⚪'} ${a.status || '未登記'}</div></div>`; } else h = `<h2 style="color:var(--danger)">該資產已移除</h2>`; }
        c.innerHTML = `<button class="unpin-btn" onclick="event.stopPropagation(); window.removePinItem(${idx})" title="取消置頂">×</button><div onclick="${oc}" style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">${h}</div>`;
        c.addEventListener('dragstart', window.handlePinDragStart); c.addEventListener('dragover', window.handlePinDragOver); c.addEventListener('dragenter', window.handlePinDragEnter); c.addEventListener('dragleave', window.handlePinDragLeave); c.addEventListener('drop', window.handlePinDrop); c.addEventListener('dragend', window.handlePinDragEnd); wrap.appendChild(c);
    });
    if (state.myPinnedItems.length < 8) { const c = document.createElement('div'); c.className = 'nav-card pinned-full-card'; c.style.cssText = 'display:flex; justify-content:center; align-items:center; border:2px dashed #cbd5e1; box-shadow:none; background:transparent; cursor:pointer;'; c.innerHTML = `<div style="font-size: 36px; color: #94a3b8; width: 100%; height: 100%;">＋</div>`; c.onclick = () => window.openPinModal(); wrap.appendChild(c); }
}

export function handlePinClick(type, id, event) {
    if (document.getElementById('pinned-section').classList.contains('collapsed')) { if(event) event.stopPropagation(); expandPinnedSection(event); return; }
    if (type === 'floor') { showOffices(id); } else if (type === 'office') { const off = state.globalOffices.find(o => o.id === id); if (off) showDetail(off.id, off.name); } 
    else if (type === 'member') { const m = state.globalMembers.find(x => x.id === id); if(m) { const off = state.globalOffices.find(o => o.id === m.office_id); if(off) { showDetail(off.id, off.name); switchTab('staff'); } } else customAlert('該人員已被移除', true); } 
    else if (type === 'asset') { const a = state.globalAssets.find(x => x.id === id); if(a) { const off = state.globalOffices.find(o => o.id === a.office_id); if(off) { showDetail(off.id, off.name); switchTab('assets'); } } else customAlert('該資產已被移除', true); }
}

let pinDragSrcEl = null;
export function handlePinDragStart(e) { pinDragSrcEl = this; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/html', this.innerHTML); this.classList.add('dragging'); }
export function handlePinDragOver(e) { if (e.preventDefault) e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }
export function handlePinDragEnter(e) { this.classList.add('drag-over'); }
export function handlePinDragLeave(e) { this.classList.remove('drag-over'); }
export async function handlePinDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (pinDragSrcEl !== this) {
        const fromIndex = parseInt(pinDragSrcEl.dataset.index); const toIndex = parseInt(this.dataset.index);
        const item = state.myPinnedItems.splice(fromIndex, 1)[0]; state.myPinnedItems.splice(toIndex, 0, item);
        renderPinnedItems();
        try { await setDoc(doc(db, 'users', auth.currentUser?.email || 'anonymous@preview.com'), { pinnedItems: state.myPinnedItems }, { merge: true }); } catch(err) { console.error(err); }
    }
    return false;
}
export function handlePinDragEnd(e) { this.classList.remove('dragging'); document.querySelectorAll('.pinned-full-card').forEach(col => col.classList.remove('drag-over')); }

export function toggleAvatarMenu(e) { e.stopPropagation(); const d = document.getElementById('avatar-dropdown'); d.style.display = d.style.display === 'flex' ? 'none' : 'flex'; }

export function renderFriendlyLinks() {
    const isAuth = auth.currentUser && (state.globalWhitelist.includes(auth.currentUser.email) || state.globalAdmins.includes(auth.currentUser.email) || auth.currentUser.email === state.SUPER_ADMIN || auth.currentUser.isAnonymous);
    const sl = document.getElementById('sidebar-friendly-links');
    if (sl) {
        sl.innerHTML = state.globalFriendlyLinks.map((l, i) => `<div class="menu-item" style="font-size: 14px; font-weight: normal; padding: 10px 25px; display:flex; align-items:center;"><a href="#" onclick="window.trackLinkClick(${i}, '${l.url}')" style="color: var(--text-main); text-decoration: none; flex:1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🌍 ${l.name}</a>${isAuth ? `<button onclick="window.promptDeleteFriendlyLink(${i})" style="background:none; border:none; cursor:pointer; color:var(--danger); opacity:0.5; font-size:16px; padding:0 5px;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">×</button>` : ''}</div>`).join('');
        if (isAuth && state.globalFriendlyLinks.length < 20) sl.innerHTML += `<div class="menu-item" onclick="window.openFriendlyLinkModal()" style="font-size: 13px; color: var(--primary); justify-content:center; border-top: 1px dashed #e2e8f0; margin-top: 5px;">➕ 新增友站連結</div>`;
    }
    const oc = document.getElementById('login-orbit-container');
    if (oc && state.currentLevel === -1) {
        oc.innerHTML = ''; const maxC = Math.max(...state.globalFriendlyLinks.map(l => l.clicks || 0), 1);
        if (state.globalFriendlyLinks.length === 0) return;
        state.globalFriendlyLinks.forEach((l, i) => {
            const angle = (i / state.globalFriendlyLinks.length) * 2 * Math.PI, rx = window.innerWidth > 768 ? window.innerWidth * 0.28 : 0, ry = window.innerWidth > 768 ? window.innerHeight * 0.35 : 0; 
            let scale = Math.min(0.8 + ((l.clicks || 0) / maxC) * 0.7, 1.5);
            const a = document.createElement('a'); a.href = "#"; a.className = "orbit-link"; a.innerHTML = `<div class="orbit-link-name">🌍 ${l.name}</div><div class="orbit-link-url">${l.url}</div>`;
            if (window.innerWidth > 768) { a.style.left = `calc(50% + ${Math.cos(angle) * rx}px)`; a.style.top = `calc(50% + ${Math.sin(angle) * ry}px)`; a.style.transform = `translate(-50%, -50%) scale(${scale})`; }
            a.onclick = (e) => { e.preventDefault(); window.trackLinkClick(i, l.url); }; oc.appendChild(a);
        });
    }
}

export async function trackLinkClick(i, url) { 
    state.globalFriendlyLinks[i].clicks = (state.globalFriendlyLinks[i].clicks || 0) + 1; 
    setDoc(doc(db, 'settings', 'friendlyLinks'), { list: state.globalFriendlyLinks }).catch(e => console.log(e)); 
    window.open(url, '_blank'); 
}

// 過渡期掛載
window.customAlert = customAlert;
window.togglePinnedSectionCollapse = togglePinnedSectionCollapse;
window.expandPinnedSection = expandPinnedSection;
window.initView = initView;
window.updateMainTitle = updateMainTitle;
window.syncHeaderLayout = syncHeaderLayout;
window.renderSidebarTree = renderSidebarTree;
window.toggleTreeFloor = toggleTreeFloor;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleFabMenu = toggleFabMenu;
window.closeFabMenu = closeFabMenu;
window.updateFabMenu = updateFabMenu;
window.toggleDevOptions = toggleDevOptions;
window.updateNavigationUI = updateNavigationUI;
window.switchView = switchView;
window.goHome = goHome;
window.goUpLevel = goUpLevel;
window.showOffices = showOffices;
window.showDetail = showDetail;
window.switchTab = switchTab;
window.changeCalendarMonth = changeCalendarMonth;
window.selectCalendarDate = selectCalendarDate;
window.setCalendarViewMode = setCalendarViewMode;
window.goToToday = goToToday;
window.updateDetailContent = updateDetailContent;
window.showExtensionsView = showExtensionsView;
window.showAssetsTotalView = showAssetsTotalView;
window.renderPinnedItems = renderPinnedItems;
window.handlePinClick = handlePinClick;
window.handlePinDragStart = handlePinDragStart;
window.handlePinDragOver = handlePinDragOver;
window.handlePinDragEnter = handlePinDragEnter;
window.handlePinDragLeave = handlePinDragLeave;
window.handlePinDrop = handlePinDrop;
window.handlePinDragEnd = handlePinDragEnd;
window.toggleAvatarMenu = toggleAvatarMenu;
window.renderFriendlyLinks = renderFriendlyLinks;
window.trackLinkClick = trackLinkClick;