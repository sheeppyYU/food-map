import * as SQLite from 'expo-sqlite';

// 定義 SQLite 相關類型
type SQLTransaction = {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: (transaction: SQLTransaction, resultSet: any) => void,
    errorCallback?: (transaction: SQLTransaction, error: Error) => void
  ) => void;
};

// 取得資料庫實例：新版可能只有 openDatabaseSync
const db: any = (SQLite as any).openDatabase
  ? // 舊 API
    (SQLite as any).openDatabase('pins.db')
  : // 新 API
    (SQLite as any).openDatabaseSync('pins.db');

// 讓初始化只執行一次，避免重複 ALTER TABLE 造成 duplicate column 例外
let didInit = false;  // 新增旗標

export type Pin = {
  id?: number;
  name: string;
  address: string;
  category: string;
  type: string; // 上層類型，如 美食 / 景點
  status: 'none' | 'want' | 'visited' | 'bad';
  note?: string;
  lat: number;
  lng: number;
  phone?: string;      // 新增電話欄位
  businessHours?: string;  // 新增營業時間欄位
};

export const initDB = () => {
  if (didInit) return; // 已初始化過就直接返回

  // 使用 execSync 直接執行 SQL 建表
  db.execSync?.(
    `CREATE TABLE IF NOT EXISTS pins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT '美食',
        status TEXT DEFAULT 'none',
        note TEXT,
        lat REAL,
        lng REAL,
        phone TEXT,
        businessHours TEXT
      );`
  );

  // 取得目前欄位清單，僅在缺少時才 ALTER TABLE
  let existingColumns: string[] = [];
  try {
    // PRAGMA table_info 回傳陣列，每筆含 name, type 等欄位
    const tableInfo = db.getAllSync?.('PRAGMA table_info(pins);') || [];
    existingColumns = tableInfo.map((c: any) => c.name as string);
  } catch {}

  const ensureColumn = (name: string, sqlType: string) => {
    if (!existingColumns.includes(name)) {
  try {
        db.execSync?.(`ALTER TABLE pins ADD COLUMN ${name} ${sqlType};`);
  } catch {}
    }
  };

  ensureColumn('lat', 'REAL');
  ensureColumn('lng', 'REAL');
  ensureColumn('type', "TEXT DEFAULT '美食'");
  ensureColumn('phone', 'TEXT');
  ensureColumn('businessHours', 'TEXT');

  didInit = true; // 標記完成
};

export const insertPin = (pin: Pin, callback: () => void) => {
  db.runSync?.(
    'INSERT INTO pins (name, address, category, type, status, note, lat, lng, phone, businessHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    pin.name,
    pin.address,
    pin.category,
    pin.type,
    pin.status,
    pin.note || '',
    pin.lat,
    pin.lng,
    pin.phone || null,
    pin.businessHours || null,
  );
  callback();
};

export const getAllPins = (callback: (pins: Pin[]) => void) => {
  const rows: Pin[] = db.getAllSync?.('SELECT * FROM pins;') || [];
  callback(rows);
};

export const deletePin = (id: number, callback: () => void) => {
  db.runSync?.('DELETE FROM pins WHERE id = ?;', id);
  callback();
};

// 刪除所有 Pins（測試用）
export const clearAllPins = (callback?: () => void) => {
  db.runSync?.('DELETE FROM pins;');
  callback?.();
};



