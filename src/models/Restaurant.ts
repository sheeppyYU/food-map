export type County =
  | '台北市' | '新北市' | '桃園市' | '台中市'
  | '台南市' | '高雄市' | '基隆市' | '新竹市'
  | '嘉義市' | '新竹縣' | '苗栗縣' | '彰化縣'
  | '南投縣' | '雲林縣' | '嘉義縣' | '屏東縣'
  | '宜蘭縣' | '花蓮縣' | '台東縣' | '澎湖縣'
  | '金門縣' | '連江縣';

export class Restaurant {
  constructor(
    public id: string,
    public name: string,
    public county: County,
    public categories: string[],
    public lat: number,
    public lng: number,
    public priceLevel: 1 | 2 | 3 | 4,
    public address: string,
    public note = '',
    public status: 'none' | 'want' | 'visited' | 'bad' = 'none',
    public createdAt = Date.now()
  ) {}

  toggleStatus(next: 'none' | 'want' | 'visited' | 'bad'): Restaurant {
    // 如果點擊當前狀態，則切換為 none
    const newStatus = this.status === next ? 'none' : next;
    
    return new Restaurant(
      this.id,
      this.name,
      this.county,
      this.categories,
      this.lat,
      this.lng,
      this.priceLevel,
      this.address,
      this.note,
      newStatus,
      this.createdAt
    );
  }
} 