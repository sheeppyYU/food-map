import { create } from 'zustand';
import { County } from '../models/Restaurant';

type State = {
  county: County | null;
  categories: string[];
  setCounty: (c: County | null) => void;
  toggleCategory: (c: string) => void;
};

export const useFilters = create<State>((set, get) => ({
  county: null,
  categories: [],
  setCounty: (c) => set({ county: c }),
  toggleCategory: (c) => {
    const { categories } = get();
    set({
      categories: categories.includes(c)
        ? categories.filter((x) => x !== c)
        : [...categories, c],
    });
  },
})); 