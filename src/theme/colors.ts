export type ThemePalette = {
  primary: string;
  accent: string;
  delete: string;
  download: string;
  background: string;
  marker: {
    want: string;
    visited: string;
    bad: string;
    none: string;
  };
};

// iOS 系統藍風格（方案 1）
export const SchemeA: ThemePalette = {
  primary: '#007AFF',    // 系統藍
  accent: '#007AFF',     // 同主色，不使用橘色
  delete: '#FF3B30',     // 系統紅
  download: '#34C759',   // 系統綠
  background: '#FFFFFF',
  marker: {
    want: '#FF9500',      // 保留系統橙給地圖「想去」狀態 (若需改動可再調)
    visited: '#007AFF',
    bad: '#8E8E93',
    none: '#34C759',
  },
};

// 功能導向抹茶綠 × 番茄紅（方案 2）
export const SchemeB: ThemePalette = {
  primary: '#4CAF50',
  accent: '#4CAF50',
  delete: '#FF7043',
  download: '#00BFA5',
  background: '#FFFFFF',
  marker: {
    want: '#FF7043',
    visited: '#388E3C',
    bad: '#424242',
    none: '#4CAF50',
  },
};

// 預設使用 iOS 藍系
export const theme = SchemeA; 