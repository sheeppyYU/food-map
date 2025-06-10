import { v4 as uuid } from 'uuid';
import { create } from 'zustand';
import { Restaurant } from '../models/Restaurant';

type State = {
  list: Restaurant[];
  load: () => void;
  add: (r: Restaurant) => void;
  update: (r: Restaurant) => void;
  storePin: (data: { text: string; url: string }) => Promise<void>;
};

export const useRestaurants = create<State>((set, get) => ({
  list: [],
  load: () =>
    set({
      list: [
        new Restaurant(
          uuid(),
          '富錦樹台菜',
          '台北市',
          ['台菜'],
          25.048,
          121.546,
          3,
          '松山區富錦街 100 號'
        ),
        new Restaurant(
          uuid(),
          '舞鶴和牛燒肉',
          '台中市',
          ['燒肉'],
          24.154,
          120.666,
          4,
          '西區忠明南路 50 號'
        ),
        new Restaurant(
          uuid(),
          '瑞暘漢堡店',
          '台南市',
          ['漢堡', '美式'],
          23.047,
          120.197,
          2,
          '安南區海佃路四段147號'
        ),
      ],
    }),
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
      url, // 使用 URL 作為地址
      text, // 使用完整文字作為備註
      'none', // 預設狀態
      Date.now() // 建立時間
    );
    
    get().add(newRestaurant);
    // TODO: 儲存到本地儲存
  },
})); 