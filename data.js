// 這裡專門存放辦公室的人員資訊
const memberData = {
    // === A 辦公室人員 ===
    "A-01": { name: "王重文", ext: "6100", pc_id: "9059145", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-02": { name: "林筱融", ext: "6100", pc_id: "9069235", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-03": { name: "葉耀仁", ext: "6100", pc_id: "9069234", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-04": { name: "陳進吉", ext: "6100", pc_id: "9069237", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-05": { name: "鄭至欽", ext: "6100", pc_id: "9069236", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-06": { name: "葉旭昇", ext: "6208", pc_id: "9059146", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-07": { name: "邵家宏", ext: "6208", pc_id: "9069625", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-08": { name: "譚曉陽", ext: "6208", pc_id: "9059163", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-09": { name: "莊榮瑞", ext: "6208", pc_id: "9069627", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-10": { name: "姚首亨", ext: "6208", pc_id: "9069624", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-11": { name: "房昕", ext: "6208", pc_id: "9069626", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },
    "A-12": { name: "李奕恆", ext: "6208", pc_id: "9069628", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船接艦人員" },

    // === C 辦公室人員 (ABS) ===
    "C-01": { name: "曹璧蘭", ext: "6823", pc_id: "9059874", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-02": { name: "陳秀玟", ext: "6827", pc_id: "9059875", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-03": { name: "許芙美", ext: "6825", pc_id: "9059869", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-04": { name: "陳冠諭", ext: "6820", pc_id: "9059872", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-05": { name: "徐中康", ext: "6822", pc_id: "9059877", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-06": { name: "王寵惕", ext: "6826", pc_id: "9059873", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-07": { name: "蕭聖勇", ext: "6821", pc_id: "9069161", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-08": { name: "林彥豪", ext: "6830", pc_id: "9059870", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-09": { name: "張乃文", ext: "6829", pc_id: "9059868", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-10": { name: "N/A", ext: "N/A", pc_id: "N/A", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-11": { name: "許首雄", ext: "6824", pc_id: "9059871", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-12": { name: "劉家達", ext: "6828", pc_id: "9069162", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" },
    "C-13": { name: "N/A", ext: "N/A", pc_id: "N/A", net_port: "N/A", phone_port: "N/A", dept: "高緯度遠洋巡護船監造人員 (ABS)" }
};    // 未來你可以繼續往下增加，例如：
    // "B-01": { name: "趙六", dept: "財務部", ext: "201" },

// 讓資料可以被其他檔案讀取（在簡單的 HTML 環境下，直接宣告 const 即可）