export const seedFakePins = (callback: () => void) => {
  const fakePins: Pin[] = [
    { name: '台北 101', type: '美食', address: '台北市信義區市府路45號', category: '日式', status: 'visited', note: '夜景超讚', lat:25.033964, lng:121.564468, phone: '02-1234-5678', businessHours: '禮拜一：10:00~22:00\n禮拜二：10:00~22:00\n禮拜三：10:00~22:00\n禮拜四：10:00~22:00\n禮拜五：10:00~22:00\n禮拜六：10:00~22:00\n禮拜日：10:00~22:00' },
    { name: '士林夜市', type: '美食', address: '台北市士林區基河路101號', category: '小吃', status: 'want', note: '', lat:25.089406, lng:121.524296, phone: '02-2345-6789', businessHours: '禮拜一：17:00~01:00\n禮拜二：17:00~01:00\n禮拜三：17:00~01:00\n禮拜四：17:00~01:00\n禮拜五：17:00~02:00\n禮拜六：17:00~02:00\n禮拜日：17:00~01:00' },
    { name: '宮原眼科', type: '景點', address: '台中市中區中山路20號', category: '甜點', status: 'none', note: '冰淇淋好吃', lat:24.137587, lng:120.684812, phone: '04-1234-5678', businessHours: '禮拜一：10:00~22:00\n禮拜二：10:00~22:00\n禮拜三：10:00~22:00\n禮拜四：10:00~22:00\n禮拜五：10:00~22:00\n禮拜六：10:00~22:00\n禮拜日：10:00~22:00' },
    { name: '駁二藝術特區', type: '景點', address: '高雄市鹽埕區大勇路1號', category: '藝術', status: 'visited', note: '', lat:22.608462, lng:120.298969, phone: '07-1234-5678', businessHours: '禮拜一：10:00~18:00\n禮拜二：10:00~18:00\n禮拜三：休假\n禮拜四：10:00~18:00\n禮拜五：10:00~18:00\n禮拜六：10:00~20:00\n禮拜日：10:00~20:00' },
    { name: '基隆廟口夜市', type: '美食', address: '基隆市仁愛區仁三路', category: '夜市', status: 'want', note: '海鮮多', lat:25.12825, lng:121.741302, phone: '02-3456-7890', businessHours: '禮拜一：17:00~01:00\n禮拜二：17:00~01:00\n禮拜三：17:00~01:00\n禮拜四：17:00~01:00\n禮拜五：17:00~02:00\n禮拜六：17:00~02:00\n禮拜日：17:00~01:00' },
    { name: '新竹城隍廟', type: '景點', address: '新竹市北區中山路75號', category: '古蹟', status: 'none', note: '', lat:24.804331, lng:120.971094, phone: '03-1234-5678', businessHours: '禮拜一：06:00~21:00\n禮拜二：06:00~21:00\n禮拜三：06:00~21:00\n禮拜四：06:00~21:00\n禮拜五：06:00~21:00\n禮拜六：06:00~21:00\n禮拜日：06:00~21:00' },
    { name: '花蓮東大門夜市', type: '美食', address: '花蓮縣花蓮市中山路50號', category: '夜市', status: 'visited', note: '炸蛋蔥油餅', lat:23.978302, lng:121.604227, phone: '03-2345-6789', businessHours: '禮拜一：17:00~23:00\n禮拜二：17:00~23:00\n禮拜三：17:00~23:00\n禮拜四：17:00~23:00\n禮拜五：17:00~24:00\n禮拜六：17:00~24:00\n禮拜日：17:00~23:00' },
    { name: '台東鐵花村', type: '景點', address: '台東縣台東市新生路135巷26號', category: '文創', status: 'bad', note: '', lat:22.758338, lng:121.150596, phone: '089-123456', businessHours: '禮拜一：休假\n禮拜二：休假\n禮拜三：19:00~22:00\n禮拜四：19:00~22:00\n禮拜五：19:00~23:00\n禮拜六：19:00~23:00\n禮拜日：19:00~22:00' },
    { name: '鹿港天后宮', type: '景點', address: '彰化縣鹿港鎮中山路430號', category: '宗教', status: 'none', note: '香火鼎盛', lat:24.056, lng:120.4347, phone: '04-777-1234', businessHours: '禮拜一：05:00~21:00\n禮拜二：05:00~21:00\n禮拜三：05:00~21:00\n禮拜四：05:00~21:00\n禮拜五：05:00~21:00\n禮拜六：05:00~21:00\n禮拜日：05:00~21:00' },
    { name: '阿里山神木', type: '景點', address: '嘉義縣阿里山鄉', category: '自然', status: 'want', note: '', lat:23.5139, lng:120.8088, phone: '05-123-4567', businessHours: '禮拜一：24小時開放\n禮拜二：24小時開放\n禮拜三：24小時開放\n禮拜四：24小時開放\n禮拜五：24小時開放\n禮拜六：24小時開放\n禮拜日：24小時開放' },
  ];

  const tainanPlaces: {name:string,address:string,lat:number,lng:number,category:string,type:string,note:string,status:'none'|'want'|'visited'|'bad',phone:string,businessHours:string}[] = [
    {name:'赤崁樓', address:'台南市中西區民族路二段212號', lat:23.000992, lng:120.202496, category:'古蹟', type:'景點', note:'歷史建築', status:'visited', phone:'06-220-5647', businessHours:'禮拜一：08:30~17:30\n禮拜二：08:30~17:30\n禮拜三：08:30~17:30\n禮拜四：08:30~17:30\n禮拜五：08:30~17:30\n禮拜六：08:30~17:30\n禮拜日：08:30~17:30'},
    {name:'台南花園夜市', address:'台南市北區海安路三段533號', lat:23.005426, lng:120.204818, category:'夜市', type:'美食', note:'', status:'want', phone:'06-358-2299', businessHours:'禮拜一：休假\n禮拜二：休假\n禮拜三：休假\n禮拜四：17:00~01:00\n禮拜五：休假\n禮拜六：17:00~01:00\n禮拜日：17:00~01:00'},
    {name:'安平老街', address:'台南市安平區延平街', lat:23.002698, lng:120.160763, category:'小吃', type:'美食', note:'', status:'none', phone:'06-391-1111', businessHours:'禮拜一：09:00~21:00\n禮拜二：09:00~21:00\n禮拜三：09:00~21:00\n禮拜四：09:00~21:00\n禮拜五：09:00~22:00\n禮拜六：09:00~22:00\n禮拜日：09:00~21:00'},
    {name:'安平古堡', address:'台南市安平區國勝路82號', lat:23.002713, lng:120.159225, category:'古蹟', type:'景點', note:'', status:'visited', phone:'06-226-7348', businessHours:'禮拜一：08:30~17:30\n禮拜二：08:30~17:30\n禮拜三：08:30~17:30\n禮拜四：08:30~17:30\n禮拜五：08:30~17:30\n禮拜六：08:30~17:30\n禮拜日：08:30~17:30'},
    {name:'億載金城', address:'台南市安平區光州路3號', lat:23.004555, lng:120.153694, category:'古蹟', type:'景點', note:'', status:'none', phone:'06-295-1504', businessHours:'禮拜一：08:30~17:30\n禮拜二：08:30~17:30\n禮拜三：08:30~17:30\n禮拜四：08:30~17:30\n禮拜五：08:30~17:30\n禮拜六：08:30~17:30\n禮拜日：08:30~17:30'},
    {name:'台南孔廟', address:'台南市中西區南門路2號', lat:22.991146, lng:120.204271, category:'古蹟', type:'景點', note:'', status:'visited', phone:'06-228-9013', businessHours:'禮拜一：08:30~17:30\n禮拜二：08:30~17:30\n禮拜三：08:30~17:30\n禮拜四：08:30~17:30\n禮拜五：08:30~17:30\n禮拜六：08:30~17:30\n禮拜日：08:30~17:30'},
    {name:'藍晒圖文創園區', address:'台南市南區西門路一段689巷', lat:22.987751, lng:120.198286, category:'文創', type:'景點', note:'', status:'want', phone:'06-222-7195', businessHours:'禮拜一：休假\n禮拜二：10:00~21:00\n禮拜三：10:00~21:00\n禮拜四：10:00~21:00\n禮拜五：10:00~21:00\n禮拜六：10:00~21:00\n禮拜日：10:00~21:00'},
    {name:'國華街小吃', address:'台南市中西區國華街', lat:22.996887, lng:120.197712, category:'小吃', type:'美食', note:'米糕必吃', status:'visited', phone:'06-225-1429', businessHours:'禮拜一：09:00~21:00\n禮拜二：09:00~21:00\n禮拜三：09:00~21:00\n禮拜四：09:00~21:00\n禮拜五：09:00~22:00\n禮拜六：09:00~22:00\n禮拜日：09:00~21:00'},
    {name:'台南正興街', address:'台南市中西區正興街', lat:22.996129, lng:120.195876, category:'甜點', type:'美食', note:'', status:'none', phone:'06-221-3901', businessHours:'禮拜一：11:00~21:00\n禮拜二：11:00~21:00\n禮拜三：11:00~21:00\n禮拜四：11:00~21:00\n禮拜五：11:00~22:00\n禮拜六：11:00~22:00\n禮拜日：11:00~21:00'},
    {name:'奇美博物館', address:'台南市仁德區文華路二段66號', lat:22.924594, lng:120.227992, category:'博物館', type:'景點', note:'歐式建築', status:'visited', phone:'06-266-0808', businessHours:'禮拜一：休假\n禮拜二：09:30~17:30\n禮拜三：09:30~17:30\n禮拜四：09:30~17:30\n禮拜五：09:30~17:30\n禮拜六：09:30~17:30\n禮拜日：09:30~17:30'},
    {name:'十鼓文創園區', address:'台南市仁德區文華路二段271號', lat:22.925718, lng:120.227034, category:'文創', type:'景點', note:'鼓表演', status:'none', phone:'06-266-2225', businessHours:'禮拜一：09:00~17:00\n禮拜二：09:00~17:00\n禮拜三：09:00~17:00\n禮拜四：09:00~17:00\n禮拜五：09:00~21:00\n禮拜六：09:00~21:00\n禮拜日：09:00~17:00'},
    {name:'武聖夜市', address:'台南市中西區中華西路二段', lat:22.995212, lng:120.184967, category:'夜市', type:'美食', note:'', status:'want', phone:'06-223-4567', businessHours:'禮拜一：17:00~01:00\n禮拜二：休假\n禮拜三：17:00~01:00\n禮拜四：休假\n禮拜五：17:00~01:00\n禮拜六：17:00~01:00\n禮拜日：休假'},
    {name:'大東夜市', address:'台南市東區林森路一段276號', lat:22.986544, lng:120.224861, category:'夜市', type:'美食', note:'', status:'none', phone:'06-208-9876', businessHours:'禮拜一：17:00~01:00\n禮拜二：17:00~01:00\n禮拜三：休假\n禮拜四：休假\n禮拜五：17:00~01:00\n禮拜六：17:00~01:00\n禮拜日：17:00~01:00'},
    {name:'保安路美食', address:'台南市中西區保安路', lat:22.993771, lng:120.196675, category:'小吃', type:'美食', note:'', status:'visited', phone:'06-220-8765', businessHours:'禮拜一：08:00~20:00\n禮拜二：08:00~20:00\n禮拜三：08:00~20:00\n禮拜四：08:00~20:00\n禮拜五：08:00~21:00\n禮拜六：08:00~21:00\n禮拜日：08:00~20:00'},
    {name:'永樂市場', address:'台南市中西區國華街三段16巷25號', lat:22.996466, lng:120.195132, category:'市場', type:'美食', note:'', status:'none', phone:'06-225-4321', businessHours:'禮拜一：06:00~14:00\n禮拜二：06:00~14:00\n禮拜三：06:00~14:00\n禮拜四：06:00~14:00\n禮拜五：06:00~14:00\n禮拜六：06:00~14:00\n禮拜日：06:00~14:00'},
    {name:'林百貨', address:'台南市中西區忠義路二段63號', lat:22.995630, lng:120.205513, category:'百貨', type:'景點', note:'', status:'visited', phone:'06-221-3000', businessHours:'禮拜一：11:00~22:00\n禮拜二：11:00~22:00\n禮拜三：11:00~22:00\n禮拜四：11:00~22:00\n禮拜五：11:00~22:00\n禮拜六：11:00~22:00\n禮拜日：11:00~22:00'},
    {name:'台南藝術大學', address:'台南市官田區大崎里66號', lat:23.205030, lng:120.315566, category:'藝術', type:'景點', note:'', status:'none', phone:'06-693-0100', businessHours:'禮拜一：08:00~17:00\n禮拜二：08:00~17:00\n禮拜三：08:00~17:00\n禮拜四：08:00~17:00\n禮拜五：08:00~17:00\n禮拜六：休假\n禮拜日：休假'},
    {name:'四草綠色隧道', address:'台南市安南區大眾路360號', lat:23.035009, lng:120.119118, category:'生態', type:'景點', note:'', status:'want', phone:'06-284-1610', businessHours:'禮拜一：08:00~17:00\n禮拜二：08:00~17:00\n禮拜三：08:00~17:00\n禮拜四：08:00~17:00\n禮拜五：08:00~17:00\n禮拜六：08:00~17:00\n禮拜日：08:00~17:00'},
    {name:'台南市立美術館二館', address:'台南市中西區忠義路二段1號', lat:22.991760, lng:120.201845, category:'博物館', type:'景點', note:'', status:'none', phone:'06-221-8881', businessHours:'禮拜一：休假\n禮拜二：09:00~17:00\n禮拜三：09:00~17:00\n禮拜四：09:00~17:00\n禮拜五：09:00~21:00\n禮拜六：09:00~21:00\n禮拜日：09:00~17:00'},
    {name:'台南肉圓-富盛號', address:'台南市中西區府前路一段181號', lat:22.991819, lng:120.195964, category:'小吃', type:'美食', note:'', status:'visited', phone:'06-222-5179', businessHours:'禮拜一：08:00~19:00\n禮拜二：08:00~19:00\n禮拜三：08:00~19:00\n禮拜四：08:00~19:00\n禮拜五：08:00~19:00\n禮拜六：08:00~19:00\n禮拜日：08:00~19:00'},
    {name:'義豐冬瓜茶', address:'台南市中西區民生路二段232號', lat:22.997370, lng:120.201462, category:'飲品', type:'美食', note:'', status:'none', phone:'06-225-8351', businessHours:'禮拜一：09:00~21:00\n禮拜二：09:00~21:00\n禮拜三：09:00~21:00\n禮拜四：09:00~21:00\n禮拜五：09:00~21:00\n禮拜六：09:00~21:00\n禮拜日：09:00~21:00'},
    {name:'神農街', address:'台南市中西區神農街', lat:22.996235, lng:120.189667, category:'文創', type:'景點', note:'', status:'none', phone:'06-221-1111', businessHours:'禮拜一：10:00~22:00\n禮拜二：10:00~22:00\n禮拜三：10:00~22:00\n禮拜四：10:00~22:00\n禮拜五：10:00~23:00\n禮拜六：10:00~23:00\n禮拜日：10:00~22:00'},
    {name:'府中街', address:'台南市中西區府中街', lat:22.991428, lng:120.206101, category:'小吃', type:'美食', note:'', status:'none', phone:'06-228-1234', businessHours:'禮拜一：09:00~21:00\n禮拜二：09:00~21:00\n禮拜三：09:00~21:00\n禮拜四：09:00~21:00\n禮拜五：09:00~22:00\n禮拜六：09:00~22:00\n禮拜日：09:00~21:00'},
    {name:'樹屋 & 安平德記洋行', address:'台南市安平區古堡街108號', lat:23.000943, lng:120.158221, category:'古蹟', type:'景點', note:'', status:'visited', phone:'06-391-3901', businessHours:'禮拜一：08:30~17:30\n禮拜二：08:30~17:30\n禮拜三：08:30~17:30\n禮拜四：08:30~17:30\n禮拜五：08:30~17:30\n禮拜六：08:30~17:30\n禮拜日：08:30~17:30'},
    {name:'台南運河', address:'台南市安平區運河路', lat:22.997629, lng:120.180158, category:'景觀', type:'景點', note:'', status:'none', phone:'06-299-1111', businessHours:'禮拜一：24小時開放\n禮拜二：24小時開放\n禮拜三：24小時開放\n禮拜四：24小時開放\n禮拜五：24小時開放\n禮拜六：24小時開放\n禮拜日：24小時開放'},
    {name:'水交社文化園區', address:'台南市南區興中街118號', lat:22.979259, lng:120.200246, category:'博物館', type:'景點', note:'', status:'none'},
    {name:'小西腳庄', address:'台南市南區金華路四段6號', lat:22.985731, lng:120.193584, category:'小吃', type:'美食', note:'', status:'want'},
    {name:'阿堂鹹粥', address:'台南市中西區西門路一段728號', lat:22.992999, lng:120.188119, category:'小吃', type:'美食', note:'', status:'visited'},
    {name:'矮仔成蝦仁飯', address:'台南市中西區海安路一段66號', lat:22.996104, lng:120.196548, category:'小吃', type:'美食', note:'', status:'none'},
    {name:'雙生綠豆沙牛奶', address:'台南市東區崇學路141號', lat:22.979696, lng:120.227825, category:'飲品', type:'美食', note:'', status:'none'},
    {name:'文章牛肉湯', address:'台南市安平區安平路300號', lat:22.998798, lng:120.162222, category:'牛肉湯', type:'美食', note:'', status:'visited'},
    {name:'修安扁擔豆花', address:'台南市中西區國華街三段157號', lat:22.995998, lng:120.197451, category:'甜點', type:'美食', note:'', status:'none'},
    {name:'泰成水果店', address:'台南市中西區民生路一段122號', lat:22.995225, lng:120.202853, category:'甜點', type:'美食', note:'', status:'none'},
    {name:'進福炒鱔魚', address:'台南市中西區民族路三段89號', lat:22.997965, lng:120.199682, category:'小吃', type:'美食', note:'', status:'bad'},
    {name:'山根壽司', address:'台南市北區公園南路98號', lat:23.002924, lng:120.210958, category:'日式', type:'美食', note:'', status:'visited'},
    {name:'友愛街旅館', address:'台南市中西區友愛街115巷5號', lat:22.996746, lng:120.193252, category:'住宿', type:'景點', note:'', status:'none'},
    {name:'烤鴨三吃-阿輝', address:'台南市南區新忠路70號', lat:22.978312, lng:120.195870, category:'小吃', type:'美食', note:'', status:'want'},
    {name:'台南市立棒球場', address:'台南市南區健康路一段257號', lat:22.975781, lng:120.197419, category:'運動', type:'景點', note:'', status:'none'},
    {name:'安平漁人碼頭', address:'台南市安平區運河路', lat:22.997905, lng:120.166901, category:'景觀', type:'景點', note:'', status:'visited'},
    {name:'麻豆代天府', address:'台南市麻豆區關帝廟60號', lat:23.182264, lng:120.245762, category:'宗教', type:'景點', note:'', status:'none'},
    {name:'六千牛肉湯', address:'台南市北區成功路62號', lat:22.997204, lng:120.207746, category:'牛肉湯', type:'美食', note:'', status:'visited'},
    {name:'小北成功臭豆腐', address:'台南市北區公園北路兒童游樂場旁', lat:23.004058, lng:120.210478, category:'小吃', type:'美食', note:'', status:'none'},
    {name:'和意路蝦仁飯', address:'台南市中西區和意路84號', lat:22.995155, lng:120.202492, category:'小吃', type:'美食', note:'', status:'visited'},
    {name:'七股鹽山', address:'台南市七股區', lat:23.133436, lng:120.115600, category:'景點', type:'景點', note:'', status:'none'},
    {name:'西井村蜂蜜蛋糕', address:'台南市南區金華路二段301號', lat:22.983943, lng:120.193038, category:'甜點', type:'美食', note:'', status:'none'},
    {name:'文章炒鱔魚', address:'台南市中西區國華街三段113號', lat:22.996414, lng:120.197049, category:'小吃', type:'美食', note:'', status:'bad'},
    {name:'阿裕牛肉涮涮鍋', address:'台南市仁德區中正路一段525號', lat:22.930856, lng:120.236924, category:'火鍋', type:'美食', note:'', status:'visited'},
    {name:'台南地方法院', address:'台南市南區健康路一段370號', lat:22.975344, lng:120.203775, category:'建築', type:'景點', note:'', status:'none'},
    {name:'甘單咖啡', address:'台南市中西區開山路94巷32弄12號', lat:22.991764, lng:120.206644, category:'咖啡', type:'美食', note:'', status:'none'},
    {name:'台南誠品文化中心', address:'台南市東區中華東路三段360號', lat:22.993550, lng:120.225442, category:'百貨', type:'景點', note:'', status:'none'},
    {name:'咖啡毛巾', address:'台南市北區成功路630號', lat:22.997754, lng:120.208916, category:'咖啡', type:'美食', note:'', status:'want'},
    {name:'冰鄉芒果冰', address:'台南市中西區民生路一段160號', lat:22.995165, lng:120.203451, category:'甜點', type:'美食', note:'', status:'visited'},
    {name:'台江國家公園遊客中心', address:'台南市安南區四草大道118號', lat:23.041801, lng:120.126896, category:'生態', type:'景點', note:'', status:'none'},
    {name:'台南小卷米粉-矮仔炊', address:'台南市北區公園南路138號', lat:23.001924, lng:120.210349, category:'小吃', type:'美食', note:'', status:'none'},
    {name:'大遠百威秀影城', address:'台南市東區前鋒路250號', lat:22.987331, lng:120.223764, category:'娛樂', type:'景點', note:'', status:'none'},
  ];

  // 為所有台南地點添加預設的電話和營業時間（前20個已經有了，從第21個開始）
  const allTainanPlaces = tainanPlaces.map((place, idx) => {
    // 前20個已經有電話和營業時間了
    if (idx < 20 && 'phone' in place) {
      return place as Pin;
    }
    // 為剩餘的項目添加預設值
    return {
      ...place,
      phone: `06-2557366`,
      businessHours: '禮拜一：09:00~21:00\n禮拜二：09:00~21:00\n禮拜三：09:00~21:00\n禮拜四：09:00~21:00\n禮拜五：09:00~22:00\n禮拜六：09:00~22:00\n禮拜日：09:00~21:00'
    } as Pin;
  });

  let inserted = 0;
  const totalPins = fakePins.length + allTainanPlaces.length;
  
  fakePins.forEach(pin => {
    insertPin(pin, () => {
      inserted++;
      if (inserted === totalPins) callback();
    });
  });

  allTainanPlaces.forEach(place => {
    insertPin(place as Pin, () => {
      inserted++;
      if (inserted === totalPins) callback();
    });
  });
};

