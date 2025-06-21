import { Dimensions, PixelRatio } from 'react-native';

// 獲取螢幕尺寸
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 設計稿基準尺寸 (以 iPhone X 為基準)
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

/**
 * 基於螢幕寬度的比例計算
 */
export const dynamicWidth = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * 基於螢幕高度的比例計算
 */
export const dynamicHeight = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * 基於設計稿的寬度比例計算
 */
export const scaleWidth = (size: number): number => {
  return (SCREEN_WIDTH / DESIGN_WIDTH) * size;
};

/**
 * 基於設計稿的高度比例計算
 */
export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / DESIGN_HEIGHT) * size;
};

/**
 * 響應式字體大小
 */
export const responsiveFontSize = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / DESIGN_WIDTH, SCREEN_HEIGHT / DESIGN_HEIGHT);
  const newSize = size * scale;
  
  // 確保字體大小在合理範圍內
  if (newSize < 10) return 10;
  if (newSize > 30) return 30;
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * 響應式間距
 */
export const responsiveSpacing = (size: number): number => {
  return scaleWidth(size);
};

/**
 * 響應式邊框圓角
 */
export const responsiveBorderRadius = (size: number): number => {
  return scaleWidth(size);
};

/**
 * 響應式按鈕高度
 */
export const responsiveButtonHeight = (baseHeight: number = 44): number => {
  return Math.max(scaleHeight(baseHeight), 36); // 最小高度 36
};

/**
 * 響應式按鈕寬度
 */
export const responsiveButtonWidth = (baseWidth: number): number => {
  return scaleWidth(baseWidth);
};

/**
 * 響應式 Modal 寬度
 */
export const responsiveModalWidth = (): number => {
  if (SCREEN_WIDTH < 400) {
    return dynamicWidth(95); // 小螢幕佔 95%
  } else if (SCREEN_WIDTH < 600) {
    return dynamicWidth(90); // 中等螢幕佔 90%
  } else {
    return Math.min(dynamicWidth(80), 500); // 大螢幕最大 500px
  }
};

/**
 * 響應式 Modal 內邊距
 */
export const responsiveModalPadding = (): number => {
  return responsiveSpacing(20);
};

/**
 * 響應式行高
 */
export const responsiveLineHeight = (fontSize: number): number => {
  return fontSize * 1.4; // 行高為字體大小的 1.4 倍
};

/**
 * 檢查是否為小螢幕
 */
export const isSmallScreen = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * 檢查是否為大螢幕
 */
export const isLargeScreen = (): boolean => {
  return SCREEN_WIDTH > 414;
};

/**
 * 檢查是否為平板
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH > 768;
};

// 導出常用的響應式尺寸
export const ResponsiveSizes = {
  // 字體大小
  font: {
    tiny: responsiveFontSize(10),
    small: responsiveFontSize(12),
    medium: responsiveFontSize(14),
    large: responsiveFontSize(16),
    xlarge: responsiveFontSize(18),
    xxlarge: responsiveFontSize(20),
    title: responsiveFontSize(24),
  },
  
  // 間距
  spacing: {
    tiny: responsiveSpacing(2),
    small: responsiveSpacing(4),
    medium: responsiveSpacing(8),
    large: responsiveSpacing(12),
    xlarge: responsiveSpacing(16),
    xxlarge: responsiveSpacing(20),
    huge: responsiveSpacing(24),
  },
  
  // 按鈕
  button: {
    height: {
      small: responsiveButtonHeight(32),
      medium: responsiveButtonHeight(40),
      large: responsiveButtonHeight(48),
    },
    minWidth: {
      small: responsiveButtonWidth(60),
      medium: responsiveButtonWidth(80),
      large: responsiveButtonWidth(100),
    },
  },
  
  // 邊框圓角
  borderRadius: {
    small: responsiveBorderRadius(4),
    medium: responsiveBorderRadius(8),
    large: responsiveBorderRadius(12),
    xlarge: responsiveBorderRadius(16),
  },
}; 