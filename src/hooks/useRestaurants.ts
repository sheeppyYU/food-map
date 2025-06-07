import { v4 as uuid } from 'uuid';
import { create } from 'zustand';
import { Restaurant } from '../models/Restaurant';

type State = {
  list: Restaurant[];
  load: () => void;
  add: (r: Restaurant) => void;
  update: (r: Restaurant) => void;
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
  add: (r: Restaurant) => set({ list: [...get().list, r] }),
  update: (r: Restaurant) =>
    set({
      list: get().list.map((x: Restaurant) =>
        x.id === r.id
          ? new Restaurant(
              r.id,
              r.name,
              r.county,
              r.categories,
              r.lat,
              r.lng,
              r.priceLevel,
              r.address,
              r.note,
              r.status,
              r.createdAt
            )
          : x
      ),
    }),
})); 