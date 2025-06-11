import { create } from 'zustand';
import { County } from '../models/Restaurant';

type State = {
  county: County | null;
  mainType: string | null;
  categories: string[];
  customTypes: string[];
  setCounty: (c: County | null) => void;
  setMainType: (t: string | null) => void;
  toggleCategory: (c: string) => void;
  addCustomType: (t: string) => void;
  removeType: (t: string) => void;
  clearCategories: () => void;
};

export const useFilters = create<State>((set, get) => ({
  county: null,
  mainType: null,
  categories: [],
  customTypes: ['美食','景點'],
  setCounty: (c) => set({ county: c }),
  setMainType: (t) => set({ mainType: t }),
  toggleCategory: (c) => {
    const { categories } = get();
    set({
      categories: categories.includes(c)
        ? categories.filter((x) => x !== c)
        : [...categories, c],
    });
  },
  addCustomType: (t) => set((state)=>({ customTypes:[...new Set([...state.customTypes,t])] })),
  removeType: (t) => set((state)=>{
    if(state.customTypes.length<=1) return state; // 至少保留一個
    return { customTypes: state.customTypes.filter(x=>x!==t), mainType: state.mainType===t?null:state.mainType };
  }),
  clearCategories: () => set({ categories: [] }),
})); 