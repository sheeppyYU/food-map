import React from 'react';
import { View } from 'react-native';
import { Button, Chip, Divider, Menu } from 'react-native-paper';
import { useFilters } from '../hooks/useFilters';
import type { County } from '../models/Restaurant';

const counties: County[] = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
];

const categoriesPreset = ['麵食', '燒肉', '甜點', '西餐'];

export default function FilterBar() {
  const { county, categories, setCounty, toggleCategory } = useFilters();
  const [open, setOpen] = React.useState(false);

  return (
    <View style={{ padding: 8 }}>
      {/* 縣市選單 */}
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button 
            mode="outlined" 
            onPress={() => setOpen(true)}
            style={{ borderColor: '#ff7f50' }}
            textColor="#ff7f50"
          >
            {county ?? '選擇縣市'}
          </Button>
        }>
        {counties.map((c) => (
          <Menu.Item
            key={c}
            title={c}
            onPress={() => {
              setCounty(c as County);
              setOpen(false);
            }}
          />
        ))}
        <Menu.Item
          title="全部縣市"
          onPress={() => {
            setCounty(null);
            setOpen(false);
          }}
        />
      </Menu>

      <Divider style={{ marginVertical: 6 }} />

      {/* 分類 Chips：改為自動換行 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {categoriesPreset.map((cat) => (
          <Chip
            key={cat}
            mode="outlined"
            selected={categories.includes(cat)}
            style={{ 
              margin: 4,
              borderColor: categories.includes(cat) ? '#ff7f50' : '#ccc',
              backgroundColor: categories.includes(cat) ? '#ff7f50' : '#fff',
            }}
            textStyle={{ 
              fontSize: 14,
              color: categories.includes(cat) ? '#fff' : '#333',
            }}
            selectedColor="#fff"
            showSelectedCheck={false}
            onPress={() => toggleCategory(cat)}
          >
            {cat}
          </Chip>
        ))}
      </View>
    </View>
  );
} 