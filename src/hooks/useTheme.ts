import { create } from 'zustand';
import { SchemeA, SchemeB, ThemePalette } from '../theme/colors';

interface ThemeState {
  palette: ThemePalette;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  palette: SchemeA,
  toggle: () => {
    const current = get().palette;
    set({ palette: current.primary === SchemeA.primary ? SchemeB : SchemeA });
  },
})); 