export const updatePin = (id: number, pin: Pin, callback: () => void) => {
  db.runSync?.(
    'UPDATE pins SET name = ?, address = ?, category = ?, type = ?, status = ?, note = ?, lat = ?, lng = ?, phone = ?, businessHours = ? WHERE id = ?;',
    pin.name,
    pin.address,
    pin.category,
    pin.type,
    pin.status,
    pin.note || '',
    pin.lat,
    pin.lng,
    pin.phone || null,
    pin.businessHours || null,
    id,
  );
  callback();
};

export const seedClusterPins = (count = 200, callback: () => void) => {
  const pins: Pin[] = [];
  for (let i = 0; i < count; i++) {
    const lat = 25.033 + (Math.random() - 0.5) * 0.01; // 約 +-0.005 度 ~ 500m
    const lng = 121.5654 + (Math.random() - 0.5) * 0.01;
    pins.push({
      name: `測試Pin${i+1}`,
      address: '台北市信義區市府路45號',
      category: '測試',
      type: '景點',
      status: 'none',
      note: '',
      lat,
      lng,
    });
  }
  let inserted = 0;
  pins.forEach(p=>{
    insertPin(p, ()=>{ inserted++; if(inserted===pins.length) callback(); });
  });
};

// 新增示範資料
const DEMO_PINS: Pin[] = [
  // 美食類 (50筆)
  {
    name: "鼎泰豐",
    address: "台北市信義區松高路12號",
    category: "中式",
    type: "美食",
    status: "visited",
    note: "小籠包必點，建議提前訂位",
    lat: 25.0330,
    lng: 121.5654,
    phone: "02-2345-6789",
    businessHours: "11:00-21:30"
  },
  {
    name: "一蘭拉麵",
    address: "台北市信義區松仁路97號",
    category: "日式",
    type: "美食",
    status: "want",
    note: "24小時營業，深夜食堂好選擇",
    lat: 25.0335,
    lng: 121.5658,
    phone: "02-2345-6790",
    businessHours: "24小時"
  },
  {
    name: "添好運",
    address: "台北市信義區松高路68號",
    category: "港式",
    type: "美食",
    status: "visited",
    lat: 25.0332,
    lng: 121.5656,
    phone: "02-2345-6791",
    businessHours: "10:00-22:00"
  },
  {
    name: "春水堂",
    address: "台北市信義區松高路58號",
    category: "飲品",
    type: "美食",
    status: "none",
    note: "珍珠奶茶創始店",
    lat: 25.0331,
    lng: 121.5655,
    phone: "02-2345-6792",
    businessHours: "11:00-22:00"
  },
  {
    name: "星巴克",
    address: "台北市信義區松高路20號",
    category: "咖啡",
    type: "美食",
    status: "visited",
    lat: 25.0333,
    lng: 121.5657,
    phone: "02-2345-6793",
    businessHours: "07:00-22:00"
  },
  // ... 繼續添加更多美食類的示範資料 ...

  // 景點類 (20筆)
  {
    name: "台北101",
    address: "台北市信義區信義路五段7號",
    category: "建築",
    type: "景點",
    status: "visited",
    note: "觀景台視野絕佳，建議傍晚前往",
    lat: 25.0336,
    lng: 121.5659,
    phone: "02-2345-6794",
    businessHours: "09:00-22:00"
  },
  {
    name: "國立故宮博物院",
    address: "台北市士林區至善路二段221號",
    category: "博物館",
    type: "景點",
    status: "want",
    note: "世界級博物館，建議預約導覽",
    lat: 25.1024,
    lng: 121.5487,
    phone: "02-2345-6795",
    businessHours: "08:30-18:30"
  },
  {
    name: "台北市立動物園",
    address: "台北市文山區新光路二段30號",
    category: "生態",
    type: "景點",
    status: "visited",
    lat: 24.9984,
    lng: 121.5804,
    phone: "02-2345-6796",
    businessHours: "09:00-17:00"
  },
  {
    name: "龍山寺",
    address: "台北市萬華區廣州街211號",
    category: "宗教",
    type: "景點",
    status: "none",
    note: "香火鼎盛，建築精美",
    lat: 25.0375,
    lng: 121.4997,
    phone: "02-2345-6797",
    businessHours: "06:00-22:00"
  },
  {
    name: "華山1914文創園區",
    address: "台北市中正區八德路一段1號",
    category: "文創",
    type: "景點",
    status: "visited",
    lat: 25.0442,
    lng: 121.5295,
    phone: "02-2345-6798",
    businessHours: "09:30-21:00"
  },
  // ... 繼續添加更多景點類的示範資料 ...
];

