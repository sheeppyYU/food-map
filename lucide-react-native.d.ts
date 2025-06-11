declare module 'lucide-react-native' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';

  export interface IconProps extends SvgProps {
    color?: string;
    size?: number | string;
    style?: any;
  }

  // 只宣告我們目前用到的 ChevronRight，若未來需要可再新增
  export const ChevronRight: React.FC<IconProps>;

  // 導出其他可能需要的圖示型別，採用 any 讓編譯通過
  export const Plus: React.FC<IconProps>;
  export const X: React.FC<IconProps>;
  export const Check: React.FC<IconProps>;
  export const FolderLock: React.FC<IconProps>;
  export const Lock: React.FC<IconProps>;
} 