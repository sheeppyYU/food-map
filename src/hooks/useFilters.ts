import { create } from 'zustand';
import { deletePinsByCategory, deletePinsByType, updatePinsCategory, updatePinsType } from '../models/PinDB';
import { County } from '../models/Restaurant';

// 定義類型與分類的預設對應關係
export const TYPE_CATEGORIES: Record<string, string[]> = {
  '美食': ['小吃', '夜市', '日式', '韓式', '中式', '西式', '火鍋', '燒烤', '甜點', '飲品', '咖啡', '牛肉湯', '市場'],
  '景點': ['古蹟', '博物館', '文創', '生態', '景觀', '宗教', '運動', '百貨', '娛樂', '建築', '住宿'],
  // 可以根據需要添加更多類型的預設分類
};

type State = {
  county: County | null;
  mainType: string | null;
  categories: string[];
  customTypes: string[];
  typeCategories: Record<string, string[]>; // 新增：儲存自定義類型的分類
  setCounty: (c: County | null) => void;
  setMainType: (t: string | null) => void;
  toggleCategory: (c: string) => void;
  addCustomType: (t: string) => void;
  removeType: (t: string, moveToType?: string, shouldDeletePins?: boolean) => void; // 修改參數
  clearCategories: () => void;
  addCategoryToType: (type: string, category: string) => void; // 新增：為特定類型添加分類
  removeCategoryFromType: (type: string, category: string, moveToCategory?: string, shouldDeletePins?: boolean) => void; // 修改參數
  syncTypesFromPins: (pins: any[]) => void; // 新增：同步 Pin 資料中的類型
};

export const useFilters = create<State>((set, get) => ({
  county: null,
  mainType: null,
  categories: [],
  customTypes: ['美食', '景點'],
  typeCategories: TYPE_CATEGORIES, // 初始化預設分類
  setCounty: (c) => set({ county: c }),
  setMainType: (t) => {
    set({ mainType: t });
    // 切換類型時清空已選分類
    set({ categories: [] });
  },
  toggleCategory: (c) => {
    const { categories } = get();
    set({
      categories: categories.includes(c)
        ? categories.filter((x) => x !== c)
        : [...categories, c],
    });
  },
  addCustomType: (t) => set((state) => {
    const newTypes = [...new Set([...state.customTypes, t])];
    // 如果是新類型，初始化其分類列表
    if (!state.typeCategories[t]) {
      return { 
        customTypes: newTypes,
        typeCategories: { ...state.typeCategories, [t]: [] }
      };
    }
    return { customTypes: newTypes };
  }),
  removeType: (t, moveToType, shouldDeletePins = false) => set((state) => {
    if (state.customTypes.length <= 1) return state; // 至少保留一個
    
    // 處理該類型下的 Pin
    if (shouldDeletePins) {
      deletePinsByType(t);
    } else if (moveToType) {
      updatePinsType(t, moveToType);
    }
    
    const newTypeCategories = { ...state.typeCategories };
    delete newTypeCategories[t]; // 移除該類型的分類對應
    return { 
      customTypes: state.customTypes.filter(x => x !== t),
      mainType: state.mainType === t ? null : state.mainType,
      typeCategories: newTypeCategories
    };
  }),
  clearCategories: () => set({ categories: [] }),
  addCategoryToType: (type, category) => set((state) => {
    const currentCategories = state.typeCategories[type] || [];
    if (!currentCategories.includes(category)) {
      return {
        typeCategories: {
          ...state.typeCategories,
          [type]: [...currentCategories, category]
        }
      };
    }
    return state;
  }),
  removeCategoryFromType: (type, category, moveToCategory, shouldDeletePins = false) => set((state) => {
    // 處理該分類下的 Pin
    if (shouldDeletePins) {
      deletePinsByCategory(category, type);
    } else if (moveToCategory) {
      updatePinsCategory(category, moveToCategory, type);
    }
    
    const currentCategories = state.typeCategories[type] || [];
    return {
      typeCategories: {
        ...state.typeCategories,
        [type]: currentCategories.filter(c => c !== category)
      }
    };
  }),
  syncTypesFromPins: (pins: any[]) => set((state) => {
    // 從 Pin 資料中獲取所有類型
    const typesFromPins = Array.from(new Set(pins.map(pin => pin.type)));
    // 合併現有的 customTypes 和新發現的類型
    const newTypes = [...state.customTypes];
    typesFromPins.forEach(type => {
      if (!newTypes.includes(type)) {
        newTypes.push(type);
      }
    });
    
    // 為新類型初始化分類對應
    const newTypeCategories = { ...state.typeCategories };
    typesFromPins.forEach(type => {
      if (!newTypeCategories[type]) {
        newTypeCategories[type] = TYPE_CATEGORIES[type] || [];
      }
    });
    
    return {
      customTypes: newTypes,
      typeCategories: newTypeCategories
    };
  }),
})); 