// 新增匯入示範資料的函數
export const importDemoData = (callback?: () => void) => {
  initDB();
  // 先清空現有資料
  db.transaction((tx: SQLTransaction) => {
    tx.executeSql('DELETE FROM pins', [], () => {
      // 然後插入示範資料
      DEMO_PINS.forEach(pin => {
        tx.executeSql(
          'INSERT INTO pins (name, address, category, type, status, note, lat, lng, phone, businessHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [pin.name, pin.address, pin.category, pin.type, pin.status, pin.note || null, pin.lat, pin.lng, pin.phone || null, pin.businessHours || null]
        );
      });
    });
  }, 
  (error: Error) => {
    console.error('匯入示範資料失敗：', error);
  },
  () => {
    console.log('示範資料匯入成功！');
    if (callback) callback();
  });
};

// 新增更新狀態的方法
// 批量更新指定類型的 Pin 到新類型
export const updatePinsType = (oldType: string, newType: string, callback?: () => void) => {
  initDB();
  db.runSync?.('UPDATE pins SET type = ? WHERE type = ?;', newType, oldType);
  if (callback) callback();
};

// 批量更新指定分類的 Pin 到新分類
export const updatePinsCategory = (oldCategory: string, newCategory: string, typeFilter?: string, callback?: () => void) => {
  initDB();
  if (typeFilter) {
    db.runSync?.('UPDATE pins SET category = ? WHERE category = ? AND type = ?;', newCategory, oldCategory, typeFilter);
  } else {
    db.runSync?.('UPDATE pins SET category = ? WHERE category = ?;', newCategory, oldCategory);
  }
  if (callback) callback();
};

// 刪除指定類型的所有 Pin
export const deletePinsByType = (type: string, callback?: () => void) => {
  initDB();
  db.runSync?.('DELETE FROM pins WHERE type = ?;', type);
  if (callback) callback();
};

// 刪除指定分類的所有 Pin
export const deletePinsByCategory = (category: string, typeFilter?: string, callback?: () => void) => {
  initDB();
  if (typeFilter) {
    db.runSync?.('DELETE FROM pins WHERE category = ? AND type = ?;', category, typeFilter);
  } else {
    db.runSync?.('DELETE FROM pins WHERE category = ?;', category);
  }
  if (callback) callback();
};

export const updatePinStatus = (id: number, status: Pin['status'], callback?: () => void) => {
  initDB();
  db.transaction((tx: SQLTransaction) => {
    tx.executeSql(
      'UPDATE pins SET status = ? WHERE id = ?',
      [status, id],
      () => {
        console.log('Pin 狀態已更新！');
        if (callback) callback();
      },
      (_: SQLTransaction, error: Error) => {
        console.error('更新狀態失敗：', error);
        return false;
      }
    );
  });
}; 