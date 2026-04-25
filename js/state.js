// js/state.js

// 將所有全域變數打包成一個 state 物件導出
export const state = {
    // ======== 系統常數 ========
    SUPER_ADMIN: 'steve1615@gmail.com',
    ROOM_TRAITS: {
        '辦公室': { tabs: ['staff', 'assets', 'facilities'], defaultTab: 'staff' },
        '庫房':   { tabs: ['assets', 'facilities', 'checkout'], defaultTab: 'assets' },
        '會議室': { tabs: ['booking', 'assets', 'facilities'], defaultTab: 'booking' },
        '機房':   { tabs: ['assets', 'facilities'], defaultTab: 'assets' },
        'DEFAULT':{ tabs: ['staff', 'assets', 'facilities'], defaultTab: 'staff' } 
    },
    TAB_LABELS: { 
        'staff': '人員', 'assets': '資產', 'facilities': '孔位', 
        'checkout': '🔒 登記領取', 'booking': '📅 預約排程' 
    },

    // ======== 來自 Firebase 的即時陣列資料 ========
    globalRegions: [], 
    globalOffices: [], 
    globalMembers: [], 
    globalAssets: [], 
    globalBookings: [], 
    globalDeletedItems: [],
    
    globalCategories: ['電腦', '影印機', '冰箱', '洗衣機', '冷氣機'], 
    globalRoomTypes: ['辦公室', '庫房', '會議室', '機房'], 
    globalTitleRankSettings: { global: [], offices: {} }, 
    
    globalWhitelist: [], 
    globalUsers: [], 
    globalAdmins: [], 
    globalFriendlyLinks: [], 
    globalAccessRequests: [], 

    // ======== 應用程式狀態 (UI State) ========
    currentAssetCategory: '電腦',
    currentRoomType: '辦公室',
    devOptionsEnabled: false, 
    tempTitleRanks: [], 
    currentTitleRankScope: 'global',
    
    currentLevel: -1, 
    currentFloor: '', 
    currentOfficeId: '', 
    currentOfficeName: '', 
    currentTab: 'staff', 
    isInitialized: false, 
    
    currentEditMemberId: null, 
    currentEditAssetId: null, 
    currentEditOfficeId: null, 
    currentEditBookingId: null, 
    isEditMode: false, 
    isOfficeEditMode: false,

    pendingDeleteAction: null, 
    strictCountdownTimer: null, 
    
    myPinnedItems: [], 
    isPinSectionVisible: false,
    
    // ======== 月曆視角狀態 ========
    calendarViewMode: 'month', 
    currentCalendarDate: new Date(), 
    selectedCalendarDate: new Date().toISOString().split('T')[0]
};