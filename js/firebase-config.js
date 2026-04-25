// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Firebase 專案金鑰設定
const firebaseConfig = {
    apiKey: "AIzaSyDt7Z-QAG4C73K7f0RyItXMNQJc2NDxkzE",
    authDomain: "pmoemap.firebaseapp.com",
    projectId: "pmoemap",
    storageBucket: "pmoemap.firebasestorage.app",
    messagingSenderId: "151977340101",
    appId: "1:151977340101:web:0cbfb47165d081152294ac"
};

// 2. 初始化核心服務
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 3. 初始化 Firestore (強制開啟長輪詢與離線快取)
const db = initializeFirestore(app, { 
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({tabManager: persistentSingleTabManager()})
});

// 4. 將服務導出 (Export)，讓其他檔案可以使用
export { app, auth, provider, db };