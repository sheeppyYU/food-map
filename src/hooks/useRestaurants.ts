import { v4 as uuid } from 'uuid';
import { create } from 'zustand';
import { getAllPins, initDB, Pin } from '../models/PinDB';
import { County, Restaurant } from '../models/Restaurant';

type State = {
  list: Restaurant[];
  load: () => void;
  add: (r: Restaurant) => void;
  update: (r: Restaurant) => void;
  storePin: (data: { text: string; url: string }) => Promise<void>;
};

export const useRestaurants = create<State>((set, get) => ({
  list: [],
  load: () => {
    // 讀取 SQLite pins 並更新狀態
    initDB();
    getAllPins((pins) => {
      const restaurants = pins.map((p: Pin) => {
        // 粗略擷取地址開頭當作縣市
        let countyText = p.address.slice(0, 3);
        if (!/[縣市]$/.test(countyText)) {
          countyText += p.address[3] ?? '';
        }
        const countyCandidate = /[縣市]$/.test(countyText) ? countyText as County : null;

        return new Restaurant(
          String(p.id ?? uuid()),
          p.name,
          countyCandidate || '台北市',
          [p.category],
          p.lat ?? 0,
          p.lng ?? 0,
          1,
          p.address,
          p.type || '美食',
          p.note ?? '',
          (p.status ?? 'none') as any,
          Date.now(),
          p.phone,
          p.businessHours,
        );
      });

      // 先更新列表
      set({ list: restaurants });

      // 同步類型到 useFilters
      import('../hooks/useFilters').then(({ useFilters }) => {
        const { syncTypesFromPins } = useFilters.getState();
        syncTypesFromPins(pins);
      });

      // 補齊缺失縣市資訊
      (async () => {
        const updated: Restaurant[] = [];
        for (const r of restaurants) {
          if (!/[縣市]$/.test(r.county) && r.lat && r.lng) {
            try {
              const geo = await (await import('expo-location')).reverseGeocodeAsync({
                latitude: r.lat,
                longitude: r.lng,
              });
              if (geo.length) {
                const { region, subregion, city: cityName, district } = geo[0] as any;
                const pick = [region, subregion, cityName, district].find((x) =>
                  typeof x === 'string' && /[縣市]$/.test(x as string),
                );
                if (pick) {
                  const fixed = new Restaurant(
                    r.id,
                    r.name,
                    pick as County,
                    r.categories,
                    r.lat,
                    r.lng,
                    r.priceLevel,
                    r.address,
                    r.type,
                    r.note,
                    r.status,
                    r.createdAt,
                    r.phone,
                    r.businessHours,
                  );
                  updated.push(fixed);
                }
              }
            } catch {}
          }
        }
        if (updated.length) {
          set((state) => ({
            list: state.list.map((item) => updated.find((u) => u.id === item.id) || item),
          }));
        }
      })();
    });
  },
  add: (restaurant) => {
    set((state) => ({
      list: [...state.list, restaurant],
    }));
  },
  update: (restaurant) => {
    set((state) => ({
      list: state.list.map((r) => (r.id === restaurant.id ? restaurant : r)),
    }));
  },
  storePin: async ({ text, url }) => {
    const newRestaurant = new Restaurant(
      uuid(),
      text.slice(0, 50), // 使用文字的前 50 個字作為名稱
      '台北市', // 預設縣市
      [], // 預設分類
      25.0330, // 預設台北位置
      121.5654,
      1, // 預設價格等級
      url, // 地址
      '美食', // 預設上層類型
      text, // 備註
      'none', // 狀態
      Date.now(),
      '',
      '',
    );
    
    get().add(newRestaurant);
    // TODO: 儲存到本地儲存
  },
})); 